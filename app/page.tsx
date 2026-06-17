"use client";

import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useEnrollments,
  useBookings,
  useBatches,
  useClients,
  useFaculty,
  useCourses,
  useArchivedClients,
  useArchivedFaculty,
  useFacultyAttendance,
  useAbsences,
  queryKeys,
} from "@/lib/queries";
import {
  useAddPayment,
  useSaveBooking,
  useDeleteBooking,
  useCreateBatch,
  useUpdateBatch,
  useDeleteBatch,
  usePushBatch,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useCreateFaculty,
  useUpdateFaculty,
  useDeleteFaculty,
  useEnroll,
  useSetEnrollmentStatus,
  useSaveCourse,
  useArchiveCourse,
  useMarkAttendance,
  useAddAbsence,
  useRemoveAbsence,
} from "@/lib/mutations";
import type {
  Client,
  Booking,
  BatchEnrolment,
  Faculty,
  FacultyAttendanceRecord,
  Batch,
  Course,
  Enrollment,
  Tab,
} from "@/lib/types";
import {
  ROOMS,
  DAYS,
  DURATIONS,
  fmtDate,
  fmtTime12,
  getDur,
  roomBadge,
  bookingColor,
  fmtDateLabel,
} from "@/lib/format";
import { S } from "@/lib/styles";
import { AppProvider } from "@/lib/app-context";
import { Sidebar } from "@/components/Sidebar";
import { ChatTab } from "@/components/ChatTab";
import { EnquiriesTab } from "@/components/EnquiriesTab";
import { SubTabs } from "@/components/ui/SubTabs";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { BookingCard } from "@/components/BookingCard";
import { EmptyState } from "@/components/EmptyState";
import { DatePickerInput } from "@/components/DatePickerInput";
import { PaymentsTab } from "@/components/PaymentsTab";
import { ArchivesTab } from "@/components/ArchivesTab";
import { EnrollmentTab } from "@/components/EnrollmentTab";
import { CoursesTab } from "@/components/CoursesTab";
import { StudentsTab } from "@/components/StudentsTab";

