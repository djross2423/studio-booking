import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStudioAvailable } from '@/lib/availability'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  const body = await req.json()
  const { clientId, room, startTime, endTime, notes, status } = body

  if (startTime && endTime) {
    const start = new Date(startTime)
    const end = new Date(endTime)
    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }
    const available = await isStudioAvailable(start, end, room || '', [id])
    if (!available) {
      return NextResponse.json(
        { error: 'Studio is already booked during this time' },
        { status: 409 }
      )
    }
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...(clientId ? { clientId: Number(clientId) } : {}),
      ...(room ? { room } : {}),
      ...(startTime ? { startTime: new Date(startTime) } : {}),
      ...(endTime ? { endTime: new Date(endTime) } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(body.sessionType ? { sessionType: body.sessionType } : {}),
      ...(status ? { status } : {}),
    },
    include: { client: true },
  })
  return NextResponse.json(booking)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  await prisma.absence.deleteMany({ where: { bookingId: id } })
  await prisma.facultyAttendance.deleteMany({ where: { bookingId: id } })
  await prisma.booking.update({ where: { id }, data: { status: 'cancelled' } })
  return NextResponse.json({ success: true })
}
