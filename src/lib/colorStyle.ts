import type { CSSProperties } from "react";

/** Palette offered in the tag/list color pickers. */
export const COLOR_SWATCHES = [
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
 * Tint style for a colored chip (tag pill, list badge). `active` renders a solid
 * fill (e.g. selected filter state), otherwise a light tint over the color. Falls
 * back to plain zinc styling (via CSS classes at the call site) when no color is set.
 */
export function chipStyle(color: string | null | undefined, active = false): CSSProperties | undefined {
  if (!color) return undefined;
  return active ? { backgroundColor: color, color: "#fff" } : { backgroundColor: `${color}26`, color };
}