export const dynamic = 'force-dynamic'

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paymentTab, setPaymentTab] = useState<"received" | "pending">(
    "received",
  );
  const [paymentFilter, setPaymentFilter] = useState("");
  const { data: batches = [] } = useBatches<Batch>();
  const [clients, setClients] = useState<Client[]>([]);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  // Bookings are fetched for a rolling window (not all-time): a band spanning
  // a few months before the earlier of {now, viewed calendar month} to several
  // months after the later of the two. Navigating the calendar refetches.
  const bookingsWindow = useMemo(() => {
    const now = new Date();
    const viewed = new Date(calYear, calMonth, 1);
    const lo = new Date(Math.min(now.getTime(), viewed.getTime()));
    lo.setMonth(lo.getMonth() - 12, 1);
    const hi = new Date(Math.max(now.getTime(), viewed.getTime()));
    hi.setMonth(hi.getMonth() + 6, 1);
    return { from: fmtDate(lo), to: fmtDate(hi) };
  }, [calMonth, calYear]);
  const { data: allBookings = [] } = useBookings<Booking>(
    bookingsWindow.from,
    bookingsWindow.to,
  );
  const [selectedDate, setSelectedDate] = useState(() => fmtDate(new Date()));
  const [searchQ, setSearchQ] = useState("");
  const [roomFilter, setRoomFilter] = useState("all");
  const [showPastBookings, setShowPastBookings] = useState(false);
  const [absenceModal, setAbsenceModal] = useState<Client | null>(null);
  const { data: absences = [], isFetching: absenceLoading } = useAbsences<{
    id: number;
    clientId: number;
    bookingId: number;
    booking: { startTime: string; endTime: string; batchId?: number };
  }>(absenceModal?.id ?? null);
  const { data: faculties = [] } = useFaculty<Faculty>();
  const { data: courses = [] } = useCourses<Course>();
  const { data: enrollments = [] } = useEnrollments<Enrollment>();
  const queryClient = useQueryClient();
  const refresh = (key: readonly unknown[]) =>
    queryClient.invalidateQueries({ queryKey: key });
  const refreshEnrollments = () => refresh(queryKeys.enrollments);
  const refreshBatches = () => refresh(queryKeys.batches);
  const refreshAllClients = () => refresh(queryKeys.clients);
  const refreshFaculties = () => refresh(queryKeys.faculty);
  const addPayment = useAddPayment();
  const saveBooking = useSaveBooking();
  const deleteBooking = useDeleteBooking();
  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const deleteBatch = useDeleteBatch();
  const pushBatch = usePushBatch();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClientMut = useDeleteClient();
  const createFaculty = useCreateFaculty();
  const updateFaculty = useUpdateFaculty();
  const deleteFaculty = useDeleteFaculty();
  const enroll = useEnroll();
  const setEnrollmentStatus = useSetEnrollmentStatus();
  const saveCourse = useSaveCourse();
  const archiveCourse = useArchiveCourse();
  const markAttendance = useMarkAttendance();
  const addAbsence = useAddAbsence();
  const removeAbsence = useRemoveAbsence();

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseFee, setCourseFee] = useState("");
  const [courseSessions, setCourseSessions] = useState("");
  const [courseDuration, setCourseDuration] = useState("");
  const [courseColor, setCourseColor] = useState("#6C3CE1");

  const [facultyAttendanceModal, setFacultyAttendanceModal] =
    useState<Faculty | null>(null);
  const { data: facultyAttendance = [] } =
    useFacultyAttendance<FacultyAttendanceRecord>(facultyAttendanceModal?.id);
  const [editingFacultyId, setEditingFacultyId] = useState<number | null>(null);
  const [editFacultyName, setEditFacultyName] = useState("");
  const [editFacultyPhone, setEditFacultyPhone] = useState("");
  const [showNewFaculty, setShowNewFaculty] = useState(false);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [newFacultyPhone, setNewFacultyPhone] = useState("");
  const [facultyListSearch, setFacultyListSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().getMonth(),
  );
  const [selectedMonthYear, setSelectedMonthYear] = useState(() =>
    new Date().getFullYear(),
  );

  // Booking modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  // Demo bookings collect prospective students ("enquiries") instead of a client.
  const [demoEnquiries, setDemoEnquiries] = useState<
    { name: string; phone: string }[]
  >([{ name: "", phone: "" }]);
  const [bookingForm, setBookingForm] = useState({
    clientId: "",
    room: "dj_classroom",
    type: "demo",
    date: fmtDate(new Date()),
    startTime: "10:00",
    duration: "2",
    notes: "",
  });

  // Batch modal
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Enrollment modal
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);

  const [enrollmentForm, setEnrollmentForm] = useState({
    name: "",
    phone: "",
    courseId: "",
    totalFee: "",
    discount: "0",
    initialPayment: "",
    paymentMethod: "cash",
    enrolledOn: fmtDate(new Date()),
  });

  const [enrollmentSearch, setEnrollmentSearch] = useState("");

  // Payment modal
  const [paymentEnrollment, setPaymentEnrollment] = useState<Enrollment | null>(
    null,
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(fmtDate(new Date()));

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

function resetEnrollmentForm() {
  setEnrollmentForm({
    name: "",
    phone: "",
    courseId: "",
    totalFee: "",
    discount: "0",
    initialPayment: "",
    paymentMethod: "cash",
    enrolledOn: fmtDate(new Date()),
  });

  setEnrollmentSearch("");
  setSelectedClientId(null);
}
  const [batchForm, setBatchForm] = useState({
    name: "",
    room: "dj_classroom",
    dayPair: "" as "" | "tue-thu" | "wed-fri" | "sat-sun",
    timeSlot: "" as
      | ""
      | "10:00"
      | "12:00"
      | "14:00"
      | "16:00"
      | "18:00"
      | "20:00",
    startDate: fmtDate(new Date()),
    clientIds: [] as number[],
    facultyId: "",
    courseId: "",
  });
  const [batchClientSearch, setBatchClientSearch] = useState("");
  const [batchClients, setBatchClients] = useState<Client[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [batchTab, setBatchTab] = useState<"active" | "completed">("active");
  const [addStudentSearch, setAddStudentSearch] = useState("");
  const [addStudentResults, setAddStudentResults] = useState<Client[]>([]);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showChangeFaculty, setShowChangeFaculty] = useState(false);

  // Shared
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const { data: allClients = [] } = useClients<Client>();
  const { data: archivedClients = [] } = useArchivedClients<Client>(
    tab === "archives",
  );
  const { data: archivedFaculties = [] } = useArchivedFaculty<Faculty>(
    tab === "archives",
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setToastOn(true);
    setTimeout(() => setToastOn(false), 2500);
  };

  // These now refetch their React Query data; args kept for call-site compat.
  const loadFacultyAttendance = (_facultyId?: number) =>
    refresh(["facultyAttendance"]);
  const loadArchivedClients = () => refresh([...queryKeys.clients, "archived"]);
  const loadArchivedFaculties = () =>
    refresh([...queryKeys.faculty, "archived"]);
  const loadAbsences = (_clientId?: number) => refresh(["absences"]);

  const openPaymentModal = (enrollment: Enrollment) => {
    setPaymentEnrollment(enrollment);
    setPaymentAmount("");
    setPaymentMethod("cash");
    setPaymentDate(fmtDate(new Date()));
  };
  const openAbsenceModal = (client: Client) => {
    setAbsenceModal(client);
    loadAbsences(client.id);
  };
  const goTo = (t: Tab) => {
    if (t === "payments") {
      setPaymentTab("received");
      setPaymentFilter("");
    }
    setTab(t);
    setSidebarOpen(false);
  };

  // Cross-cutting services shared with all tab/modal components via context.
  const services = {
    showToast,
    setTab,
    openPaymentModal,
    openAbsenceModal,
    saveBooking,
    deleteBooking,
    createBatch,
    updateBatch,
    deleteBatch,
    pushBatch,
    createClient,
    updateClient,
    deleteClient: deleteClientMut,
    createFaculty,
    updateFaculty,
    deleteFaculty,
    enroll,
    setEnrollmentStatus,
    saveCourse,
    archiveCourse,
    addPayment,
    markAttendance,
    addAbsence,
    removeAbsence,
    refreshEnrollments,
    refreshBatches,
    refreshAllClients,
    refreshFaculties,
    loadArchivedClients,
    loadArchivedFaculties,
  };

  useEffect(() => {
    if (!showBookingModal) return;
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/clients?q=${encodeURIComponent(clientSearch)}`,
      );
      if (res.ok) setClients(await res.json());
    }, 200);
    return () => clearTimeout(t);
  }, [clientSearch, showBookingModal]);

  useEffect(() => {
    if (!showBatchModal) return;
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/clients?q=${encodeURIComponent(batchClientSearch)}`,
      );
      if (res.ok) setBatchClients(await res.json());
    }, 200);
    return () => clearTimeout(t);
  }, [batchClientSearch, showBatchModal]);

  // Batches split into active (ongoing) vs completed (last session in the past)
  const _today = fmtDate(new Date());
  const activeBatches = batches.filter((b) => b.endDate >= _today);
  const completedBatches = batches.filter((b) => b.endDate < _today);
  const shownBatches = batchTab === "active" ? activeBatches : completedBatches;

  // Stats
  const now = new Date();
  const _sm = new Date(now);
  _sm.setHours(0, 0, 0, 0);
  const _em = new Date(_sm);
  _em.setDate(_em.getDate() + 1);
  const sow = new Date(_sm);
  sow.setDate(_sm.getDate() - _sm.getDay());
  const eow = new Date(sow);
  eow.setDate(sow.getDate() + 7);
  const som = new Date(now.getFullYear(), now.getMonth(), 1);
  const eom = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const statToday = allBookings.filter((b) => {
    const d = new Date(b.startTime);
    return d >= _sm && d < _em;
  }).length;
  const statWeek = allBookings.filter((b) => {
    const d = new Date(b.startTime);
    return d >= sow && d < eow;
  }).length;
  const statMonth = allBookings.filter((b) => {
    const d = new Date(b.startTime);
    return d >= som && d < eom;
  }).length;
  const _todayMidnight = new Date();
  _todayMidnight.setHours(0, 0, 0, 0);
  const _tomorrowMidnight = new Date(_todayMidnight);
  _tomorrowMidnight.setDate(_tomorrowMidnight.getDate() + 1);
  const todayBookings = allBookings
    .filter((b) => {
      const d = new Date(b.startTime);
      return d >= _todayMidnight && d < _tomorrowMidnight;
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const upcoming = allBookings
    .filter((b) => new Date(b.startTime) >= _tomorrowMidnight)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 6);

  function getBookingsForDate(dateStr: string) {
    return allBookings
      .filter((b) => fmtDate(new Date(b.startTime)) === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Booking modal handlers
  function openNew() {
    setEditBooking(null);
    setBookingForm({
      clientId: "",
      room: "dj_classroom",
      type: "demo",
      date: selectedDate || fmtDate(new Date()),
      startTime: "10:00",
      duration: "2",
      notes: "",
    });
    setClientSearch("");
    setDemoEnquiries([{ name: "", phone: "" }]);
    setFormError("");
    setShowNewClient(false);
    setShowAddMenu(false);
    setShowBookingModal(true);
  }
  function openEdit(b: Booking) {
    setEditBooking(b);

    const d = new Date(b.startTime);
    const pad = (n: number) => String(n).padStart(2, "0");

    setBookingForm({
      clientId: b.clientId ? String(b.clientId) : "",
      room: b.room,
      type: (b as any).sessionType || "demo",
      date: fmtDate(d),
      startTime: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      duration: String(getDur(b.startTime, b.endTime)),
      notes: b.notes ?? "",
    });

    setClientSearch(b.client?.name || "");
    setDemoEnquiries(
      b.enquiries && b.enquiries.length
        ? b.enquiries.map((e) => ({ name: e.name, phone: e.phone ?? "" }))
        : [{ name: "", phone: "" }],
    );
    setFormError("");
    setShowBookingModal(true);
  }
  function handleBookingSubmit() {
    const isDemo = bookingForm.type === "demo";
    const cleanEnquiries = demoEnquiries
      .map((e) => ({ name: e.name.trim(), phone: e.phone.trim() }))
      .filter((e) => e.name);

    if (!bookingForm.date || !bookingForm.startTime) {
      setFormError("Please fill in required fields");
      return;
    }
    if (isDemo ? cleanEnquiries.length === 0 : !bookingForm.clientId) {
      setFormError(
        isDemo
          ? "Add at least one enquiry (name required)"
          : "Please fill in required fields",
      );
      return;
    }
    setFormError("");
    const start = new Date(`${bookingForm.date}T${bookingForm.startTime}:00`);
    const end = new Date(start);
    end.setHours(end.getHours() + Number(bookingForm.duration));
    const body: Record<string, unknown> = {
      room: bookingForm.room,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      notes: bookingForm.notes,
      sessionType: bookingForm.type,
    };
    if (isDemo) {
      body.enquiries = cleanEnquiries;
    } else {
      body.clientId = Number(bookingForm.clientId);
    }
    const wasEdit = !!editBooking;
    saveBooking.mutate(
      { id: editBooking?.id, body },
      {
        onSuccess: () => {
          setShowBookingModal(false);
          showToast(wasEdit ? "Booking updated!" : "Booking created!");
        },
      },
    );
  }
  function handleBookingDelete(id: number) {
    if (!confirm("Cancel this booking?")) return;
    deleteBooking.mutate(id, {
      onSuccess: () => {
        showToast("Booking cancelled");
        setShowBookingModal(false);
      },
    });
  }
  async function handleNewClient() {
    if (!newClientName.trim()) return;
    const c = await createClient.mutateAsync({
      name: newClientName.trim(),
      phone: newClientPhone.trim(),
    });
    setBookingForm((f) => ({ ...f, clientId: String(c.id) }));
    setClientSearch(c.name);
    setShowNewClient(false);
    setNewClientName("");
    setNewClientPhone("");
  }

  // Batch modal handlers
  function openBatchModal() {
    setBatchForm({
      name: "",
      room: "dj_classroom",
      dayPair: "",
      timeSlot: "",
      startDate: fmtDate(new Date()),
      clientIds: [],
      facultyId: "",
      courseId: "",
    });
    setBatchClientSearch("");
    setFormError("");
    setShowAddMenu(false);
    setShowBatchModal(true);
  }
  function autoName(dayPair: string, batchCount: number) {
    const type = dayPair === "sat-sun" ? "Weekend" : "Weekday";
    return "DJ " + type + " Batch " + (batchCount + 1);
  }
  function getDayPairDays(dp: string): number[] {
    if (dp === "tue-thu") return [2, 4];
    if (dp === "wed-fri") return [3, 5];
    if (dp === "sat-sun") return [6, 0];
    return [];
  }
  function getTimeLabel(t: string) {
    const map: Record<string, string> = {
      "10:00": "10am – 12pm",
      "12:00": "12pm – 2pm",
      "14:00": "2pm – 4pm",
      "16:00": "4pm – 6pm",
      "18:00": "6pm – 8pm",
      "20:00": "8pm – 10pm",
    };
    return map[t] || t;
  }

  function toggleBatchClient(id: number) {
    setBatchForm((f) => {
      if (f.clientIds.includes(id))
        return { ...f, clientIds: f.clientIds.filter((c) => c !== id) };
      if (f.clientIds.length >= 4) return f;
      return { ...f, clientIds: [...f.clientIds, id] };
    });
  }
  async function handleBatchSubmit() {
    if (!batchForm.dayPair) {
      setFormError("Select a day pair");
      return;
    }
    if (!batchForm.timeSlot) {
      setFormError("Select a time slot");
      return;
    }
    if (!batchForm.startDate) {
      setFormError("Select a start date");
      return;
    }
    if (!batchForm.courseId) {
      setFormError("Select a course");
      return;
    }
    if (batchForm.clientIds.length === 0) {
      setFormError("Add at least one student");
      return;
    }
    // Validate start date falls on one of the selected days
    const startDay = new Date(batchForm.startDate + "T00:00:00").getDay();
    const days = getDayPairDays(batchForm.dayPair);
    if (!days.includes(startDay)) {
      const dayNames: Record<number, string> = {
        0: "Sunday",
        2: "Tuesday",
        3: "Wednesday",
        4: "Thursday",
        5: "Friday",
        6: "Saturday",
      };
      setFormError(
        "Start date must be a " + days.map((d) => dayNames[d]).join(" or "),
      );
      return;
    }
    setFormError("");
    const batchCount = batches.length;

    const name = batchForm.name || autoName(batchForm.dayPair, batchCount);

    const totalSessions = selectedCourse!.totalSessions;
    const body = {
      name,
      room: batchForm.room,
      startTime: batchForm.timeSlot,
      duration: selectedCourse!.sessionDuration,
      repeatDays: days.join(","),
      startDate: batchForm.startDate,
      endDate: "",
      clientIds: batchForm.clientIds,
      totalSessions,
      facultyId: batchForm.facultyId ? Number(batchForm.facultyId) : undefined,
      courseId: Number(batchForm.courseId),
    };
    createBatch.mutate(body, {
      onSuccess: () => {
        setShowBatchModal(false);
        showToast(`Batch created! ${totalSessions} sessions booked.`);
      },
    });
  }
  function handleCancelBatch(id: number) {
    if (
      !confirm("Delete this batch and ALL its sessions? This cannot be undone.")
    )
      return;
    deleteBatch.mutate(id, {
      onSuccess: () => {
        setSelectedBatch(null);
        showToast("Batch deleted");
      },
    });
  }

  // Calendar
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays = new Date(calYear, calMonth, 0).getDate();
  const calDays: { day: number; dateStr: string; isCurrentMonth: boolean }[] =
    [];
  for (let i = firstDay - 1; i >= 0; i--)
    calDays.push({ day: prevDays - i, dateStr: "", isCurrentMonth: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calDays.push({ day: d, dateStr, isCurrentMonth: true });
  }
  const remaining = (7 - (calDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++)
    calDays.push({ day: i, dateStr: "", isCurrentMonth: false });

  const allFiltered = allBookings
    .filter((b) => roomFilter === "all" || b.room === roomFilter)
    .filter(
      (b) =>
        !searchQ ||
        (b.client?.name || "").toLowerCase().includes(searchQ.toLowerCase()),
    );
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const upcomingBookings = allFiltered
    .filter((b) => new Date(b.startTime) >= todayMidnight)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const pastBookings = allFiltered
    .filter((b) => new Date(b.startTime) < todayMidnight)
    .sort((a, b) => b.startTime.localeCompare(a.startTime));
  const filteredBookings = showPastBookings ? pastBookings : upcomingBookings;
  const groupedBookings = filteredBookings.reduce(
    (acc, booking) => {
      const dateKey = fmtDate(new Date(booking.startTime));

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      acc[dateKey].push(booking);

      return acc;
    },
    {} as Record<string, Booking[]>,
  );
  const selectedCourse = courses.find(
    (c) => c.id === Number(batchForm.courseId),
  );



  return (
    <AppProvider value={services}>
    <div className="layout">
      <Sidebar
        tab={tab}
        onNavigate={goTo}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="main">
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div style={S.header}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: 10,
                width: 40,
                height: 40,
                color: "white",
                fontSize: 20,
                cursor: "pointer",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ☰
            </button>
            <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "white",
              }}
            >
              Raw Music Studio
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "rgba(255,255,255,0.7)",
              }}
            >
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowAddMenu((v) => !v)}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "white",
                fontSize: 24,
              }}
            >
              +
            </button>
            {showAddMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 52,
                  background: "#1A1A24",
                  border: "1px solid #2A2A3D",
                  borderRadius: 14,
                  overflow: "hidden",
                  minWidth: 200,
                  zIndex: 200,
                }}
              >
                <button
                  onClick={openBatchModal}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "14px 16px",
                    background: "none",
                    border: "none",
                    color: "#F5F5F7",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  📚 New Batch
                </button>
                <div style={{ height: 1, background: "#2A2A3D" }} />
                <button
                  onClick={() => {
                    openNew();
                    setBookingForm((f) => ({ ...f, type: "demo" }));
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "14px 16px",
                    background: "none",
                    border: "none",
                    color: "#F5F5F7",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  🎯 Demo Class
                </button>
                <div style={{ height: 1, background: "#2A2A3D" }} />
                <button
                  onClick={() => {
                    openNew();
                    setBookingForm((f) => ({ ...f, type: "practice" }));
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "14px 16px",
                    background: "none",
                    border: "none",
                    color: "#F5F5F7",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  🎧 Practice Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard */}
      {tab === "dashboard" && (
        <div style={S.page}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 8,
              marginBottom: 24,
            }}
          >
            {(
              [
                ["Today", statToday],
                ["This Week", statWeek],
                ["This Month", statMonth],
              ] as const
            ).map(([label, val]) => (
              <div
                key={label}
                style={{
                  background: "linear-gradient(135deg,#242436,#1A1A24)",
                  border: "1px solid #2A2A3D",
                  borderRadius: 16,
                  padding: 16,
                  textAlign: "center",
                }}
              >
                <div
                  style={{ fontSize: 28, fontWeight: 800, color: "#8B5CF6" }}
                >
                  {val}
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
              Today&apos;s Schedule
            </h2>
            <span style={{ fontSize: 13, color: "#6B7280" }}>
              {todayBookings.length} session
              {todayBookings.length !== 1 ? "s" : ""}
            </span>
          </div>
          {todayBookings.length === 0 ? (
            <EmptyState text="No bookings today" />
          ) : (
            todayBookings.map((b) => (
              <BookingCard key={b.id} b={b} onClick={() => openEdit(b)} />
            ))
          )}
          {upcoming.length > 0 && (
            <>
              <h2
                style={{ margin: "24px 0 12px", fontSize: 17, fontWeight: 700 }}
              >
                Upcoming
              </h2>
              {upcoming.map((b) => (
                <BookingCard key={b.id} b={b} onClick={() => openEdit(b)} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Booking Calendar */}
      {tab === "calendar" && (
        <div style={S.page}>
          {/* Month nav */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <button
              onClick={() => {
                let m = calMonth - 1,
                  y = calYear;
                if (m < 0) {
                  m = 11;
                  y--;
                }
                setCalMonth(m);
                setCalYear(y);
              }}
              style={{
                padding: "8px 12px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 10,
                color: "white",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ‹
            </button>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
              {monthNames[calMonth]} {calYear}
            </h2>
            <button
              onClick={() => {
                let m = calMonth + 1,
                  y = calYear;
                if (m > 11) {
                  m = 0;
                  y++;
                }
                setCalMonth(m);
                setCalYear(y);
              }}
              style={{
                padding: "8px 12px",
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 10,
                color: "white",
                cursor: "pointer",
                fontSize: 18,
              }}
            >
              ›
            </button>
          </div>

          {/* Calendar grid */}
          <div style={S.card}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gap: 4,
              }}
            >
              {DAYS.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#9CA3AF",
                    padding: "8px 0",
                  }}
                >
                  {d}
                </div>
              ))}
              {calDays.map((cell, i) => {
                const dayBookings = cell.isCurrentMonth
                  ? getBookingsForDate(cell.dateStr)
                  : [];
                const isToday = cell.dateStr === fmtDate(new Date()),
                  isSel = cell.dateStr === selectedDate;
                return (
                  <button
                    key={i}
                    onClick={() =>
                      cell.isCurrentMonth && setSelectedDate(cell.dateStr)
                    }
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: isToday ? 700 : 500,
                      cursor: cell.isCurrentMonth ? "pointer" : "default",
                      position: "relative",
                      background: isSel
                        ? "#6C3CE1"
                        : isToday
                          ? "rgba(108,60,225,0.2)"
                          : "transparent",
                      border: "none",
                      color: isSel
                        ? "white"
                        : isToday
                          ? "#8B5CF6"
                          : cell.isCurrentMonth
                            ? "#F5F5F7"
                            : "#4B5563",
                    }}
                  >
                    {cell.day}
                    {dayBookings.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: 3,
                          display: "flex",
                          gap: 2,
                          justifyContent: "center",
                        }}
                      >
                        {dayBookings.slice(0, 3).map((b, i) => (
                          <div
                            key={i}
                            style={{
                              width: 4,
                              height: 4,
                              background: isSel
                                ? "rgba(255,255,255,0.8)"
                                : bookingColor(b),
                              borderRadius: "50%",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected date bookings */}
          <div style={{ marginTop: 20, marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#F5F5F7",
                }}
              >
                {fmtDateLabel(selectedDate)}
              </h3>
              <span style={{ fontSize: 13, color: "#6B7280" }}>
                {getBookingsForDate(selectedDate).length} booking
                {getBookingsForDate(selectedDate).length !== 1 ? "s" : ""}
              </span>
            </div>
            {getBookingsForDate(selectedDate).length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  background: "#1A1A24",
                  border: "1px dashed #2A2A3D",
                  borderRadius: 12,
                  textAlign: "center",
                  fontSize: 13,
                  color: "#4B5563",
                }}
              >
                No bookings for this date
              </div>
            ) : (
              getBookingsForDate(selectedDate).map((b) => (
                <BookingCard key={b.id} b={b} onClick={() => openEdit(b)} />
              ))
            )}
          </div>

          <div style={{ height: 1, background: "#2A2A3D", marginBottom: 20 }} />

          {/* All bookings list */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                All Bookings
              </h3>
            </div>
            <div
              style={{
                background: "#242436",
                border: "1px solid #2A2A3D",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span style={{ color: "#9CA3AF" }}>🔍</span>
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search student..."
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#F5F5F7",
                  fontSize: 14,
                  outline: "none",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                marginBottom: 12,
                paddingBottom: 4,
              }}
            >
              {[
                ["all", "All"],
                ["dj_classroom", "DJ Classroom"],
                ["control_room", "Control Room"],
              ].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setRoomFilter(val)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    background: roomFilter === val ? "#6C3CE1" : "#242436",
                    border: `1px solid ${roomFilter === val ? "#6C3CE1" : "#2A2A3D"}`,
                    color: roomFilter === val ? "white" : "#9CA3AF",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                background: "#1A1A24",
                border: "1px solid #2A2A3D",
                borderRadius: 12,
                padding: 4,
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => setShowPastBookings(false)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: 9,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: !showPastBookings ? "#6C3CE1" : "transparent",
                  color: !showPastBookings ? "white" : "#9CA3AF",
                }}
              >
                Upcoming ({upcomingBookings.length})
              </button>
              <button
                onClick={() => setShowPastBookings(true)}
                style={{
                  flex: 1,
                  padding: "9px",
                  borderRadius: 9,
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: showPastBookings ? "#6C3CE1" : "transparent",
                  color: showPastBookings ? "white" : "#9CA3AF",
                }}
              >
                Past ({pastBookings.length})
              </button>
            </div>
            {filteredBookings.length === 0 ? (
              <EmptyState
                text={
                  showPastBookings ? "No past bookings" : "No upcoming bookings"
                }
              />
            ) : (
              Object.entries(groupedBookings).map(([date, bookings]) => (
                <div
                  key={date}
                  style={{
                    background: "#1A1A24",
                    border: "1px solid #2A2A3D",
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <strong>{date}</strong>
                    <span>{bookings.length} bookings</span>
                  </div>

                  {bookings.map((b) => (
                    <BookingCard key={b.id} b={b} onClick={() => openEdit(b)} />
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Batches / Courses */}
      {tab === "batches" && (
        <div style={S.page}>
          {selectedBatch ? (
            <>
              <button
                onClick={() => setSelectedBatch(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8B5CF6",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "0 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                ‹ All Batches
              </button>
              <div
                style={{
                  ...S.card,
                  borderLeft: `4px solid ${selectedBatch.color}`,
                }}
              >
                {selectedBatch.course && (
                  <div
                    style={{
                      color: "#A78BFA",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    📘 {selectedBatch.course.name}
                  </div>
                )}{" "}
                <div
                  style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}
                >
                  {roomBadge(selectedBatch.room).label} ·{" "}
                  {(() => {
                    const [h, m] = selectedBatch.startTime
                      .split(":")
                      .map(Number);
                    const ampm = h >= 12 ? "PM" : "AM";
                    const h12 = h % 12 || 12;
                    return h12 + ":" + (m < 10 ? "0" + m : m) + " " + ampm;
                  })()}{" "}
                  · {selectedBatch.duration}h
                </div>
                <div
                  style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}
                >
                  {selectedBatch.repeatDays
                    .split(",")
                    .map((d) => DAYS[Number(d)])
                    .join(", ")}{" "}
                  · {selectedBatch.startDate} → {selectedBatch.endDate}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                    padding: "8px 12px",
                    background: "#242436",
                    borderRadius: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      flex: 1,
                      color: selectedBatch.faculty ? "#A78BFA" : "#6B7280",
                    }}
                  >
                    Faculty:{" "}
                    {selectedBatch.faculty
                      ? selectedBatch.faculty.name
                      : "No faculty assigned"}
                  </span>
                  <button
                    onClick={() => setShowChangeFaculty((v) => !v)}
                    style={{
                      background: "rgba(108,60,225,0.15)",
                      border: "1px solid rgba(108,60,225,0.3)",
                      color: "#8B5CF6",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {showChangeFaculty ? "Cancel" : "Change"}
                  </button>
                </div>
                {showChangeFaculty && (
                  <div style={{ marginBottom: 12 }}>
                    <select
                      defaultValue={selectedBatch.facultyId || ""}
                      onChange={(e) => {
                        updateBatch.mutate(
                          {
                            id: selectedBatch.id,
                            body: { facultyId: e.target.value || null },
                          },
                          {
                            onSuccess: (data) => {
                              setSelectedBatch(data);
                              setShowChangeFaculty(false);
                              showToast("Faculty updated");
                            },
                          },
                        );
                      }}
                      style={S.input}
                    >
                      <option value="">No faculty</option>
                      {faculties.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#9CA3AF",
                      }}
                    >
                      STUDENTS ({selectedBatch.enrolments.length}/4)
                    </div>
                    {selectedBatch.enrolments.length < 4 && (
                      <button
                        onClick={() => {
                          setShowAddStudent((v) => !v);
                          setAddStudentSearch("");
                          setAddStudentResults([]);
                        }}
                        style={{
                          background: "rgba(108,60,225,0.15)",
                          border: "1px solid rgba(108,60,225,0.3)",
                          color: "#8B5CF6",
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  {showAddStudent && (
                    <div
                      style={{
                        background: "#242436",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                      }}
                    >
                      <input
                        value={addStudentSearch}
                        onChange={async (e) => {
                          setAddStudentSearch(e.target.value);
                          const res = await fetch(
                            "/api/clients?q=" +
                              encodeURIComponent(e.target.value),
                          );
                          if (res.ok) setAddStudentResults(await res.json());
                        }}
                        placeholder="Search student..."
                        style={{
                          ...S.input,
                          marginBottom: addStudentResults.length > 0 ? 8 : 0,
                        }}
                      />
                      {addStudentResults
                        .filter(
                          (c) =>
                            !selectedBatch.enrolments.some(
                              (e) => e.clientId === c.id,
                            ),
                        )
                        .map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              updateBatch.mutate(
                                {
                                  id: selectedBatch.id,
                                  body: { addClientId: c.id },
                                },
                                {
                                  onSuccess: (data) => {
                                    setSelectedBatch(data);
                                    setAddStudentSearch("");
                                    setAddStudentResults([]);
                                    setShowAddStudent(false);
                                    showToast(c.name + " added to batch");
                                  },
                                },
                              );
                            }}
                            style={{
                              padding: "10px 12px",
                              cursor: "pointer",
                              borderBottom: "1px solid #2A2A3D",
                              fontSize: 14,
                              color: "#F5F5F7",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Avatar name={c.name} size={28} radius={8} fontSize={11} />
                            {c.name}
                          </div>
                        ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selectedBatch.enrolments.map((e) => (
                      <div
                        key={e.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          background: "#242436",
                          borderRadius: 10,
                          padding: "8px 12px",
                        }}
                      >
                        <Avatar name={e.client.name} size={28} radius={8} fontSize={11} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>
                          {e.client.name}
                        </span>
                        <button
                          onClick={() => {
                            if (
                              !confirm(
                                "Remove " + e.client.name + " from batch?",
                              )
                            )
                              return;
                            updateBatch.mutate(
                              {
                                id: selectedBatch.id,
                                body: { removeClientId: e.clientId },
                              },
                              {
                                onSuccess: (data) => {
                                  setSelectedBatch(data);
                                  showToast(e.client.name + " removed");
                                },
                              },
                            );
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#6B7280",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: 0,
                            marginLeft: 2,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#9CA3AF",
                    marginBottom: 8,
                  }}
                >
                  UPCOMING SESSIONS (
                  {
                    selectedBatch.bookings.filter(
                      (b) => new Date(b.endTime) > new Date(),
                    ).length
                  }
                  )
                </div>
                {(() => {
                  const now = new Date();

                  const upcoming = selectedBatch.bookings.filter(
                    (b) => new Date(b.endTime) > now,
                  );
                  return upcoming.slice(0, 10).map((b, i) => (
                    <div
                      key={b.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: "1px solid #2A2A3D",
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <div style={{ color: "#F5F5F7" }}>
                          {new Date(b.startTime).toLocaleDateString("en-IN", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                        <div style={{ color: "#9CA3AF", fontSize: 12 }}>
                          {fmtTime12(b.startTime)}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {i === 0 && (
                          <button
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Push all " +
                                    upcoming.length +
                                    " sessions forward by one batch day?",
                                )
                              )
                                return;
                              pushBatch.mutate(
                                {
                                  id: selectedBatch.id,
                                  body: { fromBookingId: b.id },
                                },
                                {
                                  onSuccess: async (data) => {
                                    const refreshed = await fetch(
                                      "/api/batches/" + selectedBatch.id,
                                    );
                                    if (refreshed.ok) {
                                      setSelectedBatch(await refreshed.json());
                                    }
                                    showToast(
                                      data.shifted + " sessions pushed forward",
                                    );
                                  },
                                },
                              );
                            }}
                            style={{
                              background: "rgba(245,158,11,0.15)",
                              border: "1px solid rgba(245,158,11,0.3)",
                              color: "#F59E0B",
                              borderRadius: 8,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Push all
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (
                              !confirm(
                                "Push all sessions from this date forward?",
                              )
                            )
                              return;
                            pushBatch.mutate(
                              {
                                id: selectedBatch.id,
                                body: { fromBookingId: b.id },
                              },
                              {
                                onSuccess: async (data) => {
                                  const refreshed = await fetch(
                                    "/api/batches/" + selectedBatch.id,
                                  );
                                  if (refreshed.ok) {
                                    setSelectedBatch(await refreshed.json());
                                  }
                                  showToast(
                                    data.shifted + " sessions pushed forward",
                                  );
                                },
                              },
                            );
                          }}
                          style={{
                            background: "rgba(108,60,225,0.15)",
                            border: "1px solid rgba(108,60,225,0.3)",
                            color: "#8B5CF6",
                            borderRadius: 8,
                            padding: "4px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Push from here
                        </button>
                        <button
                          onClick={() => handleBookingDelete(b.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#EF4444",
                            fontSize: 12,
                            cursor: "pointer",
                            padding: "4px 8px",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <button
                onClick={() => handleCancelBatch(selectedBatch.id)}
                style={S.btnDanger}
              >
                Delete Entire Batch
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                  Batches
                </h2>
                <button
                  onClick={openBatchModal}
                  style={{
                    background: "linear-gradient(135deg,#6C3CE1,#8B5CF6)",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 14px",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + New Batch
                </button>
              </div>

              <SubTabs
                value={batchTab}
                onChange={setBatchTab}
                tabs={[
                  ["active", `Active (${activeBatches.length})`],
                  ["completed", `Completed (${completedBatches.length})`],
                ]}
              />

              {shownBatches.length === 0 ? (
                <EmptyState
                  text={
                    batchTab === "active"
                      ? "No active batches"
                      : "No completed batches"
                  }
                />
              ) : (
                shownBatches.map((batch) => (
                  <div
                    key={batch.id}
                    onClick={() => setSelectedBatch(batch)}
                    style={{
                      ...S.card,
                      borderLeft: `4px solid ${batch.color}`,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        {batch.course && (
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#A78BFA",
                              marginBottom: 4,
                            }}
                          >
                            📘 {batch.course.name}
                          </div>
                        )}

                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            marginBottom: 4,
                          }}
                        >
                          {batch.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#9CA3AF",
                            marginBottom: 6,
                          }}
                        >
                          {roomBadge(batch.room).label} ·{" "}
                          {(() => {
                            const [h, m] = batch.startTime
                              .split(":")
                              .map(Number);
                            const ampm = h >= 12 ? "PM" : "AM";
                            const h12 = h % 12 || 12;
                            return (
                              h12 + ":" + (m < 10 ? "0" + m : m) + " " + ampm
                            );
                          })()}{" "}
                          · {batch.duration}h
                          {batch.faculty ? (
                            <span style={{ color: "#A78BFA" }}>
                              {" "}
                              · 🎓 {batch.faculty.name}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: 12, color: "#6B7280" }}>
                          {batch.repeatDays
                            .split(",")
                            .map((d) => DAYS[Number(d)])
                            .join(", ")}{" "}
                          · until {batch.endDate}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 800,
                            color: batch.color,
                          }}
                        >
                          {batch.enrolments.length}
                        </div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>
                          students
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      {batch.enrolments.map((e) => (
                        <Avatar
                          key={e.id}
                          name={e.client.name}
                          size={28}
                          radius={8}
                          fontSize={11}
                        />
                      ))}
                      <span
                        style={{
                          fontSize: 12,
                          color: "#6B7280",
                          alignSelf: "center",
                          marginLeft: 4,
                        }}
                      >
                        {
                          batch.bookings.filter(
                            (b) => new Date(b.startTime) >= new Date(),
                          ).length
                        }{" "}
                        sessions left
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}

      {/* Fees */}
      {tab === "fees" &&
        (() => {
          const rows = enrollments.map((e) => {
            const paid = e.payments.reduce((s, p) => s + p.amount, 0);
            const net = e.totalFee - e.discount;
            return { e, paid, net, balance: net - paid };
          });
          const totalBilled = rows.reduce((s, r) => s + r.net, 0);
          const totalCollected = rows.reduce((s, r) => s + r.paid, 0);
          const totalOutstanding = totalBilled - totalCollected;
          const sorted = [...rows].sort((a, b) => b.balance - a.balance);

          const summaryCards: [string, number, string][] = [
            ["Billed", totalBilled, "#8B5CF6"],
            ["Collected", totalCollected, "#10B981"],
            ["Outstanding", totalOutstanding, "#F59E0B"],
          ];

          return (
            <div style={S.page}>
              <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>
                💰 Fees
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {summaryCards.map(([label, value, color]) => (
                  <div
                    key={label}
                    style={{
                      background: "#1A1A24",
                      border: "1px solid #2A2A3D",
                      borderRadius: 14,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#6B7280" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color }}>
                      ₹{value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {sorted.map(({ e, paid, net, balance }) => {
                const status =
                  balance <= 0
                    ? { label: "Paid", color: "#10B981" }
                    : paid === 0
                      ? { label: "Unpaid", color: "#EF4444" }
                      : { label: "Partial", color: "#F59E0B" };
                return (
                  <div
                    key={e.id}
                    style={{
                      background: "#1A1A24",
                      border: "1px solid #2A2A3D",
                      borderRadius: 14,
                      padding: 16,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 15 }}>
                        {e.client.name}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: status.color,
                          background: status.color + "22",
                          border: "1px solid " + status.color + "55",
                          borderRadius: 8,
                          padding: "3px 8px",
                        }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}
                    >
                      📘 {e.course.name}
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr 1fr",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>Fee</div>
                        <div style={{ fontWeight: 700 }}>
                          ₹{e.totalFee.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>Paid</div>
                        <div style={{ fontWeight: 700, color: "#10B981" }}>
                          ₹{paid.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>Discount</div>
                        <div style={{ fontWeight: 700, color: "#8B5CF6" }}>
                          {e.discount > 0
                            ? `₹${e.discount.toLocaleString()}`
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#6B7280" }}>Balance</div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: balance > 0 ? "#F59E0B" : "#10B981",
                          }}
                        >
                          ₹{balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {enrollments.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "#4B5563",
                  }}
                >
                  <div
                    style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}
                  >
                    💰
                  </div>
                  <div style={{ fontSize: 13 }}>
                    No fees yet — enroll a student to get started
                  </div>
                </div>
              )}
            </div>
          );
        })()}

      {/* Enrollment */}
      {tab === "enrollment" && (
        <EnrollmentTab
          enrollments={enrollments}
          batches={batches}
          setShowEnrollmentModal={setShowEnrollmentModal}
          resetEnrollmentForm={resetEnrollmentForm}
        />
      )}

      {/* Students */}
      {tab === "students" && (
        <StudentsTab
          allClients={allClients}
          batches={batches}
          allBookings={allBookings}
        />
      )}

      {tab === "payments" && (
        <PaymentsTab
          enrollments={enrollments}
          paymentTab={paymentTab}
          setPaymentTab={setPaymentTab}
          paymentFilter={paymentFilter}
          setPaymentFilter={setPaymentFilter}
        />
      )}

      {tab === "archives" && (
        <ArchivesTab
          archivedClients={archivedClients}
          archivedFaculties={archivedFaculties}
        />
      )}

      {tab === "enquiries" && <EnquiriesTab />}

      {tab === "chat" && <ChatTab />}


      {/* Booking Modal */}
      {showBookingModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBookingModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#1A1A24",
              border: "1px solid #2A2A3D",
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 36px",
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: "#2A2A3D",
                borderRadius: 2,
                margin: "0 auto 20px",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                {editBooking
                  ? "Edit Booking"
                  : bookingForm.type === "demo"
                    ? "Demo Class"
                    : "Practice Session"}
              </h2>
              <button
                onClick={() => setShowBookingModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9CA3AF",
                  fontSize: 24,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            {bookingForm.type === "demo" ? (
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>Enquiry *</label>
                {demoEnquiries.map((enq, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 8, marginBottom: 8 }}
                  >
                    <input
                      value={enq.name}
                      onChange={(e) =>
                        setDemoEnquiries((list) =>
                          list.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Enquiry name *"
                      style={{ ...S.input, flex: 2 }}
                    />
                    <input
                      value={enq.phone}
                      onChange={(e) =>
                        setDemoEnquiries((list) =>
                          list.map((x, j) =>
                            j === i ? { ...x, phone: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Phone"
                      style={{ ...S.input, flex: 1 }}
                    />
                    {demoEnquiries.length > 1 && (
                      <button
                        onClick={() =>
                          setDemoEnquiries((list) =>
                            list.filter((_, j) => j !== i),
                          )
                        }
                        aria-label="Remove enquiry"
                        style={{
                          background: "none",
                          border: "none",
                          color: "#9CA3AF",
                          fontSize: 20,
                          cursor: "pointer",
                          padding: "0 4px",
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() =>
                    setDemoEnquiries((list) => [
                      ...list,
                      { name: "", phone: "" },
                    ])
                  }
                  style={{
                    fontSize: 13,
                    color: "#8B5CF6",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginTop: 4,
                    padding: 0,
                  }}
                >
                  + Add another enquiry
                </button>
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Student *</label>
              <input
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setBookingForm((f) => ({ ...f, clientId: "" }));
                }}
                placeholder="Search student name..."
                style={S.input}
              />
              {clientSearch &&
                !bookingForm.clientId &&
                clients.filter((c) =>
                  c.name.toLowerCase().includes(clientSearch.toLowerCase()),
                ).length > 0 && (
                  <div
                    style={{
                      background: "#242436",
                      border: "1px solid #2A2A3D",
                      borderRadius: 12,
                      marginTop: 4,
                      overflow: "hidden",
                    }}
                  >
                    {clients
                      .filter((c) =>
                        c.name
                          .toLowerCase()
                          .includes(clientSearch.toLowerCase()),
                      )
                      .map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setBookingForm((f) => ({
                              ...f,
                              clientId: String(c.id),
                            }));
                            setClientSearch(c.name);
                          }}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            borderBottom: "1px solid #2A2A3D",
                            fontSize: 14,
                            color: "#F5F5F7",
                          }}
                        >
                          {c.name}
                          {c.phone && (
                            <span style={{ color: "#6B7280", fontSize: 12 }}>
                              {" "}
                              · {c.phone}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              {!bookingForm.clientId && (
                <button
                  onClick={() => setShowNewClient((v) => !v)}
                  style={{
                    fontSize: 13,
                    color: "#8B5CF6",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    marginTop: 8,
                    padding: 0,
                  }}
                >
                  + Add new student
                </button>
              )}
              {showNewClient && (
                <div
                  style={{
                    background: "#242436",
                    borderRadius: 12,
                    padding: 12,
                    marginTop: 8,
                  }}
                >
                  <input
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Student name *"
                    style={{ ...S.input, marginBottom: 8 }}
                  />
                  <input
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Phone (optional)"
                    style={{ ...S.input, marginBottom: 8 }}
                  />
                  <button
                    onClick={handleNewClient}
                    style={{
                      background: "#6C3CE1",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      padding: "10px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Save student
                  </button>
                </div>
              )}
              </div>
            )}
            {[
              {
                label: "Room",
                key: "room",
                type: "select",
                options: ROOMS.map((r) => ({ value: r.value, label: r.label })),
              },
              { label: "Date *", key: "date", type: "datepicker" },
              { label: "Start Time *", key: "startTime", type: "time" },
              {
                label: "Duration",
                key: "duration",
                type: "select",
                options: DURATIONS.map((d) => ({
                  value: String(d),
                  label: `${d} Hour${d > 1 ? "s" : ""}`,
                })),
              },
              {
                label: "Notes",
                key: "notes",
                type: "text",
                placeholder: "Any special requirements...",
              },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={S.label}>{f.label}</label>
                {f.type === "select" ? (
                  <select
                    value={(bookingForm as any)[f.key]}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        [f.key]: e.target.value,
                      }))
                    }
                    style={S.input}
                  >
                    {f.options!.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "datepicker" ? (
                  <DatePickerInput
                    value={bookingForm.date}
                    onChange={(d) =>
                      setBookingForm((prev) => ({ ...prev, date: d }))
                    }
                    room={bookingForm.room}
                    allBookings={allBookings}
                  />
                ) : (
                  <input
                    type={f.type}
                    value={(bookingForm as any)[f.key]}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        [f.key]: e.target.value,
                      }))
                    }
                    placeholder={f.placeholder}
                    style={S.input}
                  />
                )}
              </div>
            ))}
            {formError && (
              <div
                style={{
                  color: "#EF4444",
                  fontSize: 13,
                  marginBottom: 12,
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.1)",
                  borderRadius: 10,
                }}
              >
                {formError}
              </div>
            )}
            <button
              onClick={handleBookingSubmit}
              disabled={saveBooking.isPending}
              style={S.btnPrimary}
            >
              {saveBooking.isPending
                ? "Saving..."
                : editBooking
                  ? "Save Changes"
                  : "Create Booking"}
            </button>
            {editBooking && !editBooking.batchId && (
              <button
                onClick={() => handleBookingDelete(editBooking.id)}
                style={{ ...S.btnDanger, marginTop: 10 }}
              >
                Cancel Booking
              </button>
            )}
            {editBooking?.batchId && (
              <div
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  textAlign: "center",
                  marginTop: 10,
                }}
              >
                This is a batch session — cancel from the Batches tab
              </div>
            )}
            <button
              onClick={() => setShowBookingModal(false)}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 8,
                background: "none",
                border: "none",
                color: "#6B7280",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Batch / Course Modal */}
      {showBatchModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBatchModal(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#1A1A24",
              border: "1px solid #2A2A3D",
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 36px",
              width: "100%",
              maxWidth: 480,
              maxHeight: "92vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: "#2A2A3D",
                borderRadius: 2,
                margin: "0 auto 20px",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                New DJ Batch
              </h2>
              <button
                onClick={() => setShowBatchModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9CA3AF",
                  fontSize: 24,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* Day pair */}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Schedule *</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(
                  [
                    ["tue-thu", "Tuesday & Thursday", "Weekday"],
                    ["wed-fri", "Wednesday & Friday", "Weekday"],
                    ["sat-sun", "Saturday & Sunday", "Weekend"],
                  ] as const
                ).map(([val, label, type]) => (
                  <button
                    key={val}
                    onClick={() => {
                      setBatchForm((f) => ({
                        ...f,
                        dayPair: val,
                        name: autoName(val, batches.length),
                      }));
                    }}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 16px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background:
                        batchForm.dayPair === val
                          ? "rgba(108,60,225,0.2)"
                          : "#242436",
                      border: `1.5px solid ${batchForm.dayPair === val ? "#6C3CE1" : "#2A2A3D"}`,
                      color: batchForm.dayPair === val ? "#A78BFA" : "#F5F5F7",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color:
                          batchForm.dayPair === val ? "#8B5CF6" : "#6B7280",
                        background:
                          batchForm.dayPair === val
                            ? "rgba(108,60,225,0.2)"
                            : "#1A1A24",
                        padding: "3px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {type}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slot */}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>
                Time Slot *{" "}
                <span style={{ color: "#6B7280", fontWeight: 400 }}>
                  (2 hrs each)
                </span>
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                {(
                  [
                    "10:00",
                    "12:00",
                    "14:00",
                    "16:00",
                    "18:00",
                    "20:00",
                  ] as const
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => setBatchForm((f) => ({ ...f, timeSlot: t }))}
                    style={{
                      padding: "12px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background:
                        batchForm.timeSlot === t
                          ? "rgba(108,60,225,0.2)"
                          : "#242436",
                      border: `1.5px solid ${batchForm.timeSlot === t ? "#6C3CE1" : "#2A2A3D"}`,
                      color: batchForm.timeSlot === t ? "#A78BFA" : "#F5F5F7",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {getTimeLabel(t)}
                  </button>
                ))}
              </div>
            </div>

            {/* Room */}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Room</label>
              <div style={{ display: "flex", gap: 8 }}>
                {ROOMS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() =>
                      setBatchForm((f) => ({ ...f, room: r.value }))
                    }
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 12,
                      cursor: "pointer",
                      background:
                        batchForm.room === r.value
                          ? "rgba(108,60,225,0.2)"
                          : "#242436",
                      border: `1.5px solid ${batchForm.room === r.value ? "#6C3CE1" : "#2A2A3D"}`,
                      color: batchForm.room === r.value ? "#A78BFA" : "#F5F5F7",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start date */}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>
                Start Date *{" "}
                {batchForm.dayPair && (
                  <span style={{ color: "#6B7280", fontWeight: 400 }}>
                    (
                    {batchForm.dayPair === "tue-thu"
                      ? "must be Tue or Thu"
                      : batchForm.dayPair === "wed-fri"
                        ? "must be Wed or Fri"
                        : "must be Sat or Sun"}
                    )
                  </span>
                )}
              </label>
              <DatePickerInput
                value={batchForm.startDate}
                onChange={(d) => setBatchForm((f) => ({ ...f, startDate: d }))}
                room={batchForm.room}
                allBookings={allBookings}
              />
              {batchForm.dayPair &&
                batchForm.startDate &&
                (() => {
                  const day = new Date(
                    batchForm.startDate + "T00:00:00",
                  ).getDay();
                  const days = getDayPairDays(batchForm.dayPair);
                  const ok = days.includes(day);
                  const endDate = (() => {
                    if (!ok) return null;

                    let count = 0;
                    const totalSessions = selectedCourse?.totalSessions || 0;

                    let cur = new Date(batchForm.startDate + "T00:00:00");

                    while (count < totalSessions) {
                      if (days.includes(cur.getDay())) {
                        count++;
                      }

                      if (count < totalSessions) {
                        cur.setDate(cur.getDate() + 1);
                      }
                    }

                    return cur.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  })();
                  return ok ? (
                    <div
                      style={{ fontSize: 12, color: "#34D399", marginTop: 6 }}
                    >
                      ✓ {selectedCourse?.totalSessions} sessions · ends{" "}
                      {endDate}
                    </div>
                  ) : (
                    <div
                      style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}
                    >
                      ⚠ Pick a{" "}
                      {batchForm.dayPair === "tue-thu"
                        ? "Tuesday or Thursday"
                        : batchForm.dayPair === "wed-fri"
                          ? "Wednesday or Friday"
                          : "Saturday or Sunday"}
                    </div>
                  );
                })()}
            </div>

            {/* Batch name (auto but editable) */}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>
                Batch Name{" "}
                <span style={{ color: "#6B7280", fontWeight: 400 }}>
                  (auto-generated)
                </span>
              </label>
              <input
                value={batchForm.name}
                onChange={(e) =>
                  setBatchForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. DJ Weekday Batch 3"
                style={S.input}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Course *</label>

                <select
                  value={batchForm.courseId}
                  onChange={(e) =>
                    setBatchForm((f) => ({
                      ...f,
                      courseId: e.target.value,
                    }))
                  }
                  style={S.input}
                >
                  <option value="">Select course</option>

                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <label style={S.label}>Faculty (optional)</label>
              <select
                value={batchForm.facultyId}
                onChange={(e) =>
                  setBatchForm((f) => ({ ...f, facultyId: e.target.value }))
                }
                style={S.input}
              >
                <option value="">No faculty assigned</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Students */}
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>
                Students (max 4) — {batchForm.clientIds.length}/4
              </label>
              <input
                value={batchClientSearch}
                onChange={(e) => setBatchClientSearch(e.target.value)}
                placeholder="Search and add students..."
                style={{ ...S.input, marginBottom: 8 }}
              />
              {batchClientSearch && (
                <div
                  style={{
                    background: "#242436",
                    border: "1px solid #2A2A3D",
                    borderRadius: 12,
                    marginBottom: 8,
                    overflow: "hidden",
                  }}
                >
                  {batchClients
                    .filter((c) =>
                      c.name
                        .toLowerCase()
                        .includes(batchClientSearch.toLowerCase()),
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          toggleBatchClient(c.id);
                          setBatchClientSearch("");
                        }}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          borderBottom: "1px solid #2A2A3D",
                          fontSize: 14,
                          color: "#F5F5F7",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: batchForm.clientIds.includes(c.id)
                            ? "rgba(108,60,225,0.15)"
                            : "transparent",
                        }}
                      >
                        <span>{c.name}</span>
                        {batchForm.clientIds.includes(c.id) && (
                          <span style={{ color: "#8B5CF6", fontWeight: 700 }}>
                            ✓
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}
              {batchForm.clientIds.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {batchForm.clientIds.map((id) => {
                    const c = batchClients.find((cl) => cl.id === id);
                    if (!c) return null;
                    return (
                      <div
                        key={id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          background: "rgba(108,60,225,0.15)",
                          border: "1px solid rgba(108,60,225,0.3)",
                          borderRadius: 8,
                          padding: "6px 10px",
                          fontSize: 13,
                        }}
                      >
                        {c.name}
                        <button
                          onClick={() => toggleBatchClient(id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#9CA3AF",
                            cursor: "pointer",
                            fontSize: 14,
                            padding: 0,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {formError && (
              <div
                style={{
                  color: "#EF4444",
                  fontSize: 13,
                  marginBottom: 12,
                  padding: "10px 14px",
                  background: "rgba(239,68,68,0.1)",
                  borderRadius: 10,
                }}
              >
                {formError}
              </div>
            )}

            {batchForm.courseId && (
              <div
                style={{
                  background: "rgba(108,60,225,0.1)",
                  border: "1px solid rgba(108,60,225,0.2)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 16,
                  fontSize: 13,
                  color: "#A78BFA",
                }}
              >
                {(() => {
                  const course = courses.find(
                    (c) => c.id === Number(batchForm.courseId),
                  );

                  if (!course) return null;

                  return (
                    <>
                      📚 {course.totalSessions} classes ·{" "}
                      {course.sessionDuration} hrs each
                    </>
                  );
                })()}
              </div>
            )}
            <button
              onClick={handleBatchSubmit}
              disabled={createBatch.isPending}
              style={S.btnPrimary}
            >
              {createBatch.isPending
                ? `Booking ${selectedCourse!.totalSessions} sessions...`
                : "Create Batch & Book All Sessions"}
            </button>
            <button
              onClick={() => setShowBatchModal(false)}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 8,
                background: "none",
                border: "none",
                color: "#6B7280",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showCourseModal && (
        <Modal
          onClose={() => setShowCourseModal(false)}
          zIndex={250}
          overlayStyle={{ backdropFilter: "blur(4px)" }}
        >
            <h2 style={{ margin: "0 0 16px", fontSize: 18 }}>Add Course</h2>

            <input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Course Name"
              style={{ ...S.input, marginBottom: 10 }}
            />

            <textarea
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              placeholder="Description"
              style={{
                ...S.input,
                minHeight: 80,
                marginBottom: 10,
              }}
            />

            <input
              value={courseFee}
              onChange={(e) => setCourseFee(e.target.value)}
              placeholder="Course Fee"
              style={{ ...S.input, marginBottom: 10 }}
            />

            <input
              value={courseSessions}
              onChange={(e) => setCourseSessions(e.target.value)}
              placeholder="Total Sessions"
              style={{ ...S.input, marginBottom: 10 }}
            />

            <input
              value={courseDuration}
              onChange={(e) => setCourseDuration(e.target.value)}
              placeholder="Session Duration (Hours)"
              style={{ ...S.input, marginBottom: 16 }}
            />

            <button
              onClick={() => {
                const wasEdit = !!editingCourseId;
                saveCourse.mutate(
                  {
                    id: editingCourseId ?? undefined,
                    body: {
                      name: courseName,
                      description: courseDescription,
                      fee: Number(courseFee),
                      totalSessions: Number(courseSessions),
                      sessionDuration: Number(courseDuration),
                      color: courseColor,
                    },
                  },
                  {
                    onSuccess: () => {
                      setCourseName("");
                      setCourseDescription("");
                      setCourseFee("");
                      setCourseSessions("");
                      setCourseDuration("");
                      setEditingCourseId(null);
                      setShowCourseModal(false);
                      showToast(wasEdit ? "Course updated" : "Course created");
                    },
                  },
                );
              }}
              style={S.btnPrimary}
            >
              Save Course
            </button>

            <button
              onClick={() => {
                setEditingCourseId(null);
                setShowCourseModal(false);
              }}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 8,
                background: "none",
                border: "none",
                color: "#6B7280",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
        </Modal>
      )}

      {paymentEnrollment &&
        (() => {
          const paid = paymentEnrollment.payments.reduce(
            (s, p) => s + p.amount,
            0,
          );
          const net = paymentEnrollment.totalFee - paymentEnrollment.discount;
          const balance = net - paid;
          const entered = Number(paymentAmount) || 0;
          const remaining = balance - entered;
          return (
            <Modal onClose={() => setPaymentEnrollment(null)}>
                <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>Add Payment</h2>
                <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>
                  {paymentEnrollment.client.name} · 📘{" "}
                  {paymentEnrollment.course.name}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>Fee</div>
                    <div style={{ fontWeight: 700 }}>
                      ₹{paymentEnrollment.totalFee.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>Paid</div>
                    <div style={{ fontWeight: 700, color: "#10B981" }}>
                      ₹{paid.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>Discount</div>
                    <div style={{ fontWeight: 700, color: "#8B5CF6" }}>
                      {paymentEnrollment.discount > 0
                        ? `₹${paymentEnrollment.discount.toLocaleString()}`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "#6B7280" }}>Balance</div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: balance > 0 ? "#F59E0B" : "#10B981",
                      }}
                    >
                      ₹{balance.toLocaleString()}
                    </div>
                  </div>
                </div>

                <label style={S.label}>Amount *</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={{ ...S.input, marginBottom: 12 }}
                />

                <label style={S.label}>Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ ...S.input, marginBottom: 12 }}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>

                <label style={S.label}>Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  style={{ ...S.input, marginBottom: 12 }}
                />

                {entered > 0 && (
                  <div
                    style={{
                      fontSize: 13,
                      color: remaining > 0 ? "#F59E0B" : "#10B981",
                      marginBottom: 12,
                    }}
                  >
                    {remaining > 0
                      ? `₹${remaining.toLocaleString()} left to pay after this`
                      : remaining === 0
                        ? "Fully paid after this payment ✓"
                        : `Overpaid by ₹${Math.abs(remaining).toLocaleString()}`}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setPaymentEnrollment(null)}
                    style={{
                      flex: 1,
                      background: "#242436",
                      border: "1px solid #2A2A3D",
                      color: "#9CA3AF",
                      borderRadius: 10,
                      padding: "10px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={addPayment.isPending || entered <= 0}
                    onClick={() => {
                      if (entered <= 0) return;
                      addPayment.mutate(
                        {
                          enrollmentId: paymentEnrollment.id,
                          amount: entered,
                          paymentMethod,
                          paymentDate,
                        },
                        {
                          onSuccess: () => {
                            setPaymentEnrollment(null);
                            showToast(
                              "Payment of ₹" +
                                entered.toLocaleString() +
                                " added",
                            );
                          },
                        },
                      );
                    }}
                    style={{
                      flex: 1,
                      background:
                        entered > 0
                          ? "linear-gradient(135deg,#10B981,#059669)"
                          : "#1F2A26",
                      border: "none",
                      color: "white",
                      borderRadius: 10,
                      padding: "10px",
                      fontWeight: 600,
                      cursor: entered > 0 ? "pointer" : "not-allowed",
                      opacity: entered > 0 ? 1 : 0.5,
                    }}
                  >
                    {addPayment.isPending ? "Saving…" : "Save Payment"}
                  </button>
                </div>
            </Modal>
          );
        })()}

      {showEnrollmentModal && (
        <div
onClick={() => {
  resetEnrollmentForm()
  setShowEnrollmentModal(false)
}}          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.7)",
            zIndex: 260,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "90%",
              maxWidth: 420,
              background: "#1A1A24",
              border: "1px solid #2A2A3D",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <h2 style={{ margin: "0 0 16px" }}>Enroll Student</h2>
            <label style={S.label}>Search Existing Student</label>

            <input
              value={enrollmentSearch}
              onChange={(e) => setEnrollmentSearch(e.target.value)}
              placeholder="Search by name..."
              style={{
                ...S.input,
                marginBottom: 8,
              }}
            />

            {enrollmentSearch && (
              <div
                style={{
                  background: "#242436",
                  border: "1px solid #2A2A3D",
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: "hidden",
                  maxHeight: 180,
                  overflowY: "auto",
                }}
              >
                {allClients
                  .filter((client) =>
                    client.name
                      .toLowerCase()
                      .includes(enrollmentSearch.toLowerCase()),
                  )
                  .slice(0, 10)
                  .map((client) => (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id);

                        setEnrollmentForm((prev) => ({
                          ...prev,
                          name: client.name,
                          phone: client.phone || "",
                        }));

                        setEnrollmentSearch("");
                      }}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        borderBottom: "1px solid #2A2A3D",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#F5F5F7",
                        }}
                      >
                        {client.name}
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "#9CA3AF",
                        }}
                      >
                        {client.phone}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {selectedClientId && (
              <div
                style={{
                  marginBottom: 12,
                  fontSize: 12,
                  color: "#10B981",
                }}
              >
                ✓ Existing student selected
              </div>
            )}

            <input
              value={enrollmentForm.name}
              onChange={(e) =>
                setEnrollmentForm({
                  ...enrollmentForm,
                  name: e.target.value,
                })
              }
              placeholder="Student Name"
              style={{
                ...S.input,
                marginBottom: 12,
              }}
            />
            <input
              value={enrollmentForm.phone}
              onChange={(e) =>
                setEnrollmentForm({
                  ...enrollmentForm,
                  phone: e.target.value,
                })
              }
              placeholder="Phone Number"
              style={{
                ...S.input,
                marginBottom: 12,
              }}
            />
            <select
              value={enrollmentForm.courseId}
              onChange={(e) => {
                const selected = courses.find(
                  (c) => c.id === Number(e.target.value),
                );

                setEnrollmentForm({
                  ...enrollmentForm,
                  courseId: e.target.value,
                  totalFee: selected ? String(selected.fee) : "",
                });
              }}
              style={{
                ...S.input,
                marginBottom: 12,
              }}
            >
              <option value="">Select Course</option>

              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            <input
              value={enrollmentForm.totalFee}
              onChange={(e) =>
                setEnrollmentForm({
                  ...enrollmentForm,
                  totalFee: e.target.value,
                })
              }
              placeholder="Course Fee"
              style={{
                ...S.input,
                marginBottom: 12,
              }}
            />
            <input
              value={enrollmentForm.discount}
              onChange={(e) =>
                setEnrollmentForm({
                  ...enrollmentForm,
                  discount: e.target.value,
                })
              }
              placeholder="Discount"
              style={{
                ...S.input,
                marginBottom: 12,
              }}
            />
            <input
              value={enrollmentForm.initialPayment}
              onChange={(e) =>
                setEnrollmentForm({
                  ...enrollmentForm,
                  initialPayment: e.target.value,
                })
              }
              placeholder="Initial Payment"
              style={{
                ...S.input,
                marginBottom: 12,
              }}
            />

            <label style={S.label}>Enrollment Date</label>
            <input
              type="date"
              value={enrollmentForm.enrolledOn}
              onChange={(e) =>
                setEnrollmentForm({
                  ...enrollmentForm,
                  enrolledOn: e.target.value,
                })
              }
              style={{
                ...S.input,
                marginBottom: 12,
              }}
            />

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 12,
              }}
            >
              <button
                onClick={() => setShowEnrollmentModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  background: "none",
                  border: "1px solid #2A2A3D",
                  color: "#9CA3AF",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                disabled={enroll.isPending}
                onClick={() => {
                  if (!enrollmentForm.name || !enrollmentForm.courseId) {
                    showToast("Name and Course required");
                    return;
                  }
                  enroll.mutate(
                    { ...enrollmentForm, clientId: selectedClientId },
                    {
                      onSuccess: () => {
                        resetEnrollmentForm();
                        setShowEnrollmentModal(false);
                        showToast("Student enrolled!");
                      },
                    },
                  );
                }}
                style={{
                  ...S.btnPrimary,
                  flex: 1,
                }}
              >
                {enroll.isPending ? "Enrolling…" : "Enroll Student"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Courses */}
      {tab === "courses" && (
        <CoursesTab
          courses={courses}
          setShowCourseModal={setShowCourseModal}
          setEditingCourseId={setEditingCourseId}
          setCourseName={setCourseName}
          setCourseDescription={setCourseDescription}
          setCourseFee={setCourseFee}
          setCourseSessions={setCourseSessions}
          setCourseDuration={setCourseDuration}
        />
      )}

      {/* Faculty */}
      {tab === "faculty" && (
        <div style={S.page}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
              Faculty
            </h2>
            <button
              onClick={() => setShowNewFaculty((v) => !v)}
              style={{
                background: "linear-gradient(135deg,#6C3CE1,#8B5CF6)",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Add Faculty
            </button>
          </div>

          {/* Month selector for stats */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <button
              onClick={() => {
                let m = selectedMonth - 1,
                  y = selectedMonthYear;
                if (m < 0) {
                  m = 11;
                  y--;
                }
                setSelectedMonth(m);
                setSelectedMonthYear(y);
              }}
              style={{
                background: "#242436",
                border: "1px solid #2A2A3D",
                borderRadius: 8,
                padding: "6px 10px",
                color: "white",
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <div
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 14,
                fontWeight: 600,
                color: "#F5F5F7",
              }}
            >
              {
                [
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ][selectedMonth]
              }{" "}
              {selectedMonthYear}
            </div>
            <button
              onClick={() => {
                let m = selectedMonth + 1,
                  y = selectedMonthYear;
                if (m > 11) {
                  m = 0;
                  y++;
                }
                setSelectedMonth(m);
                setSelectedMonthYear(y);
              }}
              style={{
                background: "#242436",
                border: "1px solid #2A2A3D",
                borderRadius: 8,
                padding: "6px 10px",
                color: "white",
                cursor: "pointer",
              }}
            >
              ›
            </button>
          </div>

          {showNewFaculty && (
            <div
              style={{
                background: "#1A1A24",
                border: "1px solid #2A2A3D",
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <input
                value={newFacultyName}
                onChange={(e) => setNewFacultyName(e.target.value)}
                placeholder="Faculty name *"
                style={{ ...S.input, marginBottom: 8 }}
              />
              <input
                value={newFacultyPhone}
                onChange={(e) => setNewFacultyPhone(e.target.value)}
                placeholder="Phone (optional)"
                style={{ ...S.input, marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    if (!newFacultyName.trim()) return;
                    createFaculty.mutate(
                      {
                        name: newFacultyName.trim(),
                        phone: newFacultyPhone.trim(),
                      },
                      {
                        onSuccess: () => {
                          setNewFacultyName("");
                          setNewFacultyPhone("");
                          setShowNewFaculty(false);
                          showToast("Faculty added!");
                        },
                      },
                    );
                  }}
                  style={{
                    flex: 1,
                    background: "#6C3CE1",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setShowNewFaculty(false)}
                  style={{
                    background: "none",
                    border: "1px solid #2A2A3D",
                    color: "#9CA3AF",
                    borderRadius: 10,
                    padding: "10px 16px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              background: "#242436",
              border: "1px solid #2A2A3D",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ color: "#9CA3AF" }}>🔍</span>
            <input
              value={facultyListSearch}
              onChange={(e) => setFacultyListSearch(e.target.value)}
              placeholder="Search faculty..."
              style={{
                background: "transparent",
                border: "none",
                color: "#F5F5F7",
                fontSize: 14,
                outline: "none",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
          </div>

          {faculties
            .filter(
              (f) =>
                !facultyListSearch ||
                f.name.toLowerCase().includes(facultyListSearch.toLowerCase()),
            )
            .map((f) => (
              <div
                key={f.id}
                style={{
                  background: "#1A1A24",
                  border: "1px solid #2A2A3D",
                  borderRadius: 14,
                  marginBottom: 10,
                  overflow: "hidden",
                }}
              >
                {editingFacultyId === f.id ? (
                  <div style={{ padding: 14 }}>
                    <input
                      value={editFacultyName}
                      onChange={(e) => setEditFacultyName(e.target.value)}
                      placeholder="Name *"
                      style={{ ...S.input, marginBottom: 8 }}
                    />
                    <input
                      value={editFacultyPhone}
                      onChange={(e) => setEditFacultyPhone(e.target.value)}
                      placeholder="Phone"
                      style={{ ...S.input, marginBottom: 10 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          updateFaculty.mutate(
                            {
                              id: f.id,
                              body: {
                                name: editFacultyName,
                                phone: editFacultyPhone,
                              },
                            },
                            {
                              onSuccess: () => {
                                setEditingFacultyId(null);
                                showToast("Faculty updated");
                              },
                            },
                          );
                        }}
                        style={{
                          flex: 1,
                          background: "#6C3CE1",
                          color: "white",
                          border: "none",
                          borderRadius: 10,
                          padding: "10px",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingFacultyId(null)}
                        style={{
                          background: "none",
                          border: "1px solid #2A2A3D",
                          color: "#9CA3AF",
                          borderRadius: 10,
                          padding: "10px 16px",
                          fontSize: 13,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "linear-gradient(135deg,#6C3CE1,#8B5CF6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      🎓
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {f.name}
                      </div>
                      {f.phone && (
                        <div
                          style={{
                            fontSize: 13,
                            color: "#9CA3AF",
                            marginTop: 2,
                          }}
                        >
                          {f.phone}
                        </div>
                      )}
                      <div
                        style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}
                      >
                        {(() => {
                          const som = new Date(
                            selectedMonthYear,
                            selectedMonth,
                            1,
                          );
                          const eom = new Date(
                            selectedMonthYear,
                            selectedMonth + 1,
                            1,
                          );
                          const monthBatches = batches.filter(
                            (bt) => bt.facultyId === f.id,
                          );
                          const monthSessions = allBookings.filter(
                            (b) =>
                              b.batchId &&
                              monthBatches.some((bt) => bt.id === b.batchId) &&
                              new Date(b.startTime) >= som &&
                              new Date(b.startTime) < eom,
                          ).length;
                          return (
                            <>
                              {monthSessions} classes this month
                              {f.batches && f.batches.length > 0 ? (
                                <span style={{ color: "#8B5CF6" }}>
                                  {" "}
                                  · {f.batches.length} active batch
                                  {f.batches.length > 1 ? "es" : ""}
                                </span>
                              ) : null}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <button
                        onClick={() => {
                          setEditingFacultyId(f.id);
                          setEditFacultyName(f.name);
                          setEditFacultyPhone(f.phone ?? "");
                        }}
                        style={{
                          background: "rgba(108,60,225,0.15)",
                          border: "1px solid rgba(108,60,225,0.3)",
                          color: "#8B5CF6",
                          borderRadius: 8,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setFacultyAttendanceModal(f);
                          loadFacultyAttendance(f.id);
                        }}
                        style={{
                          background: "rgba(245,158,11,0.15)",
                          border: "1px solid rgba(245,158,11,0.3)",
                          color: "#F59E0B",
                          borderRadius: 8,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Attend.
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm("Archive " + f.name + "?")) return;
                          updateFaculty.mutate(
                            { id: f.id, body: { active: false } },
                            { onSuccess: () => showToast("Faculty archived") },
                          );
                        }}
                        style={{
                          background: "rgba(245,158,11,0.15)",
                          border: "1px solid rgba(245,158,11,0.3)",
                          color: "#F59E0B",
                          borderRadius: 8,
                          padding: "5px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          {faculties.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#4B5563",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>
                🎓
              </div>
              <div style={{ fontSize: 13 }}>No faculty added yet</div>
            </div>
          )}
        </div>
      )}

      {/* Faculty Attendance Modal */}
      {facultyAttendanceModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setFacultyAttendanceModal(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#1A1A24",
              border: "1px solid #2A2A3D",
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 36px",
              width: "100%",
              maxWidth: 480,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: "#2A2A3D",
                borderRadius: 2,
                margin: "0 auto 20px",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Attendance — {facultyAttendanceModal.name}
              </h2>
              <button
                onClick={() => setFacultyAttendanceModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9CA3AF",
                  fontSize: 24,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
              {facultyAttendance.filter((a) => a.present).length} classes
              conducted · {facultyAttendance.filter((a) => !a.present).length}{" "}
              absent
            </div>
            {(() => {
              const facultyBatches = batches.filter(
                (bt) => bt.facultyId === facultyAttendanceModal.id,
              );
              const allSessions = facultyBatches
                .flatMap((bt) =>
                  bt.bookings.map((b) => ({
                    ...b,
                    batchName: bt.name,
                    batchColor: bt.color,
                  })),
                )
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              if (allSessions.length === 0)
                return (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "30px 0",
                      color: "#4B5563",
                      fontSize: 13,
                    }}
                  >
                    No sessions assigned to this faculty
                  </div>
                );
              const todayM = new Date();
              todayM.setHours(0, 0, 0, 0);
              const tomorrowM = new Date(todayM);
              tomorrowM.setDate(tomorrowM.getDate() + 1);
              const future = allSessions.filter(
                (s) => new Date(s.startTime) >= tomorrowM,
              );
              const todayAndPast = allSessions.filter(
                (s) => new Date(s.startTime) < tomorrowM,
              );
              const past = todayAndPast.filter(
                (s) => new Date(s.startTime) < todayM,
              );
              const todaySess = todayAndPast.filter(
                (s) => new Date(s.startTime) >= todayM,
              );
              return (
                <>
                  {future.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#9CA3AF",
                          marginBottom: 10,
                        }}
                      >
                        UPCOMING ({future.length})
                      </div>
                      {future.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 14px",
                            background: "#1A1A24",
                            borderRadius: 12,
                            marginBottom: 8,
                            border: "1px solid #2A2A3D",
                            opacity: 0.6,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#6B7280",
                              }}
                            >
                              {new Date(s.startTime).toLocaleDateString(
                                "en-IN",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#4B5563",
                                marginTop: 2,
                              }}
                            >
                              {fmtTime12(s.startTime)} ·{" "}
                              <span style={{ color: s.batchColor }}>
                                {s.batchName}
                              </span>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              color: "#4B5563",
                              fontStyle: "italic",
                            }}
                          >
                            Upcoming
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  {todaySess.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#34D399",
                          marginBottom: 10,
                        }}
                      >
                        TODAY ({todaySess.length})
                      </div>
                      {todaySess.map((s) => {
                        const rec = facultyAttendance.find(
                          (a) => a.bookingId === s.id,
                        );
                        const isAbsent = rec && !rec.present;
                        return (
                          <div
                            key={s.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px 14px",
                              background: "#242436",
                              borderRadius: 12,
                              marginBottom: 8,
                              border: `1px solid ${isAbsent ? "rgba(239,68,68,0.3)" : "rgba(52,211,153,0.2)"}`,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: isAbsent ? "#EF4444" : "#34D399",
                                }}
                              >
                                {new Date(s.startTime).toLocaleDateString(
                                  "en-IN",
                                  {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  },
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#6B7280",
                                  marginTop: 2,
                                }}
                              >
                                {fmtTime12(s.startTime)} ·{" "}
                                <span style={{ color: s.batchColor }}>
                                  {s.batchName}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Mark " +
                                        facultyAttendanceModal!.name +
                                        " as present?",
                                    )
                                  )
                                    return;
                                  markAttendance.mutate({
                                    facultyId: facultyAttendanceModal!.id,
                                    bookingId: s.id,
                                    present: true,
                                  });
                                }}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  border: "none",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  background:
                                    !isAbsent && rec
                                      ? "rgba(52,211,153,0.2)"
                                      : "rgba(255,255,255,0.05)",
                                  color:
                                    !isAbsent && rec ? "#34D399" : "#6B7280",
                                }}
                              >
                                ✓
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Mark " +
                                        facultyAttendanceModal!.name +
                                        " as absent?",
                                    )
                                  )
                                    return;
                                  markAttendance.mutate({
                                    facultyId: facultyAttendanceModal!.id,
                                    bookingId: s.id,
                                    present: false,
                                  });
                                }}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  border: "none",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  background: isAbsent
                                    ? "rgba(239,68,68,0.2)"
                                    : "rgba(255,255,255,0.05)",
                                  color: isAbsent ? "#EF4444" : "#6B7280",
                                }}
                              >
                                ✗
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                  {past.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#9CA3AF",
                          margin: "16px 0 10px",
                        }}
                      >
                        PAST ({past.length})
                      </div>
                      {past.map((s) => {
                        const rec = facultyAttendance.find(
                          (a) => a.bookingId === s.id,
                        );
                        const isAbsent = rec && !rec.present;
                        const isPresent = rec && rec.present;
                        return (
                          <div
                            key={s.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px 14px",
                              background: "#1A1A24",
                              borderRadius: 12,
                              marginBottom: 8,
                              border: `1px solid ${isAbsent ? "rgba(239,68,68,0.3)" : isPresent ? "rgba(52,211,153,0.3)" : "#2A2A3D"}`,
                              opacity: 0.9,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: isAbsent
                                    ? "#EF4444"
                                    : isPresent
                                      ? "#34D399"
                                      : "#9CA3AF",
                                }}
                              >
                                {new Date(s.startTime).toLocaleDateString(
                                  "en-IN",
                                  {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  },
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#6B7280",
                                  marginTop: 2,
                                }}
                              >
                                {fmtTime12(s.startTime)} ·{" "}
                                <span style={{ color: s.batchColor }}>
                                  {s.batchName}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Mark " +
                                        facultyAttendanceModal.name +
                                        " as present?",
                                    )
                                  )
                                    return;
                                  markAttendance.mutate({
                                    facultyId: facultyAttendanceModal.id,
                                    bookingId: s.id,
                                    present: true,
                                  });
                                }}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  border: "none",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  background: isPresent
                                    ? "rgba(52,211,153,0.2)"
                                    : "rgba(255,255,255,0.05)",
                                  color: isPresent ? "#34D399" : "#6B7280",
                                }}
                              >
                                ✓
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Mark " +
                                        facultyAttendanceModal.name +
                                        " as absent?",
                                    )
                                  )
                                    return;
                                  markAttendance.mutate({
                                    facultyId: facultyAttendanceModal.id,
                                    bookingId: s.id,
                                    present: false,
                                  });
                                }}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  border: "none",
                                  fontSize: 11,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  background: isAbsent
                                    ? "rgba(239,68,68,0.2)"
                                    : "rgba(255,255,255,0.05)",
                                  color: isAbsent ? "#EF4444" : "#6B7280",
                                }}
                              >
                                ✗
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Absence Modal */}
      {absenceModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAbsenceModal(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#1A1A24",
              border: "1px solid #2A2A3D",
              borderRadius: "24px 24px 0 0",
              padding: "24px 20px 36px",
              width: "100%",
              maxWidth: 480,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                background: "#2A2A3D",
                borderRadius: 2,
                margin: "0 auto 20px",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                Attendance — {absenceModal.name}
              </h2>
              <button
                onClick={() => setAbsenceModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9CA3AF",
                  fontSize: 24,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
              {absences.length} absence{absences.length !== 1 ? "s" : ""}{" "}
              recorded
            </div>

            {/* Sessions from batches this student is in */}
            {(() => {
              const studentBatches = batches.filter((bt) =>
                bt.enrolments.some((e) => e.clientId === absenceModal.id),
              );
              const allSessions = studentBatches
                .flatMap((bt) =>
                  bt.bookings.map((b) => ({
                    ...b,
                    batchName: bt.name,
                    batchColor: bt.color,
                  })),
                )
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              if (allSessions.length === 0)
                return (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "30px 0",
                      color: "#4B5563",
                      fontSize: 13,
                    }}
                  >
                    No batch sessions found
                  </div>
                );

              const todayStr = fmtDate(new Date());
              const _todayM3 = new Date();
              _todayM3.setHours(0, 0, 0, 0);
              const _tomM3 = new Date(_todayM3);
              _tomM3.setDate(_tomM3.getDate() + 1);
              const upcoming = allSessions.filter(
                (s) => new Date(s.startTime) >= _tomM3,
              );
              const todaySess = allSessions.filter(
                (s) =>
                  new Date(s.startTime) >= _todayM3 &&
                  new Date(s.startTime) < _tomM3,
              );
              const past = allSessions.filter(
                (s) => new Date(s.startTime) < _todayM3,
              );

              return (
                <>
                  {upcoming.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#9CA3AF",
                          marginBottom: 10,
                        }}
                      >
                        UPCOMING ({upcoming.length})
                      </div>
                      {upcoming.map((s) => (
                        <div
                          key={s.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 14px",
                            background: "#1A1A24",
                            borderRadius: 12,
                            marginBottom: 8,
                            border: "1px solid #2A2A3D",
                            opacity: 0.6,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#6B7280",
                              }}
                            >
                              {new Date(s.startTime).toLocaleDateString(
                                "en-IN",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#4B5563",
                                marginTop: 2,
                              }}
                            >
                              {fmtTime12(s.startTime)} ·{" "}
                              <span style={{ color: s.batchColor }}>
                                {s.batchName}
                              </span>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: 11,
                              color: "#4B5563",
                              fontStyle: "italic",
                            }}
                          >
                            Upcoming
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  {todaySess.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#34D399",
                          marginBottom: 10,
                        }}
                      >
                        TODAY ({todaySess.length})
                      </div>
                      {todaySess.map((s) => {
                        const isAbsent = absences.some(
                          (a) => a.bookingId === s.id,
                        );
                        return (
                          <div
                            key={s.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px 14px",
                              background: "#242436",
                              borderRadius: 12,
                              marginBottom: 8,
                              border: `1px solid ${isAbsent ? "rgba(239,68,68,0.3)" : "rgba(52,211,153,0.2)"}`,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: isAbsent ? "#EF4444" : "#34D399",
                                }}
                              >
                                {new Date(s.startTime).toLocaleDateString(
                                  "en-IN",
                                  {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  },
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#6B7280",
                                  marginTop: 2,
                                }}
                              >
                                {fmtTime12(s.startTime)} ·{" "}
                                <span style={{ color: s.batchColor }}>
                                  {s.batchName}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const body = {
                                  clientId: absenceModal!.id,
                                  bookingId: s.id,
                                };
                                if (isAbsent) {
                                  if (
                                    !confirm(
                                      "Remove absence for " +
                                        absenceModal!.name +
                                        "?",
                                    )
                                  )
                                    return;
                                  removeAbsence.mutate(body);
                                } else {
                                  if (
                                    !confirm(
                                      "Mark " +
                                        absenceModal!.name +
                                        " as absent for this session?",
                                    )
                                  )
                                    return;
                                  addAbsence.mutate(body);
                                }
                              }}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "none",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                background: isAbsent
                                  ? "rgba(239,68,68,0.2)"
                                  : "rgba(108,60,225,0.15)",
                                color: isAbsent ? "#EF4444" : "#8B5CF6",
                              }}
                            >
                              {isAbsent ? "✗ Absent" : "Mark Absent"}
                            </button>
                          </div>
                        );
                      })}
                    </>
                  )}
                  {past.length > 0 && (
                    <>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#9CA3AF",
                          margin: "16px 0 10px",
                        }}
                      >
                        PAST ({past.length})
                      </div>
                      {past.map((s) => {
                        const isAbsent = absences.some(
                          (a) => a.bookingId === s.id,
                        );
                        return (
                          <div
                            key={s.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px 14px",
                              background: "#1A1A24",
                              borderRadius: 12,
                              marginBottom: 8,
                              border: `1px solid ${isAbsent ? "rgba(239,68,68,0.3)" : "#2A2A3D"}`,
                              opacity: 0.8,
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: isAbsent ? "#EF4444" : "#9CA3AF",
                                }}
                              >
                                {new Date(s.startTime).toLocaleDateString(
                                  "en-IN",
                                  {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  },
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#6B7280",
                                  marginTop: 2,
                                }}
                              >
                                {fmtTime12(s.startTime)} ·{" "}
                                <span style={{ color: s.batchColor }}>
                                  {s.batchName}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const body = {
                                  clientId: absenceModal.id,
                                  bookingId: s.id,
                                };
                                if (isAbsent) {
                                  removeAbsence.mutate(body);
                                } else {
                                  addAbsence.mutate(body);
                                }
                              }}
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "none",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                background: isAbsent
                                  ? "rgba(239,68,68,0.2)"
                                  : "rgba(255,255,255,0.05)",
                                color: isAbsent ? "#EF4444" : "#6B7280",
                              }}
                            >
                              {isAbsent ? "✗ Absent" : "Mark Absent"}
                            </button>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Toast */}
      <div
        style={{
          position: "fixed",
          bottom: 90,
          left: "50%",
          transform: `translateX(-50%) translateY(${toastOn ? 0 : 20}px)`,
          background: "#242436",
          border: "1px solid #2A2A3D",
          padding: "12px 20px",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 500,
          zIndex: 300,
          opacity: toastOn ? 1 : 0,
          transition: "all 0.3s",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {toast}
      </div>
      </div>
    </div>
    </AppProvider>
  );
}
