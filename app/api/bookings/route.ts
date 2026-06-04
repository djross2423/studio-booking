import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStudioAvailable } from '@/lib/availability'
import { createCalendarEvent } from '@/lib/google-calendar'

export const dynamic = 'force-dynamic'

export async function GET() {
  const bookings = await prisma.booking.findMany({
    where: { status: 'confirmed' },
    include: { client: true, batch: true },
    orderBy: { startTime: 'asc' },
  })
  return NextResponse.json(bookings)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { clientId, room, startTime, endTime, notes, sessionType } = body

  if (!clientId || !room || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const start = new Date(startTime)
  const end = new Date(endTime)
  if (end <= start) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
  }

  const available = await isStudioAvailable(start, end, room)
  if (!available) {
    return NextResponse.json(
      { error: 'Studio is already booked during this time' },
      { status: 409 }
    )
  }

  const booking = await prisma.booking.create({
    data: {
      clientId: Number(clientId),
      room,
      startTime: start,
      endTime: end,
      status: 'confirmed',
      ...(notes !== undefined ? { notes } : {}),
      ...(sessionType ? { sessionType } : {}),
    },
    include: { client: true },
  })

  try {
    const event = await createCalendarEvent(
      booking.client?.name || 'Studio Booking',
      booking.startTime,
      booking.endTime,
      booking.notes || ''
    )
    await prisma.booking.update({
      where: { id: booking.id },
      data: { googleEventId: event.id || null },
    })
  } catch (err) {
    console.error(`Failed Google event for booking ${booking.id}`, err)
  }

  return NextResponse.json(booking, { status: 201 })
}
