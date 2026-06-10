import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBody, courseUpdateSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  const parsed = await parseBody(req, courseUpdateSchema)
  if ('error' in parsed) return parsed.error
  const body = parsed.data

  try {
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.fee !== undefined ? { fee: body.fee } : {}),
        ...(body.totalSessions !== undefined ? { totalSessions: body.totalSessions } : {}),
        ...(body.sessionDuration !== undefined ? { sessionDuration: body.sessionDuration } : {}),
        ...(body.color !== undefined ? { color: body.color } : {})
      }
    })

    return NextResponse.json(course)
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)

  try {
    await prisma.course.update({
      where: { id },
      data: { active: false }
    })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    )
  }
}
