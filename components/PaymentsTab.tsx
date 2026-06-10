"use client";

import type { Enrollment } from "@/lib/types";
import { S } from "@/lib/styles";
import { SubTabs } from "@/components/ui/SubTabs";

export function PaymentsTab({
  enrollments,
  paymentTab,
  setPaymentTab,
  paymentFilter,
  setPaymentFilter,
}: {
  enrollments: Enrollment[];
  paymentTab: "received" | "pending";
  setPaymentTab: (t: "received" | "pending") => void;
  paymentFilter: string;
  setPaymentFilter: (s: string) => void;
}) {
const q = paymentFilter.trim().toLowerCase();
const received = enrollments
  .flatMap((e) =>
    e.payments.map((p) => ({
      key: p.id,
      name: e.client.name,
      amount: p.amount,
      date: p.paymentDate,
      method: p.paymentMethod,
    })),
  )
  .filter((r) => r.name.toLowerCase().includes(q))
  .sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
const pending = enrollments
  .map((e) => {
    const paid = e.payments.reduce((s, p) => s + p.amount, 0);
    return {
      key: e.id,
      name: e.client.name,
      balance: e.totalFee - e.discount - paid,
    };
  })
  .filter((p) => p.balance > 0)
  .filter((p) => p.name.toLowerCase().includes(q));

return (
  <div style={S.page}>
    <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>
      💳 Payments
    </h2>

    <SubTabs
      value={paymentTab}
      onChange={setPaymentTab}
      marginBottom={12}
      tabs={[
        ["received", `Received (${received.length})`],
        ["pending", `Pending (${pending.length})`],
      ]}
    />

    {/* Student name filter */}
    <input
      value={paymentFilter}
      onChange={(e) => setPaymentFilter(e.target.value)}
      placeholder="Filter by student name..."
      style={{ ...S.input, marginBottom: 16 }}
    />

    {paymentTab === "received" &&
      received.map((r) => (
        <div
          key={r.key}
          style={{
            background: "#1A1A24",
            border: "1px solid #2A2A3D",
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>
              {r.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                marginTop: 4,
              }}
            >
              📅{" "}
              {new Date(r.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {r.method ? ` · ${r.method}` : ""}
            </div>
          </div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              color: "#10B981",
            }}
          >
            ₹{r.amount.toLocaleString()}
          </div>
        </div>
      ))}

    {paymentTab === "pending" &&
      pending.map((p) => (
        <div
          key={p.key}
          style={{
            background: "#1A1A24",
            border: "1px solid #2A2A3D",
            borderRadius: 14,
            padding: 16,
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {p.name}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#6B7280" }}>
              Balance
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "#F59E0B",
              }}
            >
              ₹{p.balance.toLocaleString()}
            </div>
          </div>
        </div>
      ))}

    {((paymentTab === "received" && received.length === 0) ||
      (paymentTab === "pending" && pending.length === 0)) && (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          color: "#4B5563",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>
          💳
        </div>
        <div style={{ fontSize: 13 }}>
          {paymentTab === "received"
            ? "No payments received"
            : "No pending payments"}
          {q ? " for that name" : ""}
        </div>
      </div>
    )}
  </div>
);
}
