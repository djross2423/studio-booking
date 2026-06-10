import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteCalendarEvent } from '@/lib/google-calendar'
import { parseBody, batchUpdateSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const batch = await prisma.batch.findUnique({
    where: { id: Number(params.id) },
    include: {
      enrolments: { include: { client: true } },
      bookings: { where: { status: 'confirmed' }, orderBy: { startTime: 'asc' } },
      faculty: true
    }
  })
  if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(batch)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  const parsed = await parseBody(req, batchUpdateSchema)
  if ('error' in parsed) return parsed.error
  const { facultyId, addClientId, removeClientId } = parsed.data

  if (facultyId !== undefined) {
    await prisma.batch.update({
      where: { id },
      data: { facultyId: facultyId === null ? null : Number(facultyId) }
    })
  }

  if (addClientId) {
    const batch = await prisma.batch.findUnique({ where: { id }, include: { enrolments: true } })
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
    if (batch.enrolments.length >= 4) return NextResponse.json({ error: 'Batch is full (max 4 students)' }, { status: 400 })
    
    // ✅ FIXED: Handled the implicit 'any' parameter for the enrollment check loop
    const exists = batch.enrolments.some((e: any) => e.clientId === Number(addClientId))
    if (exists) return NextResponse.json({ error: 'Student already in batch' }, { status: 400 })
    await prisma.batchEnrolment.create({ data: { batchId: id, clientId: Number(addClientId) } })
  }

  if (removeClientId) {
    await prisma.batchEnrolment.deleteMany({ where: { batchId: id, clientId: Number(removeClientId) } })
  }

  const updated = await prisma.batch.findUnique({
    where: { id },
    include: {
      enrolments: { include: { client: true } },
      bookings: { where: { status: 'confirmed' }, orderBy: { startTime: 'asc' } },
      faculty: true
    }
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  const bookings = await prisma.booking.findMany({
    where: { batchId: id },
    select: {
      id: true,
      googleEventId: true
    }
  })
  
  // ✅ FIXED: Added explicit 'any' to prevent compilation failure down here
  const bookingIds = bookings.map((b: any) => b.id)

  await Promise.allSettled(
    bookings.map(async (booking) => {
      if (!booking.googleEventId) return
      try {
        await deleteCalendarEvent(booking.googleEventId)
      } catch (err) {
        console.error(`Failed deleting Google event for booking ${booking.id}`, err)
      }
    })
  )

  await prisma.absence.deleteMany({ where: { bookingId: { in: bookingIds } } })
  await prisma.facultyAttendance.deleteMany({ where: { bookingId: { in: bookingIds } } })
  await prisma.booking.deleteMany({ where: { batchId: id } })
  await prisma.batchEnrolment.deleteMany({ where: { batchId: id } })
  await prisma.batch.delete({ where: { id } })
  return NextResponse.json({ success: true })
}