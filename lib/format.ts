// Pure formatting + display helpers and shared constants (no React/state).

export const ROOMS = [
  { value: "dj_classroom", label: "🎧 DJ Classroom" },
  { value: "control_room", label: "🎙️ Control Room" },
];
export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DURATIONS = [1, 2, 3, 4, 5, 6];
export const BATCH_COLORS = [
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#84CC16",
];

export function fmtDate(d: Date) {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().split("T")[0];
}

export function fmtTime12(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function getDur(start: string, end: string) {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 3600000,
  );
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

const AV_COLORS = ["#6C3CE1", "#06D6A0", "#F59E0B", "#EF4444", "#3B82F6"];
export function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}

export function roomBadge(room: string) {
  if (room === "dj_classroom")
    return {
      label: "🎧 DJ Classroom",
      bg: "rgba(108,60,225,0.15)",
      color: "#A78BFA",
    };
  return {
    label: "🎙️ Control Room",
    bg: "rgba(6,214,160,0.15)",
    color: "#34D399",
  };
}

export function bookingColor(b: {
  batchId?: number;
  batch?: { color: string };
  room: string;
}) {
  if (b.batchId && b.batch) return b.batch.color;
  return b.room === "dj_classroom" ? "#8B5CF6" : "#06D6A0";
}

export function fmtDateLabel(dateStr: string) {
  const today = fmtDate(new Date());
  if (dateStr === today) return "Today";
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  if (dateStr === fmtDate(tom)) return "Tomorrow";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
