import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBody, clientCreateSchema } from '@/lib/validation'

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
  const parsed = await parseBody(req, clientCreateSchema)
  if ('error' in parsed) return parsed.error
  const { name, phone, notes } = parsed.data
  const client = await prisma.client.create({ data: { name, phone, notes } })
  return NextResponse.json(client, { status: 201 })
}
