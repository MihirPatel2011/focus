/**
 * Framework-agnostic date helpers. Calendar dates are stored as ISO "YYYY-MM-DD"
 * strings in local time; precise timestamps are epoch millis.
 */
import type { IsoDate } from "@/data/types";

/** Today's local date as "YYYY-MM-DD". */
export function todayIso(d: Date = new Date()): IsoDate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse an ISO date string to a local Date at midnight. */
export function parseIso(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Add N days to an ISO date string, returning a new ISO date. */
export function addDaysIso(iso: IsoDate, days: number): IsoDate {
  const [y, m, d] = iso.split("-").map(Number);
  return todayIso(new Date(y, m - 1, d + days));
}

export interface WeekDay {
  iso: IsoDate;
  /** Short weekday, e.g. "Mon". */
  weekday: string;
  /** Day of month, e.g. "10". */
  dayOfMonth: string;
  isToday: boolean;
}

/**
 * The seven days (Monday → Sunday) of the week containing `ref`.
 * Used by the weekly planning view.
 */
export function weekDays(ref: IsoDate = todayIso()): WeekDay[] {
  const refDate = parseIso(ref);
  const mondayOffset = (refDate.getDay() + 6) % 7; // Mon=0 … Sun=6
  const today = todayIso();
  return Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysIso(ref, i - mondayOffset);
    const d = parseIso(iso);
    return {
      iso,
      weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
      dayOfMonth: String(d.getDate()),
      isToday: iso === today,
    };
  });
}

export function isOverdue(due: IsoDate | undefined, ref: IsoDate = todayIso()) {
  return Boolean(due && due < ref);
}

/** Whole days from `ref` until `iso` (negative = in the past, 0 = today). */
export function daysUntil(iso: IsoDate, ref: IsoDate = todayIso()): number {
  const ms = parseIso(iso).getTime() - parseIso(ref).getTime();
  return Math.round(ms / 86_400_000);
}

/** Human countdown label, e.g. "in 3 days", "today", "2 days overdue". */
export function countdownLabel(iso: IsoDate, ref: IsoDate = todayIso()): string {
  const d = daysUntil(iso, ref);
  if (d === 0) return "due today";
  if (d === 1) return "due tomorrow";
  if (d === -1) return "1 day overdue";
  if (d < 0) return `${-d} days overdue`;
  return `in ${d} days`;
}

export function isToday(due: IsoDate | undefined, ref: IsoDate = todayIso()) {
  return due === ref;
}

/** Format seconds as H:MM:SS or M:SS. */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** Human-friendly date label, e.g. "Jun 10". */
export function formatDateLabel(iso: IsoDate): string {
  return parseIso(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
