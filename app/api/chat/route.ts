import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Type, type FunctionDeclaration } from '@google/genai'
import { createTransaction } from '@/lib/transactions'
import { summarizeLedger, type LedgerMetric } from '@/lib/ledger'

export const dynamic = 'force-dynamic'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

const SYSTEM = `You are the finance assistant for a music studio. You help the owner record and report money spent and received.

- To record money, call add_transaction. Infer type ("spent" or "received"), amount (a positive number), a short description, and an optional category. If the user gives a date ("yesterday", "on the 3rd"), pass occurredOn as YYYY-MM-DD; otherwise omit it (defaults to today).
- To answer questions about totals ("how much did I spend this month", "what's my net"), call query_ledger with the right metric and date range (from/to as YYYY-MM-DD). "received" already includes student fee payments.
- Currency is Indian Rupees (₹).
- Reply with only the final answer, concise and friendly. Do not narrate your reasoning or tool calls.`

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'add_transaction',
    description: 'Record money spent or received in the studio ledger.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['spent', 'received'] },
        amount: { type: Type.NUMBER, description: 'Positive amount in rupees' },
        description: { type: Type.STRING },
        category: { type: Type.STRING },
        occurredOn: { type: Type.STRING, description: 'YYYY-MM-DD; omit for today' },
      },
      required: ['type', 'amount', 'description'],
    },
  },
  {
    name: 'query_ledger',
    description:
      'Calculate totals from the ledger. "received" also includes student fee payments.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        metric: { type: Type.STRING, enum: ['spent', 'received', 'net', 'list'] },
        from: { type: Type.STRING, description: 'YYYY-MM-DD inclusive' },
        to: { type: Type.STRING, description: 'YYYY-MM-DD exclusive' },
        category: { type: Type.STRING },
      },
      required: ['metric'],
    },
  },
]

async function runTool(
  name: string,
  args: Record<string, any>,
  actions: string[],
): Promise<unknown> {
  if (name === 'add_transaction') {
    const tx = await createTransaction({
      type: args.type,
      amount: Number(args.amount),
      description: String(args.description ?? ''),
      category: args.category,
      occurredOn: args.occurredOn,
      source: 'chat',
    })
    actions.push('add_transaction')
    return { ok: true, id: tx.id, recorded: { type: tx.type, amount: tx.amount } }
  }
  if (name === 'query_ledger') {
    return summarizeLedger({
      metric: args.metric as LedgerMetric,
      from: args.from,
      to: args.to,
      category: args.category,
    })
  }
  return { ok: false, error: `Unknown tool ${name}` }
}

// Gemini's free tier intermittently returns 503 UNAVAILABLE ("high demand") or
// 429 RESOURCE_EXHAUSTED. These are transient, so retry a few times with a short
// exponential backoff before giving up. Kept small to stay within the serverless
// function timeout.
function isTransient(err: any): boolean {
  const s = err?.status ?? err?.code
  return s === 503 || s === 429 || s === 500
}

// Try the primary model, then fall back to an alternate when the primary is
// overloaded — a different model has separate capacity, so it usually answers
// when the main one is jammed. Each model gets a couple of quick retries.
// Fallback defaults to gemini-2.5-flash-lite: it's a separate model (own
// capacity when 2.5-flash is overloaded) and has free-tier quota — unlike
// gemini-2.0-flash, which returns 429 quota-exceeded on the free tier.
const MODELS = [MODEL, process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite']
  .filter((m, i, arr) => m && arr.indexOf(m) === i)

async function generateWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI['models']['generateContent']>[0],
  attemptsPerModel = 2,
) {
  let lastErr: unknown
  for (const model of MODELS) {
    for (let a = 0; a < attemptsPerModel; a++) {
      try {
        return await ai.models.generateContent({ ...params, model })
      } catch (err) {
        lastErr = err
        if (!isTransient(err)) throw err
        // Last attempt on this model: stop retrying, fall through to next model.
        if (a < attemptsPerModel - 1) {
          await new Promise((r) => setTimeout(r, 300 * 2 ** a)) // 300ms, 600ms
        }
      }
    }
  }
  throw lastErr
}

export async function POST(req: NextRequest) {
  // Optional shared-secret gate (the app has no auth yet). Enforced only when
  // CHAT_SHARED_SECRET is set, so this endpoint isn't wide open in production.
  const secret = process.env.CHAT_SHARED_SECRET
  if (secret && req.headers.get('x-chat-secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Chat is not configured (missing GEMINI_API_KEY).' },
      { status: 503 },
    )
  }

  const body = await req.json().catch(() => null)
  const incoming = body?.messages
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  const today = new Date().toISOString().split('T')[0]

  // Gemini roles are "user" and "model".
  const contents: any[] = incoming.map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content ?? '') }],
  }))

  const actions: string[] = []
  try {
    for (let i = 0; i < 6; i++) {
      const result = await generateWithRetry(ai, {
        model: MODEL,
        contents,
        config: {
          systemInstruction: `${SYSTEM}\n\nToday's date is ${today}.`,
          tools: [{ functionDeclarations }],
          // Simple routing task — disable extended thinking for speed.
          thinkingConfig: { thinkingBudget: 0 },
        },
      })

      const calls = result.functionCalls
      if (!calls || calls.length === 0) {
        const reply = (result.text ?? '').trim()
        return NextResponse.json({ reply, actions })
      }

      // Append the model's tool-call turn, then the tool results.
      const modelContent = result.candidates?.[0]?.content
      if (modelContent) contents.push(modelContent)

      const responseParts: any[] = []
      for (const call of calls) {
        const out = await runTool(call.name ?? '', call.args ?? {}, actions)
        responseParts.push({
          functionResponse: { name: call.name, response: { result: out } },
        })
      }
      contents.push({ role: 'user', parts: responseParts })
    }
    return NextResponse.json(
      { reply: "Sorry, I couldn't complete that — too many steps.", actions },
      { status: 200 },
    )
  } catch (err: any) {
    console.error('Chat error', err)
    if (isTransient(err)) {
      return NextResponse.json(
        {
          error:
            'The assistant is busy right now (model overloaded). Please try again in a few seconds.',
        },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: 'Assistant request failed.' }, { status: 500 })
  }
}
