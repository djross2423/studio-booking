"use client";
export function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{ textAlign: "center", padding: "40px 20px", color: "#4B5563" }}
    >
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>📭</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}
