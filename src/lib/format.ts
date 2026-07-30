import type { UserRef } from "@/lib/types";

/** Combines name + email when both are known; falls back gracefully otherwise. */
export function formatUserLabel(user: UserRef): string {
  if (user.name && user.email) return `${user.name} (${user.email})`;
  if (user.name) return user.name;
  if (user.email) return user.email;
  return "Unknown user";
}
