import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  const body = await req.json()

  try {
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.fee !== undefined ? { fee: Number(body.fee) } : {}),
        ...(body.totalSessions !== undefined ? { totalSessions: Number(body.totalSessions) } : {}),
        ...(body.sessionDuration !== undefined ? { sessionDuration: Number(body.sessionDuration) } : {}),
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
