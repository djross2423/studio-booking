import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBody, transactionSchema } from '@/lib/validation'
import { createTransaction } from '@/lib/transactions'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(from || to
        ? {
            occurredOn: {
              ...(from ? { gte: new Date(from + 'T00:00:00') } : {}),
              ...(to ? { lt: new Date(to + 'T00:00:00') } : {}),
            },
          }
        : {}),
    },
    orderBy: { occurredOn: 'desc' },
    take: 100,
  })
  return NextResponse.json(transactions)
}

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, transactionSchema)
  if ('error' in parsed) return parsed.error
  const transaction = await createTransaction({ ...parsed.data, source: 'manual' })
  return NextResponse.json(transaction, { status: 201 })
}
