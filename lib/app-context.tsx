"use client";

import { createContext, useContext } from "react";
import type { Tab, Client, Enrollment } from "@/lib/types";
import type {
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
  useAddPayment,
  useMarkAttendance,
  useAddAbsence,
  useRemoveAbsence,
} from "@/lib/mutations";

// App-wide services shared by most components: toast, navigation, every
// mutation, and the on-demand refetch helpers. Component-local state (form
// fields, modal flags) stays as props / local state, not here.
export type AppServices = {
  showToast: (msg: string) => void;
  setTab: (t: Tab) => void;

  // Open the shared payment modal for an enrollment.
  openPaymentModal: (enrollment: Enrollment) => void;
  // Open the shared absence modal for a client.
  openAbsenceModal: (client: Client) => void;

  // Mutations
  saveBooking: ReturnType<typeof useSaveBooking>;
  deleteBooking: ReturnType<typeof useDeleteBooking>;
  createBatch: ReturnType<typeof useCreateBatch>;
  updateBatch: ReturnType<typeof useUpdateBatch>;
  deleteBatch: ReturnType<typeof useDeleteBatch>;
  pushBatch: ReturnType<typeof usePushBatch>;
  createClient: ReturnType<typeof useCreateClient>;
  updateClient: ReturnType<typeof useUpdateClient>;
  deleteClient: ReturnType<typeof useDeleteClient>;
  createFaculty: ReturnType<typeof useCreateFaculty>;
  updateFaculty: ReturnType<typeof useUpdateFaculty>;
  deleteFaculty: ReturnType<typeof useDeleteFaculty>;
  enroll: ReturnType<typeof useEnroll>;
  setEnrollmentStatus: ReturnType<typeof useSetEnrollmentStatus>;
  saveCourse: ReturnType<typeof useSaveCourse>;
  archiveCourse: ReturnType<typeof useArchiveCourse>;
  addPayment: ReturnType<typeof useAddPayment>;
  markAttendance: ReturnType<typeof useMarkAttendance>;
  addAbsence: ReturnType<typeof useAddAbsence>;
  removeAbsence: ReturnType<typeof useRemoveAbsence>;

  // On-demand refetch helpers
  refreshEnrollments: () => void;
  refreshBatches: () => void;
  refreshAllClients: () => void;
  refreshFaculties: () => void;
  loadArchivedClients: () => void;
  loadArchivedFaculties: () => void;
};

const AppContext = createContext<AppServices | null>(null);

export const AppProvider = AppContext.Provider;

export function useApp(): AppServices {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
