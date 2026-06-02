import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  try {
    // Delete in correct order to satisfy foreign key constraints
    await prisma.absence.deleteMany({ where: { clientId: id } })
    await prisma.booking.deleteMany({ where: { clientId: id } })
    await prisma.batchEnrolment.deleteMany({ where: { clientId: id } })
    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  const { name, phone, notes } = await req.json()
  try {
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(notes !== undefined ? { notes } : {}),
      }
    })
    return NextResponse.json(client)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
