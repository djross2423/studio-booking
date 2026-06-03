import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const archived = searchParams.get('archived') === 'true'

  const clients = await prisma.client.findMany({
    where: {
      active: !archived,
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    include: { _count: { select: { absences: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const { name, phone, notes } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const client = await prisma.client.create({ data: { name, phone, notes } })
  return NextResponse.json(client, { status: 201 })
}
