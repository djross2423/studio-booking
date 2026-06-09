import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { enrollmentId, amount, paymentMethod, reference, notes, paymentDate } =
    body

  if (!enrollmentId || !amount || Number(amount) <= 0) {
    return NextResponse.json(
      { error: 'Enrollment and a positive amount are required' },
      { status: 400 }
    )
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: Number(enrollmentId) },
  })
  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  const payment = await prisma.feePayment.create({
    data: {
      enrollmentId: Number(enrollmentId),
      amount: Number(amount),
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
