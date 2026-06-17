// Shared domain types used across page UI, query hooks, and components.

export type Tab =
  | "dashboard"
  | "calendar"
  | "batches"
  | "students"
  | "fees"
  | "faculty"
  | "courses"
  | "enrollment"
  | "archives"
  | "payments"
  | "enquiries"
  | "chat";

export type Client = {
  id: number;
  name: string;
  phone?: string;
  _count?: { absences: number };
};

export type Enquiry = {
  id: number;
  name: string;
  phone?: string | null;
  bookingId?: number | null;
  createdAt?: string;
  booking?: {
    id: number;
    startTime: string;
    room: string;
    status: string;
  } | null;
};

export type Booking = {
  id: number;
  clientId?: number | null;
  client?: Client | null;
  room: string;
  startTime: string;
  endTime: string;
  status: string;
  sessionType?: string | null;
  notes?: string;
  batchId?: number;
  batch?: Batch;
  enquiries?: Enquiry[];
};

export type BatchEnrolment = { id: number; clientId: number; client: Client };

export type Faculty = {
  id: number;
  name: string;
  phone?: string;
  batches?: { id: number; name: string; color: string }[];
  _count?: { attendance: number };
};

export type FacultyAttendanceRecord = {
  id: number;
  facultyId: number;
  bookingId: number;
  present: boolean;
  booking: { startTime: string; endTime: string; batchId?: number };
};

export type Batch = {
  id: number;
  name: string;
  room: string;
  startTime: string;
  duration: number;
  repeatDays: string;
  startDate: string;
  endDate: string;
  color: string;
  status: string;

  facultyId?: number;
  faculty?: Faculty;

  courseId?: number;
  course?: {
    id: number;
    name: string;
    totalSessions: number;
    sessionDuration: number;
    fee: number;
  };

  enrolments: BatchEnrolment[];
  bookings: Booking[];
};

export type Course = {
  id: number;
  name: string;
  totalSessions: number;
  sessionDuration: number;
  fee: number;
  color: string;
  description?: string | null;
};

export type Enrollment = {
  id: number;

  totalFee: number;
  discount: number;
  status: string;
  enrolledOn: string;

  client: {
    id: number;
    name: string;
    phone?: string;
  };

  course: {
    id: number;
    name: string;
  };

  payments: {
    id: number;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
  }[];
};
