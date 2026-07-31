"use client";

import { useState } from "react";
import type { TagRef } from "@/lib/types";
import { TAG_COLORS } from "@/lib/tagStyle";
import { TrashIcon } from "./icons";

export default function TagSettings({
  tag,
  onRename,
  onColorChange,
  onDelete,
}: {
  tag: TagRef;
  onRename: (name: string) => void;
  onColorChange: (color: string | null) => void;
  onDelete: () => void;
}) {
  const [nameDraft, setNameDraft] = useState(tag.name);

  function handleDelete() {
    if (window.confirm(`Delete tag "${tag.name}"? It will be removed from all tasks.`)) {
      onDelete();
    }
  }

  return (
    <div
      className="mt-1 flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40"
      onClick={(e) => e.stopPropagation()}
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase text-zinc-400">Name</span>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => {
            const trimmed = nameDraft.trim();
            if (trimmed && trimmed !== tag.name) onRename(trimmed);
            else setNameDraft(tag.name);
          }}
          className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">Color</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onColorChange(null)}
            aria-label="No color"
            aria-pressed={!tag.color}
            className={`h-5 w-5 rounded-full border-2 bg-zinc-200 dark:bg-zinc-700 ${
              !tag.color ? "border-zinc-900 dark:border-zinc-100" : "border-transparent"
            }`}
          />
          {TAG_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              aria-label={`Set color ${color}`}
              aria-pressed={tag.color === color}
              className={`h-5 w-5 rounded-full border-2 ${
                tag.color === color ? "border-zinc-900 dark:border-zinc-100" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleDelete}
        className="flex cursor-pointer items-center gap-1.5 self-start rounded-md p-1.5 text-xs font-medium text-red-500 hover:bg-red-100 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        Delete tag
      </button>
    </div>
  );
}
