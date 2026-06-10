"use client";

import { getInitials, avatarColor } from "@/lib/format";

// Initials chip with a deterministic color derived from the name.
export function Avatar({
  name,
  size = 32,
  radius = 8,
  fontSize = 12,
}: {
  name: string;
  size?: number;
  radius?: number;
  fontSize?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: avatarColor(name),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize,
        color: "white",
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
}
