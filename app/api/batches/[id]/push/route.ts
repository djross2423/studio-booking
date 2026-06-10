import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStudioAvailable } from '@/lib/availability'
import { updateCalendarEvent } from '@/lib/google-calendar'
import { parseBody, batchPushSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const batchId = Number(params.id)
  const parsed = await parseBody(req, batchPushSchema)
  if ('error' in parsed) return parsed.error
  const { fromBookingId } = parsed.data

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      bookings: {
        where: { status: 'confirmed' },
        orderBy: { startTime: 'asc' },
        include: {
         client: true
      }
    }
  }  
})

  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  const days: number[] = batch.repeatDays.split(',').map(Number)

  // Find the next batch day after a given date
  function nextBatchDay(date: Date): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    let safety = 0
    while (!days.includes(d.getDay()) && safety < 14) {
      d.setDate(d.getDate() + 1)
      safety++
    }
    return d
  }

  // Find sessions from fromBookingId onwards
  const fromIndex = batch.bookings.findIndex((b: any) => b.id === Number(fromBookingId))
  if (fromIndex === -1) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const sessionsToShift = batch.bookings.slice(fromIndex)

  const shiftingIds = sessionsToShift.map((s: any) => s.id
)
  // Calculate new dates by shifting each session to the next batch day
  const [h, m] = batch.startTime.split(':').map(Number)
  const shifts: { id: number; newStart: Date; newEnd: Date }[] = []

  for (let i = 0; i < sessionsToShift.length; i++) {
    const prev = i === 0
      ? new Date(sessionsToShift[i].startTime) // shift from current date
      : shifts[i - 1].newStart               // shift from previous new date

    const newDate = i === 0
      ? nextBatchDay(new Date(sessionsToShift[i].startTime))
      : nextBatchDay(prev)

    const newStart = new Date(newDate)
    newStart.setHours(h, m, 0, 0)
    const newEnd = new Date(newStart)
    newEnd.setHours(newEnd.getHours() + batch.duration)
    shifts.push({ id: sessionsToShift[i].id, newStart, newEnd })
  }

  // Check conflicts for all new slots
  for (const s of shifts) {
    const available = await isStudioAvailable(s.newStart, s.newEnd, batch.room, shiftingIds)
    if (!available) {
      return NextResponse.json({
        error: `Conflict on ${s.newStart.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })} — another booking exists in this room`
      }, { status: 409 })
    }
  }

  // Apply all DB shifts in a single transaction, then sync Google Calendar in
  // parallel afterwards (network I/O kept out of the transaction).
  const updatedBookings = await prisma.$transaction(
    shifts.map((s) =>
      prisma.booking.update({
        where: { id: s.id },
        data: { startTime: s.newStart, endTime: s.newEnd },
        include: { client: true },
      })
    )
  )

  await Promise.allSettled(
    updatedBookings.map(async (booking) => {
      if (!booking.googleEventId) return
      try {
        await updateCalendarEvent(
          booking.googleEventId,
          booking.notes || 'Batch Session',
          booking.startTime,
          booking.endTime,
          booking.notes || ''
        )
      } catch (err) {
        console.error(`Failed updating Google Calendar for booking ${booking.id}`, err)
      }
    })
  )
  // Update batch endDate
  const newEndDate = shifts[shifts.length - 1].newStart.toISOString().split('T')[0]
  await prisma.batch.update({
    where: { id: batchId },
    data: { endDate: newEndDate }
  })

  return NextResponse.json({ success: true, shifted: shifts.length })
}
