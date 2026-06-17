import { NextResponse } from 'next/server'
import { z } from 'zod'

// Parse + validate a JSON request body against a schema. On failure returns a
// 400 NextResponse; callers do: `if ('error' in r) return r.error` then use r.data.
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return {
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }
  const result = schema.safeParse(json)
  if (!result.success) {
    const message =
      result.error.issues
        .map((i) => (i.path.length ? `${i.path.join('.')}: ` : '') + i.message)
        .join('; ') || 'Invalid input'
    return { error: NextResponse.json({ error: message }, { status: 400 }) }
  }
  return { data: result.data }
}

const id = z.coerce.number().int().positive()
const optionalString = z.string().trim().optional()

// --- Bookings -------------------------------------------------------------
// A single prospective student captured on a demo booking.
const enquiryInput = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().optional(),
})

export const bookingCreateSchema = z
  .object({
    // Optional: a demo booking carries enquiries (name+phone) instead of a client.
    clientId: id.optional(),
    room: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    notes: z.string().optional(),
    sessionType: z.string().optional(),
    enquiries: z.array(enquiryInput).optional(),
  })
  .refine((b) => b.clientId !== undefined || (b.enquiries?.length ?? 0) > 0, {
    message: 'A booking needs either a student or at least one enquiry',
    path: ['clientId'],
  })

export const bookingUpdateSchema = z.object({
  clientId: z.coerce.number().int().positive().optional(),
  room: z.string().min(1).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  sessionType: z.string().optional(),
  enquiries: z.array(enquiryInput).optional(),
})

// --- Batches --------------------------------------------------------------
export const batchCreateSchema = z.object({
  name: z.string().min(1),
  room: z.string().min(1),
  startTime: z.string().min(1),
  duration: z.coerce.number().positive(),
  repeatDays: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  clientIds: z
    .array(z.coerce.number().int().positive())
    .min(1, 'At least one student required')
    .max(4, 'Maximum 4 students per batch'),
  totalSessions: z.coerce.number().int().positive().optional(),
  facultyId: z.coerce.number().int().positive().optional(),
  courseId: z.coerce.number().int().positive().optional(),
})

export const batchUpdateSchema = z.object({
  facultyId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  addClientId: z.coerce.number().int().positive().optional(),
  removeClientId: z.coerce.number().int().positive().optional(),
})

export const batchPushSchema = z.object({
  fromBookingId: id,
})

// --- Clients --------------------------------------------------------------
export const clientCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: optionalString,
  notes: optionalString,
})

export const clientUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: optionalString,
  notes: optionalString,
  active: z.boolean().optional(),
})

// --- Faculty --------------------------------------------------------------
export const facultyCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name required'),
  phone: optionalString,
})

export const facultyUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phone: optionalString,
  active: z.boolean().optional(),
})

// --- Courses --------------------------------------------------------------
export const courseCreateSchema = z.object({
  name: z.string().trim().min(1),
  totalSessions: z.coerce.number().int().positive(),
  sessionDuration: z.coerce.number().positive(),
  fee: z.coerce.number().nonnegative(),
  color: z.string().optional(),
  description: z.string().nullish(),
})

export const courseUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  totalSessions: z.coerce.number().int().positive().optional(),
  sessionDuration: z.coerce.number().positive().optional(),
  fee: z.coerce.number().nonnegative().optional(),
  color: z.string().optional(),
  description: z.string().nullish(),
})

// --- Enrollments / payments ----------------------------------------------
export const enrollSchema = z.object({
  clientId: z.coerce.number().int().positive().nullish(),
  name: optionalString,
  phone: optionalString,
  courseId: id,
  totalFee: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().optional(),
  initialPayment: z.coerce.number().nonnegative().optional(),
  paymentMethod: z.string().optional(),
  enrolledOn: z.string().optional(),
})

export const enrollmentStatusSchema = z.object({
  status: z.enum(['active', 'paused']),
})

export const paymentSchema = z.object({
  enrollmentId: id,
  amount: z.coerce.number().positive(),
  paymentMethod: z.string().optional(),
  reference: z.string().nullish(),
  notes: z.string().nullish(),
  paymentDate: z.string().optional(),
})

// --- Attendance / absences -----------------------------------------------
export const absenceSchema = z.object({
  clientId: id,
  bookingId: id,
})

export const attendanceSchema = z.object({
  facultyId: id,
  bookingId: id,
  present: z.boolean().optional(),
})

// --- Batch enrolments -----------------------------------------------------
export const batchEnrolmentSchema = z.object({
  batchId: id,
  clientId: id,
})

// --- Transactions (finance ledger) ----------------------------------------
export const transactionSchema = z.object({
  type: z.enum(['spent', 'received']),
  amount: z.coerce.number().positive(),
  description: z.string().trim().min(1),
  category: z.string().trim().optional(),
  occurredOn: z.string().optional(), // YYYY-MM-DD
})
