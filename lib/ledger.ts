import { prisma } from './prisma'

// Aggregations for the finance assistant. Reads from Postgres (the canonical
// store the Sheet mirrors). "received" intentionally also includes student
// FeePayments (by paymentDate), per product decision.

export type LedgerMetric = 'spent' | 'received' | 'net' | 'list'

type Range = { from?: string; to?: string }

function dateFilter(field: string, { from, to }: Range) {
  if (!from && !to) return {}
  return {
    [field]: {
      ...(from ? { gte: new Date(from + 'T00:00:00') } : {}),
      ...(to ? { lt: new Date(to + 'T00:00:00') } : {}),
    },
  }
}

async function sumTransactions(type: string, range: Range, category?: string) {
  const res = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      type,
      ...(category ? { category } : {}),
      ...dateFilter('occurredOn', range),
    },
  })
  return res._sum.amount ?? 0
}

async function sumFeePayments(range: Range) {
  const res = await prisma.feePayment.aggregate({
    _sum: { amount: true },
    where: { ...dateFilter('paymentDate', range) },
  })
  return res._sum.amount ?? 0
}

export async function summarizeLedger(args: {
  metric: LedgerMetric
  from?: string
  to?: string
  category?: string
}) {
  const { metric, from, to, category } = args
  const range: Range = { from, to }

  if (metric === 'list') {
    const rows = await prisma.transaction.findMany({
      where: { ...dateFilter('occurredOn', range) },
      orderBy: { occurredOn: 'desc' },
      take: 20,
    })
    return { metric, from, to, count: rows.length, rows }
  }

  const spent = await sumTransactions('spent', range, category)
  // "received" = manual received ledger + student fee payments in range
  const receivedLedger = await sumTransactions('received', range, category)
  const feePayments = await sumFeePayments(range)
  const received = receivedLedger + feePayments

  const out = {
    from,
    to,
    spent,
    received,
    receivedFromLedger: receivedLedger,
    receivedFromStudentFees: feePayments,
    net: received - spent,
  }

  if (metric === 'spent') return { metric, from, to, spent }
  if (metric === 'received')
    return {
      metric,
      from,
      to,
      received,
      receivedFromLedger: receivedLedger,
      receivedFromStudentFees: feePayments,
    }
  return { metric, ...out } // net
}
