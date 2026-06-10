"use client";

// Pill-style segmented toggle used by Payments/Archives/Fees/Batches sub-views.
export function SubTabs<T extends string>({
  value,
  onChange,
  tabs,
  marginBottom = 16,
}: {
  value: T;
  onChange: (v: T) => void;
  tabs: readonly (readonly [T, string])[];
  marginBottom?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        background: "#1A1A24",
        border: "1px solid #2A2A3D",
        borderRadius: 12,
        padding: 4,
        marginBottom,
      }}
    >
      {tabs.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 9,
            border: "none",
            background:
              value === id
                ? "linear-gradient(135deg,#6C3CE1,#8B5CF6)"
                : "transparent",
            color: value === id ? "white" : "#9CA3AF",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
