import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isStudioAvailable } from '@/lib/availability'
import { createCalendarEvent } from '@/lib/google-calendar'

const BATCH_COLORS = [
  '#F59E0B', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#F97316', '#84CC16'
]
export const dynamic = 'force-dynamic'
export async function GET() {
  const batches = await prisma.batch.findMany({
    where: { status: 'active' },
include: {
  enrolments: { include: { client: true } },
  bookings: { where: { status: 'confirmed' }, orderBy: { startTime: 'asc' } },
  faculty: true,
  course: true
},
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(batches)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
const {
  name,
  room,
  startTime,
  duration,
  repeatDays,
  startDate,
  clientIds,
  totalSessions,
  facultyId,
  courseId
} = body

  if (!name || !room || !startTime || !duration || !repeatDays || !startDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (!clientIds || clientIds.length === 0) {
    return NextResponse.json({ error: 'At least one student required' }, { status: 400 })
  }
  if (clientIds.length > 4) {
    return NextResponse.json({ error: 'Maximum 4 students per batch' }, { status: 400 })
  }

  const days: number[] = repeatDays.split(',').map(Number)
  const target = totalSessions || 16
  const sessions: { start: Date; end: Date }[] = []
  const cursor = new Date(startDate + 'T00:00:00')
  let endDate = startDate

  while (sessions.length < target) {
    if (days.includes(cursor.getDay())) {
      // 1. Get the YYYY-MM-DD part from the current cursor
      const dateStr = cursor.toISOString().split('T')[0];

      // 2. Build the exact IST moment by forcing the +05:30 offset
      // This forces the server to treat the time as 10:00 AM IST, not UTC
      const sessionStart = new Date(`${dateStr}T${startTime}:00+05:30`);
      
      // 3. Keep end time relative to the locked start time
      const sessionEnd = new Date(sessionStart);
      sessionEnd.setHours(sessionEnd.getHours() + Number(duration));
      
      sessions.push({ start: sessionStart, end: sessionEnd });
      endDate = dateStr;
    }
    cursor.setDate(cursor.getDate() + 1);
    
    // Safety break to prevent infinite loops
    if (cursor.getFullYear() > new Date().getFullYear() + 2) break;
  }

  if (sessions.length === 0) {
    return NextResponse.json({ error: 'No sessions generated — check start date and days' }, { status: 400 })
  }

  // Check all sessions for conflicts
  for (const s of sessions) {
    const available = await isStudioAvailable(s.start, s.end, room)
    if (!available) {
      return NextResponse.json({
        error: `Conflict on ${s.start.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })} at ${startTime} — studio already booked`
      }, { status: 409 })
    }
  }

  const batchCount = await prisma.batch.count()
  const color = BATCH_COLORS[batchCount % BATCH_COLORS.length]

  const batch = await prisma.batch.create({
    data: {
      name, room, startTime, duration: Number(duration),
      repeatDays, startDate, endDate, color,
...(facultyId ? { facultyId: Number(facultyId) } : {}),
...(courseId ? { courseId: Number(courseId) } : {}),
      enrolments: { create: clientIds.map((id: number) => ({ clientId: id })) },
      bookings: {
        create: sessions.map(s => ({
          clientId: null,
          room, startTime: s.start, endTime: s.end,
          status: 'confirmed', notes: name,
        }))
      }
    },
include: {
  enrolments: { include: { client: true } },
  bookings: { orderBy: { startTime: 'asc' } },
  faculty: true,
  course: true
}
  })

for (const booking of batch.bookings) {
  try {
    const event = await createCalendarEvent(
      batch.name,
      booking.startTime,
      booking.endTime,
      batch.name
    )

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        googleEventId: event.id || null
      }
    })

    console.log(
      `Created Google event for booking ${booking.id}`
    )
  } catch (err) {
    console.error(
      `Failed Google event for booking ${booking.id}`,
      err
    )
  }
}

  return NextResponse.json(batch, { status: 201 })
}
