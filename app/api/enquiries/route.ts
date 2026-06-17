import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// List enquiries (prospective students captured on demo bookings), newest first.
// Optional ?q= filters by name. Includes the demo booking's date when linked.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  const enquiries = await prisma.enquiry.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : {},
    include: {
      booking: { select: { id: true, startTime: true, room: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(enquiries)
}
