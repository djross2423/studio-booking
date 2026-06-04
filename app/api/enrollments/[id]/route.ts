import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  const { status } = await req.json()

  if (status !== 'active' && status !== 'paused') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const enrollment = await prisma.enrollment.findUnique({ where: { id } })
  if (!enrollment) {
    return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
  }

  const updated = await prisma.$transaction(async (tx) => {
    // When pausing, remove the student from any batch roster for this course
    // so the seat is freed up. Sessions/attendance history are left intact.
    if (status === 'paused') {
      const courseBatches = await tx.batch.findMany({
        where: { courseId: enrollment.courseId },
        select: { id: true },
      })
      await tx.batchEnrolment.deleteMany({
        where: {
          clientId: enrollment.clientId,
          batchId: { in: courseBatches.map((b) => b.id) },
        },
      })
    }

    return tx.enrollment.update({
      where: { id },
      data: { status },
      include: { client: true, course: true, payments: true },
    })
  })

  return NextResponse.json(updated)
}
