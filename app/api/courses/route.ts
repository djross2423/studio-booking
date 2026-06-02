import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export async function GET() {
  const courses = await prisma.course.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(courses)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const course = await prisma.course.create({
    data: {
      name: body.name,
      totalSessions: Number(body.totalSessions),
      sessionDuration: Number(body.sessionDuration),
      fee: Number(body.fee),
      color: body.color || '#6C3CE1',
      description: body.description || null
    }
  })

  return NextResponse.json(course)
}
