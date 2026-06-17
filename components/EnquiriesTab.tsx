"use client";

import { useState } from "react";
import type { Enquiry } from "@/lib/types";
import { S } from "@/lib/styles";
import { useEnquiries } from "@/lib/queries";
import { Avatar } from "@/components/ui/Avatar";

export function EnquiriesTab() {
  const [filter, setFilter] = useState("");
  const { data: enquiries = [], isLoading } = useEnquiries<Enquiry>();

  const q = filter.trim().toLowerCase();
  const rows = enquiries.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      (e.phone || "").toLowerCase().includes(q),
  );

  return (
    <div style={S.page}>
      <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>
        🌱 Enquiries
      </h2>

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by name or phone..."
        style={{ ...S.input, marginBottom: 16 }}
      />

      {rows.map((e) => (
        <div
          key={e.id}
          style={{
            background: "#1A1A24",
            border: "1px solid #2A2A3D",
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Avatar name={e.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{e.name}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
              {e.phone ? `📞 ${e.phone}` : "No phone"}
              {e.booking?.startTime
                ? ` · 🎯 Demo ${new Date(
                    e.booking.startTime,
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}`
                : ""}
            </div>
          </div>
        </div>
      ))}

      {!isLoading && rows.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#4B5563",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🌱</div>
          <div style={{ fontSize: 13 }}>
            No enquiries{q ? " match that search" : " yet"}
          </div>
        </div>
      )}
    </div>
  );
}
