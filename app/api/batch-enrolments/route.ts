import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseBody, batchEnrolmentSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, batchEnrolmentSchema)
  if ('error' in parsed) return parsed.error
  const { batchId, clientId } = parsed.data

  const enrolment = await prisma.batchEnrolment.create({
    data: { batchId, clientId }
  })

  return NextResponse.json(enrolment)
}

