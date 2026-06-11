"use client";

import type { Tab } from "@/lib/types";

const NAV: [Tab, string, string][] = [
  ["dashboard", "Home", "🏠"],
  ["calendar", "Calendar", "📅"],
  ["batches", "Batches", "📚"],
  ["students", "Students", "👥"],
  ["faculty", "Faculty", "🎓"],
  ["courses", "Courses", "📘"],
  ["enrollment", "Enrollment", "📝"],
  ["fees", "Fees", "💰"],
  ["payments", "Payments", "💳"],
  ["archives", "Archives", "🗄️"],
];

export function Sidebar({
  tab,
  onNavigate,
  open,
  onClose,
}: {
  tab: Tab;
  onNavigate: (t: Tab) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className={"sidebar-backdrop" + (open ? " open" : "")}
        onClick={onClose}
      />
      <nav className={"sidebar" + (open ? " open" : "")}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#F5F5F7",
            padding: "8px 12px 20px",
          }}
        >
          🎵 Raw Music
        </div>
        {NAV.map(([id, label, icon]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 12px",
                marginBottom: 4,
                borderRadius: 10,
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                background: active ? "rgba(108,60,225,0.18)" : "transparent",
                color: active ? "#A78BFA" : "#9CA3AF",
              }}
            >
              <span style={{ fontSize: 18 }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
