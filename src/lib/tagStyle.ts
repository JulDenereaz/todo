import type { CSSProperties } from "react";

/** Palette offered in the tag color picker. */
export const TAG_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

/**
 * Tint style for a tag chip. `active` renders a solid fill (selected filter state),
 * otherwise a light tint over the tag's color. Falls back to plain zinc styling
 * (via CSS classes at the call site) when the tag has no color.
 */
export function tagChipStyle(color: string | null | undefined, active = false): CSSProperties | undefined {
  if (!color) return undefined;
  return active ? { backgroundColor: color, color: "#fff" } : { backgroundColor: `${color}26`, color };
}
