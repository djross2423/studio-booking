import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBody, absenceSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'
// GET absences for a client
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 })

  const absences = await prisma.absence.findMany({
    where: { clientId: Number(clientId) },
    include: { booking: true },
    orderBy: { booking: { startTime: 'desc' } }
  })
  return NextResponse.json(absences)
}

// POST - mark absent
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, absenceSchema)
  if ('error' in parsed) return parsed.error
  const { clientId, bookingId } = parsed.data

  try {
    const absence = await prisma.absence.create({
      data: { clientId, bookingId },
      include: { booking: true }
    })
    return NextResponse.json(absence, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Already marked absent' }, { status: 409 })
  }
}

// DELETE - remove absence
export async function DELETE(req: NextRequest) {
  const parsed = await parseBody(req, absenceSchema)
  if ('error' in parsed) return parsed.error
  const { clientId, bookingId } = parsed.data
  await prisma.absence.deleteMany({
    where: { clientId, bookingId }
  })
  return NextResponse.json({ success: true })
}
