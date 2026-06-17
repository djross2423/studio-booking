import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStudioAvailable } from '@/lib/availability'
import { updateCalendarEvent,deleteCalendarEvent } from '@/lib/google-calendar'
import { parseBody, bookingUpdateSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
const existingBooking = await prisma.booking.findUnique({
  where: { id },
  include: { client: true }
})

if (!existingBooking) {
  return NextResponse.json(
    { error: 'Booking not found' },
    { status: 404 }
  )
}
  const parsed = await parseBody(req, bookingUpdateSchema)
  if ('error' in parsed) return parsed.error
  const body = parsed.data
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

  // When enquiries are sent (a demo edit), replace the booking's enquiry rows.
  const { enquiries } = body
  if (enquiries) {
    const cleanEnquiries = enquiries
      .map((e) => ({ name: e.name.trim(), phone: e.phone?.trim() || null }))
      .filter((e) => e.name)
    await prisma.$transaction([
      prisma.enquiry.deleteMany({ where: { bookingId: id } }),
      ...(cleanEnquiries.length
        ? [
            prisma.enquiry.createMany({
              data: cleanEnquiries.map((e) => ({ ...e, bookingId: id })),
            }),
          ]
        : []),
    ])
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
    include: { client: true, enquiries: true },
  })
if (booking.googleEventId) {
  const enquiryTitle = booking.enquiries?.length
    ? `Demo: ${booking.enquiries.map((e) => e.name).join(', ')}`
    : null
  await updateCalendarEvent(
    booking.googleEventId,
    booking.client?.name || enquiryTitle || 'Studio Booking',
    booking.startTime,
    booking.endTime,
    booking.notes || ''
  )
}
return NextResponse.json(booking)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  await prisma.absence.deleteMany({ where: { bookingId: id } })
  await prisma.facultyAttendance.deleteMany({ where: { bookingId: id } })
const booking = await prisma.booking.findUnique({
  where: { id }
})

if (booking?.googleEventId) {
  console.log('Deleting Google event:', booking.googleEventId)

  try {
    await deleteCalendarEvent(
      booking.googleEventId
    )

    console.log('Google event deleted successfully')
  } catch (err) {
    console.error('Google delete failed:', err)
  }
}
  await prisma.booking.update({ where: { id }, data: { status: 'cancelled' } })
  return NextResponse.json({ success: true })
}
