import { prisma } from './prisma'
import { appendTransactionRow } from './google-sheets'

// Shared create path: writes to DB, then best-effort mirrors to the Google
// Sheet. Reused by POST /api/transactions and the chat assistant's
// add_transaction tool.
export async function createTransaction(input: {
  type: string
  amount: number
  description: string
  category?: string
  occurredOn?: string
  source?: string
}) {
  const transaction = await prisma.transaction.create({
    data: {
      type: input.type,
      amount: input.amount,
      description: input.description,
      category: input.category || null,
      source: input.source || 'chat',
      ...(input.occurredOn
        ? { occurredOn: new Date(input.occurredOn + 'T00:00:00') }
        : {}),
    },
  })
  await appendTransactionRow(transaction)
  return transaction
}
