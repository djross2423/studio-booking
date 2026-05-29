import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
  const { facultyId, bookingId, present } = await req.json()
  try {
    const record = await prisma.facultyAttendance.upsert({
      where: { facultyId_bookingId: { facultyId: Number(facultyId), bookingId: Number(bookingId) } },
      update: { present: present ?? true },
      create: { facultyId: Number(facultyId), bookingId: Number(bookingId), present: present ?? true },
      include: { booking: true }
    })
    return NextResponse.json(record, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { facultyId, bookingId } = await req.json()
  await prisma.facultyAttendance.deleteMany({
    where: { facultyId: Number(facultyId), bookingId: Number(bookingId) }
  })
  return NextResponse.json({ success: true })
}
