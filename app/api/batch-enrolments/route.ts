import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const enrolment = await prisma.batchEnrolment.create({
    data: {
      batchId: Number(body.batchId),
      clientId: Number(body.clientId)
    }
  })

  return NextResponse.json(enrolment)
}

