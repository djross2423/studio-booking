"use client";

import { useState } from "react";
import type { Booking } from "@/lib/types";
import { fmtDate } from "@/lib/format";
import { S } from "@/lib/styles";

export function DatePickerInput({
  value,
  onChange,
  room,
  allBookings,
}: {
  value: string;
  onChange: (d: string) => void;
  room: string;
  allBookings: Booking[];
}) {
  const [open, setOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() =>
    value ? new Date(value + "T00:00:00").getMonth() : new Date().getMonth(),
  );
  const [pickerYear, setPickerYear] = useState(() =>
    value
      ? new Date(value + "T00:00:00").getFullYear()
      : new Date().getFullYear(),
  );
  const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const firstDay = new Date(pickerYear, pickerMonth, 1).getDay();
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const prevDays = new Date(pickerYear, pickerMonth, 0).getDate();
  const cells: { day: number; dateStr: string; cur: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, dateStr: "", cur: false });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr, cur: true });
  }
  const rem = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= rem; i++)
    cells.push({ day: i, dateStr: "", cur: false });

  // Find booked slots per date for this room
  const TIME_SLOTS = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
  const roomBookings = allBookings.filter(
    (b) => b.room === room && b.status !== "cancelled",
  );

  // For each date, check how many of the 6 standard slots are taken
  const getBookedSlots = (dateStr: string) => {
    return TIME_SLOTS.filter((slot) => {
      const [h, m] = slot.split(":").map(Number);
      const slotStart = new Date(dateStr + "T00:00:00");
      slotStart.setHours(h, m, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(slotEnd.getHours() + 2);
      return roomBookings.some((b) => {
        const bs = new Date(b.startTime),
          be = new Date(b.endTime);
        return bs < slotEnd && be > slotStart;
      });
    }).length;
  };
  const todayStr = fmtDate(new Date());

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Select date";

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          ...S.input,
          textAlign: "left",
          cursor: "pointer",
          color: value ? "#F5F5F7" : "#6B7280",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{displayValue}</span>
        <span style={{ color: "#6B7280" }}>📅</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#1A1A24",
            border: "1px solid #2A2A3D",
            borderRadius: 16,
            padding: 16,
            zIndex: 300,
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={() => {
                let m = pickerMonth - 1,
                  y = pickerYear;
                if (m < 0) {
                  m = 11;
                  y--;
                }
                setPickerMonth(m);
                setPickerYear(y);
              }}
              style={{
                background: "#242436",
                border: "none",
                borderRadius: 8,
                padding: "6px 10px",
                color: "white",
                cursor: "pointer",
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {monthNames[pickerMonth]} {pickerYear}
            </span>
            <button
              type="button"
              onClick={() => {
                let m = pickerMonth + 1,
                  y = pickerYear;
                if (m > 11) {
                  m = 0;
                  y++;
                }
                setPickerMonth(m);
                setPickerYear(y);
              }}
              style={{
                background: "#242436",
                border: "none",
                borderRadius: 8,
                padding: "6px 10px",
                color: "white",
                cursor: "pointer",
              }}
            >
              ›
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 4,
            }}
          >
            {DAYS_SHORT.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6B7280",
                  padding: "4px 0",
                }}
              >
                {d}
              </div>
            ))}
            {cells.map((cell, i) => {
              const bookedSlots = cell.cur ? getBookedSlots(cell.dateStr) : 0;
              const isFullyBooked = cell.cur && bookedSlots >= 6;
              const isPartiallyBooked =
                cell.cur && bookedSlots > 0 && bookedSlots < 6;
              const isPast = cell.cur && cell.dateStr < todayStr;
              const isSelected = cell.dateStr === value;
              const isToday = cell.dateStr === todayStr;
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    if (!cell.cur || isFullyBooked) return;
                    onChange(cell.dateStr);
                    setOpen(false);
                  }}
                  style={{
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 500,
                    border: "none",
                    cursor:
                      !cell.cur || isFullyBooked ? "default" : "pointer",
                    background: isSelected
                      ? "#6C3CE1"
                      : isFullyBooked
                        ? "rgba(239,68,68,0.1)"
                        : "transparent",
                    color: !cell.cur
                      ? "#2A2A3D"
                      : isSelected
                        ? "white"
                        : isFullyBooked
                          ? "#4B3030"
                          : isPast
                            ? "#4B5563"
                            : isToday
                              ? "#8B5CF6"
                              : "#F5F5F7",
                    position: "relative",
                    textDecoration:
                      isFullyBooked && !isSelected ? "line-through" : "none",
                    opacity: !cell.cur ? 0 : 1,
                  }}
                >
                  {cell.day}
                  {isPartiallyBooked && !isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 2,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      {Array.from({ length: bookedSlots }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: 3,
                            height: 3,
                            background: "#F59E0B",
                            borderRadius: "50%",
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {isFullyBooked && !isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 2,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 4,
                        height: 4,
                        background: "#EF4444",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 11,
              color: "#6B7280",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: "#F59E0B",
                  borderRadius: "50%",
                }}
              />
              Partially booked
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: "rgba(239,68,68,0.3)",
                  borderRadius: 2,
                }}
              />
              Fully booked
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  background: "#6C3CE1",
                  borderRadius: 2,
                }}
              />
              Selected
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
