import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './queries'

// Shared writer that throws the API's error message so the global
// MutationCache error handler (and any local onError) can surface it.
async function send(method: string, url: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return res.json().catch(() => ({}))
}

// Prefix-based invalidation: invalidating ['clients'] also refetches
// ['clients','archived']; ['bookings'] covers every windowed bookings query.
function useInvalidator() {
  const qc = useQueryClient()
  return (...keys: (readonly unknown[])[]) =>
    Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })))
}

// --- Bookings -------------------------------------------------------------
export function useSaveBooking() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: unknown }) =>
      send(id ? 'PATCH' : 'POST', id ? `/api/bookings/${id}` : '/api/bookings', body),
    onSuccess: () => invalidate(queryKeys.bookings),
  })
}

export function useDeleteBooking() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (id: number) => send('DELETE', `/api/bookings/${id}`),
    onSuccess: () => invalidate(queryKeys.bookings),
  })
}

// --- Batches --------------------------------------------------------------
export function useCreateBatch() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (body: unknown) => send('POST', '/api/batches', body),
    onSuccess: () => invalidate(queryKeys.batches, queryKeys.bookings),
  })
}

export function useUpdateBatch() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) =>
      send('PATCH', `/api/batches/${id}`, body),
    onSuccess: () => invalidate(queryKeys.batches, queryKeys.bookings),
  })
}

export function useDeleteBatch() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (id: number) => send('DELETE', `/api/batches/${id}`),
    onSuccess: () => invalidate(queryKeys.batches, queryKeys.bookings),
  })
}

export function usePushBatch() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) =>
      send('POST', `/api/batches/${id}/push`, body),
    onSuccess: () => invalidate(queryKeys.batches, queryKeys.bookings),
  })
}

// --- Clients --------------------------------------------------------------
export function useCreateClient() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (body: { name: string; phone?: string }) =>
      send('POST', '/api/clients', body),
    onSuccess: () => invalidate(queryKeys.clients),
  })
}

export function useUpdateClient() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) =>
      send('PATCH', `/api/clients/${id}`, body),
    onSuccess: () => invalidate(queryKeys.clients),
  })
}

export function useDeleteClient() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (id: number) => send('DELETE', `/api/clients/${id}`),
    onSuccess: () => invalidate(queryKeys.clients, queryKeys.bookings),
  })
}

// --- Faculty --------------------------------------------------------------
export function useCreateFaculty() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (body: { name: string; phone?: string }) =>
      send('POST', '/api/faculty', body),
    onSuccess: () => invalidate(queryKeys.faculty),
  })
}

export function useUpdateFaculty() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) =>
      send('PATCH', `/api/faculty/${id}`, body),
    onSuccess: () => invalidate(queryKeys.faculty, queryKeys.batches),
  })
}

export function useDeleteFaculty() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (id: number) => send('DELETE', `/api/faculty/${id}`),
    onSuccess: () => invalidate(queryKeys.faculty, queryKeys.batches),
  })
}

// --- Enrollments / payments ----------------------------------------------
type PaymentInput = {
  enrollmentId: number
  amount: number
  paymentMethod: string
  paymentDate: string
}

export function useAddPayment() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (input: PaymentInput) => send('POST', '/api/payments', input),
    onSuccess: () => invalidate(queryKeys.enrollments),
  })
}

export function useEnroll() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (body: unknown) => send('POST', '/api/enrollments', body),
    onSuccess: () => invalidate(queryKeys.enrollments),
  })
}

export function useSetEnrollmentStatus() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      send('PATCH', `/api/enrollments/${id}`, { status }),
    onSuccess: () => invalidate(queryKeys.enrollments, queryKeys.batches),
  })
}

// --- Courses --------------------------------------------------------------
export function useSaveCourse() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: ({ id, body }: { id?: number; body: unknown }) =>
      send(id ? 'PATCH' : 'POST', id ? `/api/courses/${id}` : '/api/courses', body),
    onSuccess: () => invalidate(queryKeys.courses),
  })
}

export function useArchiveCourse() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (id: number) => send('DELETE', `/api/courses/${id}`),
    onSuccess: () => invalidate(queryKeys.courses),
  })
}

// --- Faculty attendance / absences ---------------------------------------
export function useMarkAttendance() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (body: unknown) => send('POST', '/api/faculty-attendance', body),
    onSuccess: () => invalidate(['facultyAttendance']),
  })
}

export function useAddAbsence() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (body: unknown) => send('POST', '/api/absences', body),
    // clients invalidated too: absence counts show on student cards.
    onSuccess: () => invalidate(['absences'], queryKeys.clients),
  })
}

export function useRemoveAbsence() {
  const invalidate = useInvalidator()
  return useMutation({
    mutationFn: (body: unknown) => send('DELETE', '/api/absences', body),
    onSuccess: () => invalidate(['absences'], queryKeys.clients),
  })
}
