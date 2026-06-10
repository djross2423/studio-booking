import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBody, facultyCreateSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const archived = searchParams.get('archived') === 'true'
  const faculty = await prisma.faculty.findMany({
    where: { active: !archived },
    orderBy: { createdAt: 'desc' },
    include: {
      batches: { where: { status: 'active' }, select: { id: true, name: true, color: true } },
      _count: { select: { attendance: true } }
    }
  })
  return NextResponse.json(faculty)
}

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, facultyCreateSchema)
  if ('error' in parsed) return parsed.error
  const { name, phone } = parsed.data
  const faculty = await prisma.faculty.create({ data: { name, phone } })
  return NextResponse.json(faculty, { status: 201 })
}
