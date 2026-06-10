import { useQuery } from '@tanstack/react-query'

// Centralised query keys so invalidation stays consistent across the app.
export const queryKeys = {
  enrollments: ['enrollments'] as const,
  bookings: ['bookings'] as const,
  batches: ['batches'] as const,
  clients: ['clients'] as const,
  faculty: ['faculty'] as const,
  courses: ['courses'] as const,
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${url}`)
  }
  return res.json() as Promise<T>
}

export function useEnrollments<T = unknown>() {
  return useQuery<T[]>({
    queryKey: queryKeys.enrollments,
    queryFn: () => getJson<T[]>('/api/enrollments'),
  })
}

// Windowed bookings: fetch only the [from, to) date range the UI is showing
// instead of every booking ever. Keyed by the range so navigating refetches.
export function useBookings<T = unknown>(from: string, to: string) {
  return useQuery<T[]>({
    queryKey: [...queryKeys.bookings, from, to],
    queryFn: () => getJson<T[]>(`/api/bookings?from=${from}&to=${to}`),
  })
}

export function useBatches<T = unknown>() {
  return useQuery<T[]>({
    queryKey: queryKeys.batches,
    queryFn: () => getJson<T[]>('/api/batches'),
  })
}

export function useClients<T = unknown>() {
  return useQuery<T[]>({
    queryKey: queryKeys.clients,
    queryFn: () => getJson<T[]>('/api/clients'),
  })
}

export function useFaculty<T = unknown>() {
  return useQuery<T[]>({
    queryKey: queryKeys.faculty,
    queryFn: () => getJson<T[]>('/api/faculty'),
  })
}

export function useCourses<T = unknown>() {
  return useQuery<T[]>({
    queryKey: queryKeys.courses,
    queryFn: () => getJson<T[]>('/api/courses'),
  })
}

// On-demand queries (fetch when a modal/tab opens) -------------------------

export function useArchivedClients<T = unknown>(enabled: boolean) {
  return useQuery<T[]>({
    queryKey: [...queryKeys.clients, 'archived'],
    queryFn: () => getJson<T[]>('/api/clients?archived=true'),
    enabled,
  })
}

export function useArchivedFaculty<T = unknown>(enabled: boolean) {
  return useQuery<T[]>({
    queryKey: [...queryKeys.faculty, 'archived'],
    queryFn: () => getJson<T[]>('/api/faculty?archived=true'),
    enabled,
  })
}

export function useFacultyAttendance<T = unknown>(
  facultyId: number | null | undefined,
) {
  return useQuery<T[]>({
    queryKey: ['facultyAttendance', facultyId],
    queryFn: () => getJson<T[]>('/api/faculty-attendance?facultyId=' + facultyId),
    enabled: facultyId != null,
  })
}

export function useAbsences<T = unknown>(clientId: number | null | undefined) {
  return useQuery<T[]>({
    queryKey: ['absences', clientId],
    queryFn: () => getJson<T[]>('/api/absences?clientId=' + clientId),
    enabled: clientId != null,
  })
}
