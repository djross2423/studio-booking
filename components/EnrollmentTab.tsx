"use client";

import type { Enrollment, Batch } from "@/lib/types";
import { S } from "@/lib/styles";
import { useApp } from "@/lib/app-context";

export function EnrollmentTab({
  enrollments,
  batches,
  setShowEnrollmentModal,
  resetEnrollmentForm,
}: {
  enrollments: Enrollment[];
  batches: Batch[];
  setShowEnrollmentModal: (b: boolean) => void;
  resetEnrollmentForm: () => void;
}) {
  const {
    setEnrollmentStatus,
    setTab,
    showToast,
    refreshBatches,
    openPaymentModal,
  } = useApp();
  return (
        <div style={S.page}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
              }}
            >
              Enrollment
            </h2>

            <button
              onClick={() => {
                resetEnrollmentForm()
                setShowEnrollmentModal(true)
              }}
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
              + Enroll Student
            </button>
          </div>

          {enrollments.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#4B5563",
              }}
            >
              No enrollments yet
            </div>
          )}

          {enrollments.map((enrollment) => {
            const paid = enrollment.payments.reduce(
              (sum, p) => sum + p.amount,
              0,
            );

            const balance = enrollment.totalFee - enrollment.discount - paid;
            const isPaused = enrollment.status === "paused";
            const currentBatch = batches.find(
              (b) =>
                b.courseId === enrollment.course.id &&
                b.enrolments.some((e) => e.clientId === enrollment.client.id),
            );

            return (
              <div
                key={enrollment.id}
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
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  {enrollment.client.name}
                </div>

                {enrollment.client.phone && (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#9CA3AF",
                      marginTop: 2,
                    }}
                  >
                    {enrollment.client.phone}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 12,
                    fontSize: 13,
                  }}
                >
                  📘 {enrollment.course.name}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "#6B7280",
                  }}
                >
                  📅 Enrolled{" "}
                  {new Date(enrollment.enrolledOn).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    color: isPaused
                      ? "#9CA3AF"
                      : currentBatch
                        ? "#8B5CF6"
                        : "#F59E0B",
                  }}
                >
                  {isPaused
                    ? "⏸ Paused"
                    : currentBatch
                      ? `📚 ${currentBatch.name}`
                      : "⚠ Batch Not Assigned"}
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
                      ₹{enrollment.totalFee.toLocaleString()}
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
                      {enrollment.discount > 0
                        ? `₹${enrollment.discount.toLocaleString()}`
                        : "—"}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6B7280",
                      }}
                    >
                      Balance
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        color: balance > 0 ? "#EF4444" : "#10B981",
                      }}
                    >
                      ₹{balance.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 14,
                  }}
                >
                  <button
                    onClick={() => openPaymentModal(enrollment)}
                    style={{
                      flex: 1,
                      background: "rgba(16,185,129,.15)",
                      border: "1px solid rgba(16,185,129,.3)",
                      color: "#10B981",
                      borderRadius: 8,
                      padding: "8px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add Payment
                  </button>

                  {!isPaused && (
                    <button
                      onClick={() => {
                        refreshBatches();
                        setTab("batches");
                      }}
                      style={{
                        flex: 1,
                        background: "rgba(108,60,225,.15)",
                        border: "1px solid rgba(108,60,225,.3)",
                        color: "#8B5CF6",
                        borderRadius: 8,
                        padding: "8px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Assign Batch
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const next = isPaused ? "active" : "paused";
                      if (
                        next === "paused" &&
                        !confirm(
                          `Pause ${enrollment.client.name}'s course?` +
                            (currentBatch
                              ? ` They'll be removed from ${currentBatch.name}.`
                              : ""),
                        )
                      )
                        return;
                      setEnrollmentStatus.mutate(
                        { id: enrollment.id, status: next },
                        {
                          onSuccess: () =>
                            showToast(
                              next === "paused"
                                ? "Course paused"
                                : "Course resumed",
                            ),
                        },
                      );
                    }}
                    style={{
                      flex: 1,
                      background: isPaused
                        ? "rgba(16,185,129,.15)"
                        : "rgba(245,158,11,.15)",
                      border: isPaused
                        ? "1px solid rgba(16,185,129,.3)"
                        : "1px solid rgba(245,158,11,.3)",
                      color: isPaused ? "#10B981" : "#F59E0B",
                      borderRadius: 8,
                      padding: "8px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {isPaused ? "▶ Resume" : "⏸ Pause"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
  );
}
