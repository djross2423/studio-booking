"use client";

import type { Booking } from "@/lib/types";
import { roomBadge, fmtTime12, bookingColor } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
export function BookingCard({ b, onClick }: { b: Booking; onClick?: () => void }) {
  const badge = roomBadge(b.room);
  const leftColor = bookingColor(b);
  const _bStart = new Date(b.startTime);
  const _todayM = new Date();
  _todayM.setHours(0, 0, 0, 0);
  const _tomorrowM = new Date(_todayM);
  _tomorrowM.setDate(_tomorrowM.getDate() + 1);
  const isBookingToday = _bStart >= _todayM && _bStart < _tomorrowM;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 14,
        background: isBookingToday ? "rgba(108,60,225,0.12)" : "#1A1A24",
        border: isBookingToday
          ? "1.5px solid rgba(108,60,225,0.5)"
          : "1px solid #2A2A3D",
        borderRadius: 14,
        marginBottom: 10,
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {isBookingToday && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: onClick ? 28 : 10,
            fontSize: 10,
            fontWeight: 700,
            color: "#8B5CF6",
            background: "rgba(108,60,225,0.2)",
            padding: "2px 6px",
            borderRadius: 6,
          }}
        >
          TODAY
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: leftColor,
          borderRadius: "0 4px 4px 0",
        }}
      />
      <div
        style={{
          background: "#242436",
          padding: "6px 8px",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          textAlign: "center",
          minWidth: 68,
          lineHeight: 1.5,
          flexShrink: 0,
        }}
      >
        <div style={{ color: "#9CA3AF", fontSize: 10 }}>
          {new Date(b.startTime).toLocaleDateString("en-IN", {
            weekday: "short",
          })}
        </div>
        <div style={{ color: "#9CA3AF", fontSize: 10 }}>
          {new Date(b.startTime).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
        <div>{fmtTime12(b.startTime)}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {b.batch ? (
          <div style={{ marginBottom: 4 }}>
            <div
              style={{
                fontWeight: 600,
                fontSize: 13,
                marginBottom: 6,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {b.batch.name}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 4,
              }}
            >
              {b.batch.enrolments?.map((e) => (
                <div
                  key={e.id}
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <Avatar name={e.client.name} size={24} radius={6} fontSize={10} />
                  <span style={{ fontSize: 12, color: "#D1D5DB" }}>
                    {e.client.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <Avatar name={b.client?.name || "Unknown"} />

            <div
              style={{
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {b.client?.name || "Unknown Student"}
            </div>
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 8px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              background: badge.bg,
              color: badge.color,
            }}
          >
            {badge.label}
          </span>
          {(b as any).sessionType === "demo" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 8px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                background: "rgba(99,102,241,0.15)",
                color: "#818CF8",
              }}
            >
              🎯 Demo
            </span>
          )}
          {(b as any).sessionType === "practice" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 8px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                background: "rgba(16,185,129,0.15)",
                color: "#34D399",
              }}
            >
              🎧 Practice
            </span>
          )}
          {b.batch && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "3px 8px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                background: `${b.batch.color}22`,
                color: b.batch.color,
              }}
            >
              📚 {b.batch.name}
            </span>
          )}
        </div>
      </div>
      {onClick && (
        <div style={{ color: "#6B7280", fontSize: 18, flexShrink: 0 }}>›</div>
      )}
    </div>
  );
}
