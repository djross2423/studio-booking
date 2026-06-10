import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBody, courseCreateSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export async function GET() {
  const courses = await prisma.course.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(courses)
}

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, courseCreateSchema)
  if ('error' in parsed) return parsed.error
  const { name, totalSessions, sessionDuration, fee, color, description } =
    parsed.data

  const course = await prisma.course.create({
    data: {
      name,
      totalSessions,
      sessionDuration,
      fee,
      color: color || '#6C3CE1',
      description: description || null
    }
  })

  return NextResponse.json(course)
}
