import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBody, attendanceSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const facultyId = searchParams.get('facultyId')
  if (!facultyId) return NextResponse.json({ error: 'facultyId required' }, { status: 400 })

  const attendance = await prisma.facultyAttendance.findMany({
    where: { facultyId: Number(facultyId) },
    include: { booking: true },
    orderBy: { booking: { startTime: 'desc' } }
  })
  return NextResponse.json(attendance)
}

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, attendanceSchema)
  if ('error' in parsed) return parsed.error
  const { facultyId, bookingId, present } = parsed.data
  try {
    const record = await prisma.facultyAttendance.upsert({
      where: { facultyId_bookingId: { facultyId, bookingId } },
      update: { present: present ?? true },
      create: { facultyId, bookingId, present: present ?? true },
      include: { booking: true }
    })
    return NextResponse.json(record, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const parsed = await parseBody(req, attendanceSchema)
  if ('error' in parsed) return parsed.error
  const { facultyId, bookingId } = parsed.data
  await prisma.facultyAttendance.deleteMany({
    where: { facultyId, bookingId }
  })
  return NextResponse.json({ success: true })
}
