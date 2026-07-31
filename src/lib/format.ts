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

/** "3 hours ago", "2 days ago", falling back to justNow under a minute. Takes locale/justNow as
    params (not module-level state) since this runs outside the component tree — the caller
    supplies both from useLocale()/useTranslations() so the wording follows the active UI language. */
export function formatRelativeTime(isoDate: string, locale?: string, justNow = "just now"): string {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const seconds = Math.round((new Date(isoDate).getTime() - Date.now()) / 1000);
  for (const [unit, unitSeconds] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return formatter.format(Math.round(seconds / unitSeconds), unit);
    }
  }
  return justNow;
}
