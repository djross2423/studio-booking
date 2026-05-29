import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStudioAvailable } from '@/lib/availability'
import { createCalendarEvent } from '@/lib/google-calendar'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const bookings = await prisma.booking.findMany({
    where: {
      status: { not: 'cancelled' },
      ...(from && to
        ? { startTime: { gte: new Date(from), lt: new Date(to) } }
        : {}),
    },
    include: { client: true, batch: { include: { enrolments: { include: { client: true } } } } },
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
    data: { clientId: Number(clientId), room, startTime: start, endTime: end, notes, sessionType: sessionType || 'demo' },
    include: { client: true, batch: { include: { enrolments: { include: { client: true } } } } },
  })
const calendarEvent = await createCalendarEvent(
  booking.client?.name || 'Studio Booking',
  booking.startTime,
  booking.endTime,
  booking.notes || ''
)
await prisma.booking.update({
  where: { id: booking.id },
  data: {
    googleEventId: calendarEvent.id
  }
})

  return NextResponse.json(booking, { status: 201 })
}
