import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export async function GET() {
  const enrollments = await prisma.enrollment.findMany({
    orderBy: {
      enrolledOn: 'desc'
    },
    include: {
      client: true,
      course: true,
      payments: true
    }
  })

  return NextResponse.json(enrollments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

let client

// Existing student selected from search
if (body.clientId) {
  client = await prisma.client.findUnique({
    where: {
      id: Number(body.clientId)
    }
  })
}

// New student
if (!client) {
  client = await prisma.client.create({
    data: {
      name: body.name,
      phone: body.phone || null
    }
  })
}
const existingEnrollment =
  await prisma.enrollment.findFirst({
    where: {
      clientId: client.id,
      courseId: Number(body.courseId)
    }
  })

if (existingEnrollment) {
  return NextResponse.json(
    {
      error: 'Student already enrolled in this course'
    },
    { status: 400 }
  )
}  
const enrollment = await prisma.enrollment.create({
    data: {
      clientId: client.id,
      courseId: Number(body.courseId),

      totalFee: Number(body.totalFee),
      discount: Number(body.discount || 0),

      status: 'active',

      ...(body.enrolledOn
        ? { enrolledOn: new Date(body.enrolledOn + 'T00:00:00') }
        : {})
    }
  })

  // Initial payment (optional)
  if (body.initialPayment && Number(body.initialPayment) > 0) {
    await prisma.feePayment.create({
      data: {
        enrollmentId: enrollment.id,
        amount: Number(body.initialPayment),
        paymentMethod: body.paymentMethod || 'cash'
      }
    })
  }

  return NextResponse.json(enrollment)
}
