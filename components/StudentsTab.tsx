"use client";

import { useState } from "react";
import type { Client, Batch, Booking } from "@/lib/types";
import { S } from "@/lib/styles";
import { useApp } from "@/lib/app-context";
import { Avatar } from "@/components/ui/Avatar";

export function StudentsTab({
  allClients,
  batches,
  allBookings,
}: {
  allClients: Client[];
  batches: Batch[];
  allBookings: Booking[];
}) {
  const { createClient, updateClient, showToast, openAbsenceModal } = useApp();
  const [clientListSearch, setClientListSearch] = useState("");
  const [showNewClientDirect, setShowNewClientDirect] = useState(false);
  const [directClientName, setDirectClientName] = useState("");
  const [directClientPhone, setDirectClientPhone] = useState("");
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
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
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
              Students
            </h2>
            <button
              onClick={() => {
                setShowNewClientDirect(true);
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
              + Add Student
            </button>
          </div>
          {showNewClientDirect && (
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
                value={directClientName}
                onChange={(e) => setDirectClientName(e.target.value)}
                placeholder="Student name *"
                style={{ ...S.input, marginBottom: 8 }}
              />
              <input
                value={directClientPhone}
                onChange={(e) => setDirectClientPhone(e.target.value)}
                placeholder="Phone (optional)"
                style={{ ...S.input, marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  disabled={!directClientName.trim() || createClient.isPending}
                  onClick={() => {
                    if (!directClientName.trim() || createClient.isPending)
                      return;
                    createClient.mutate(
                      {
                        name: directClientName.trim(),
                        phone: directClientPhone.trim(),
                      },
                      {
                        onSuccess: () => {
                          setDirectClientName("");
                          setDirectClientPhone("");
                          setShowNewClientDirect(false);
                          showToast("Student added!");
                        },
                      },
                    );
                  }}
                  style={{
                    flex: 1,
                    background:
                      !directClientName.trim() || createClient.isPending
                        ? "#3A2E5C"
                        : "#6C3CE1",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor:
                      !directClientName.trim() || createClient.isPending
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      !directClientName.trim() || createClient.isPending
                        ? 0.6
                        : 1,
                  }}
                >
                  {createClient.isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setShowNewClientDirect(false)}
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
              value={clientListSearch}
              onChange={(e) => setClientListSearch(e.target.value)}
              placeholder="Search students..."
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
          {allClients
            .filter(
              (c) =>
                !clientListSearch ||
                c.name.toLowerCase().includes(clientListSearch.toLowerCase()),
            )
            .map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#1A1A24",
                  border: "1px solid #2A2A3D",
                  borderRadius: 14,
                  marginBottom: 10,
                  overflow: "hidden",
                }}
              >
                {editingClientId === c.id ? (
                  <div style={{ padding: 14 }}>
                    <input
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      placeholder="Name *"
                      style={{ ...S.input, marginBottom: 8 }}
                    />
                    <input
                      value={editClientPhone}
                      onChange={(e) => setEditClientPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      style={{ ...S.input, marginBottom: 10 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          updateClient.mutate(
                            {
                              id: c.id,
                              body: {
                                name: editClientName,
                                phone: editClientPhone,
                              },
                            },
                            {
                              onSuccess: () => {
                                setEditingClientId(null);
                                showToast("Student updated");
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
                        onClick={() => setEditingClientId(null)}
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
                    <Avatar name={c.name} size={40} radius={10} fontSize={14} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {c.name}
                      </div>
                      {c.phone && (
                        <div
                          style={{
                            fontSize: 13,
                            color: "#9CA3AF",
                            marginTop: 2,
                          }}
                        >
                          {c.phone}
                        </div>
                      )}
                      <div
                        style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}
                      >
                        {(() => {
                          const nowMidnight = new Date();
                          nowMidnight.setHours(0, 0, 0, 0);
                          const remainingBatch = batches
                            .filter((bt) =>
                              bt.enrolments.some((e) => e.clientId === c.id),
                            )
                            .reduce(
                              (sum, bt) =>
                                sum +
                                bt.bookings.filter(
                                  (b) => new Date(b.startTime) >= nowMidnight,
                                ).length,
                              0,
                            );
                          const remainingDirect = allBookings.filter(
                            (b) =>
                              b.clientId === c.id &&
                              !b.batchId &&
                              new Date(b.startTime) >= nowMidnight,
                          ).length;
                          const absenceCount = c._count?.absences || 0;
                          const total = remainingBatch + remainingDirect;
                          return (
                            <>
                              {total} session{total !== 1 ? "s" : ""} left
                              {absenceCount > 0 ? (
                                <span style={{ color: "#EF4444" }}>
                                  {" "}
                                  · {absenceCount} absent
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
                          setEditingClientId(c.id);
                          setEditClientName(c.name);
                          setEditClientPhone(c.phone ?? "");
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
                        onClick={() => openAbsenceModal(c)}
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
                        Attendance
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm("Archive " + c.name + "?")) return;
                          updateClient.mutate(
                            { id: c.id, body: { active: false } },
                            {
                              onSuccess: () => showToast("Student archived"),
                            },
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
          {allClients.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#4B5563",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>
                👥
              </div>
              <div style={{ fontSize: 13 }}>No students yet</div>
            </div>
          )}
        </div>
  );
}
