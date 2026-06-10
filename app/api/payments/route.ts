import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBody, paymentSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, paymentSchema)
  if ('error' in parsed) return parsed.error
  const { enrollmentId, amount, paymentMethod, reference, notes, paymentDate } =
    parsed.data

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  })
  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  const payment = await prisma.feePayment.create({
    data: {
      enrollmentId,
      amount,
      paymentMethod: paymentMethod || 'cash',
      reference: reference || null,
      notes: notes || null,
      ...(paymentDate
        ? { paymentDate: new Date(paymentDate + 'T00:00:00') }
        : {}),
    },
  })

  return NextResponse.json(payment, { status: 201 })
}
