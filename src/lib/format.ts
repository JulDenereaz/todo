import type { UserRef } from "@/lib/types";

/** Combines name + email when both are known; falls back gracefully otherwise. */
export function formatUserLabel(user: UserRef): string {
  if (user.name && user.email) return `${user.name} (${user.email})`;
  if (user.name) return user.name;
  if (user.email) return user.email;
  return "Unknown user";
}

/** A due date is overdue once its calendar day has passed and the task isn't done yet. */
export function isOverdue(dueDate: string | null, completed: boolean): boolean {
  if (!dueDate || completed) return false;
  return dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

/** "3 hours ago", "2 days ago", falling back to "just now" under a minute. */
export function formatRelativeTime(isoDate: string): string {
  const seconds = Math.round((new Date(isoDate).getTime() - Date.now()) / 1000);
  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relativeTimeFormatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return "just now";
}
