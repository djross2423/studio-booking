import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, phone, active } = await req.json()
  const faculty = await prisma.faculty.update({
    where: { id: Number(params.id) },
    data: {
      ...(name ? { name } : {}),
      ...(phone !== undefined ? { phone } : {}),
      ...(active !== undefined ? { active } : {}),
    }
  })
  return NextResponse.json(faculty)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  await prisma.facultyAttendance.deleteMany({ where: { facultyId: id } })
  await prisma.batch.updateMany({ where: { facultyId: id }, data: { facultyId: null } })
  await prisma.faculty.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
