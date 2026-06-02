import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export async function GET() {
  const faculty = await prisma.faculty.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      batches: { where: { status: 'active' }, select: { id: true, name: true, color: true } },
      _count: { select: { attendance: true } }
    }
  })
  return NextResponse.json(faculty)
}

export async function POST(req: NextRequest) {
  const { name, phone } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const faculty = await prisma.faculty.create({ data: { name, phone } })
  return NextResponse.json(faculty, { status: 201 })
}
