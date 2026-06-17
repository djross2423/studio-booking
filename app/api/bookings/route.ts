import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStudioAvailable } from '@/lib/availability'
import { createCalendarEvent } from '@/lib/google-calendar'
import { parseBody, bookingCreateSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Optional date-window + limit for paginated/windowed reads. With no params
  // the behaviour is unchanged (all confirmed bookings), so existing callers
  // keep working while new callers can fetch just the range they render.
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') // YYYY-MM-DD inclusive
  const to = searchParams.get('to') // YYYY-MM-DD exclusive
  const limit = searchParams.get('limit')

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'confirmed',
      ...(from || to
        ? {
            startTime: {
              ...(from ? { gte: new Date(from + 'T00:00:00') } : {}),
              ...(to ? { lt: new Date(to + 'T00:00:00') } : {}),
            },
          }
        : {}),
    },
    include: { client: true, batch: true, enquiries: true },
    orderBy: { startTime: 'asc' },
    ...(limit ? { take: Number(limit) } : {}),
  })
  return NextResponse.json(bookings)
}

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, bookingCreateSchema)
  if ('error' in parsed) return parsed.error
  const { clientId, room, startTime, endTime, notes, sessionType, enquiries } =
    parsed.data
  const cleanEnquiries = (enquiries ?? [])
    .map((e) => ({ name: e.name.trim(), phone: e.phone?.trim() || null }))
    .filter((e) => e.name)

  const start = new Date(startTime)
  const end = new Date(endTime)
  if (end <= start) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
  }

  // Check availability and create atomically so two concurrent requests
  // can't both pass the conflict check and double-book the room.
  let booking
  try {
    booking = await prisma.$transaction(async (tx) => {
      const available = await isStudioAvailable(start, end, room, [], tx)
      if (!available) {
        throw new Error('STUDIO_CONFLICT')
      }
      return tx.booking.create({
        data: {
          clientId: clientId !== undefined ? Number(clientId) : null,
          room,
          startTime: start,
          endTime: end,
          status: 'confirmed',
          ...(notes !== undefined ? { notes } : {}),
          ...(sessionType ? { sessionType } : {}),
          ...(cleanEnquiries.length
            ? { enquiries: { create: cleanEnquiries } }
            : {}),
        },
        include: { client: true, enquiries: true },
      })
    })
  } catch (e: any) {
    if (e?.message === 'STUDIO_CONFLICT') {
      return NextResponse.json(
        { error: 'Studio is already booked during this time' },
        { status: 409 }
      )
    }
    throw e
  }

  try {
    const enquiryTitle = booking.enquiries?.length
      ? `Demo: ${booking.enquiries.map((e) => e.name).join(', ')}`
      : null
    const event = await createCalendarEvent(
      booking.client?.name || enquiryTitle || 'Studio Booking',
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
