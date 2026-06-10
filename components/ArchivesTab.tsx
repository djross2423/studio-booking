"use client";

import { useState } from "react";
import type { Client, Faculty } from "@/lib/types";
import { S } from "@/lib/styles";
import { useApp } from "@/lib/app-context";
import { SubTabs } from "@/components/ui/SubTabs";

export function ArchivesTab({
  archivedClients,
  archivedFaculties,
}: {
  archivedClients: Client[];
  archivedFaculties: Faculty[];
}) {
  const {
    updateClient,
    deleteClient: deleteClientMut,
    updateFaculty,
    deleteFaculty,
    showToast,
  } = useApp();
  const [archiveTab, setArchiveTab] = useState<"students" | "faculty">(
    "students",
  );
  return (
        <div style={S.page}>
          <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>
            🗄️ Archives
          </h2>

          <SubTabs
            value={archiveTab}
            onChange={setArchiveTab}
            tabs={[
              ["students", `Students (${archivedClients.length})`],
              ["faculty", `Faculty (${archivedFaculties.length})`],
            ]}
          />

          {/* Archived students */}
          {archiveTab === "students" &&
            archivedClients.map((c) => (
            <div
              key={c.id}
              style={{
                background: "#1A1A24",
                border: "1px solid #2A2A3D",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                {c.phone && (
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {c.phone}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    updateClient.mutate(
                      { id: c.id, body: { active: true } },
                      { onSuccess: () => showToast("Student restored") },
                    );
                  }}
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "#10B981",
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Restore
                </button>
                <button
                  onClick={() => {
                    if (
                      !confirm(
                        "Permanently delete " +
                          c.name +
                          "? This will remove all their bookings and cannot be undone.",
                      )
                    )
                      return;
                    deleteClientMut.mutate(c.id, {
                      onSuccess: () => showToast("Student deleted"),
                    });
                  }}
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#EF4444",
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* Archived faculty */}
          {archiveTab === "faculty" &&
            archivedFaculties.map((f) => (
            <div
              key={f.id}
              style={{
                background: "#1A1A24",
                border: "1px solid #2A2A3D",
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{f.name}</div>
                {f.phone && (
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {f.phone}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    updateFaculty.mutate(
                      { id: f.id, body: { active: true } },
                      { onSuccess: () => showToast("Faculty restored") },
                    );
                  }}
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "#10B981",
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Restore
                </button>
                <button
                  onClick={() => {
                    if (
                      !confirm(
                        "Permanently delete " +
                          f.name +
                          "? This cannot be undone.",
                      )
                    )
                      return;
                    deleteFaculty.mutate(f.id, {
                      onSuccess: () => showToast("Faculty deleted"),
                    });
                  }}
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#EF4444",
                    borderRadius: 8,
                    padding: "5px 10px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {((archiveTab === "students" && archivedClients.length === 0) ||
            (archiveTab === "faculty" && archivedFaculties.length === 0)) && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#4B5563",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>
                🗄️
              </div>
              <div style={{ fontSize: 13 }}>
                No archived {archiveTab === "students" ? "students" : "faculty"}
              </div>
            </div>
          )}
        </div>
  );
}
