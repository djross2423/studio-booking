"use client";

import type { ReactNode, CSSProperties } from "react";

// Centered overlay modal. Clicking the backdrop calls onClose; clicks inside
// the panel are stopped. Matches the app's existing modal styling.
export function Modal({
  onClose,
  children,
  maxWidth = 420,
  padding = 20,
  zIndex = 260,
  panelStyle,
  overlayStyle,
}: {
  onClose?: () => void;
  children: ReactNode;
  maxWidth?: number;
  padding?: number;
  zIndex?: number;
  panelStyle?: CSSProperties;
  overlayStyle?: CSSProperties;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...overlayStyle,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "90%",
          maxWidth,
          background: "#1A1A24",
          border: "1px solid #2A2A3D",
          borderRadius: 16,
          padding,
          maxHeight: "90vh",
          overflowY: "auto",
          ...panelStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
