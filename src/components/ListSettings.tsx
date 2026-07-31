"use client";

import { useState } from "react";
import type { List } from "@/lib/types";
import { useUsers } from "@/lib/hooks/useUsers";
import { formatUserLabel } from "@/lib/format";
import { COLOR_SWATCHES } from "@/lib/colorStyle";
import { TrashIcon } from "./icons";

export default function ListSettings({
  list,
  onRename,
  onColorChange,
  onDelete,
  onAddMember,
  onRemoveMember,
}: {
  list: List;
  onRename: (name: string) => void;
  onColorChange: (color: string | null) => void;
  onDelete: () => void;
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => void;
}) {
  const [nameDraft, setNameDraft] = useState(list.name);
  const { users } = useUsers();
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const availableUsers = users.filter((u) => !list.members.some((m) => m.id === u.id));

  async function handleAddMember(userId: string) {
    setAddingId(userId);
    setError(null);
    try {
      await onAddMember(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setAddingId(null);
    }
  }

  function handleDelete() {
    if (window.confirm(`Delete "${list.name}"? This removes all its tasks for every member.`)) {
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
            if (trimmed && trimmed !== list.name) onRename(trimmed);
            else setNameDraft(list.name);
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
            aria-pressed={!list.color}
            className={`h-5 w-5 rounded-full border-2 bg-zinc-200 dark:bg-zinc-700 ${
              !list.color ? "border-zinc-900 dark:border-zinc-100" : "border-transparent"
            }`}
          />
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              aria-label={`Set color ${color}`}
              aria-pressed={list.color === color}
              className={`h-5 w-5 rounded-full border-2 ${
                list.color === color ? "border-zinc-900 dark:border-zinc-100" : "border-transparent"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">Members</div>
        <ul className="flex flex-col gap-1">
          {list.members.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-zinc-600 dark:text-zinc-300">{formatUserLabel(member)}</span>
              {member.id === list.userId ? (
                <span className="shrink-0 text-xs text-zinc-400">Owner</span>
              ) : (
                <button
                  onClick={() => onRemoveMember(member.id)}
                  className="shrink-0 cursor-pointer rounded p-1 text-red-500 hover:bg-red-100 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
                  aria-label={`Remove ${formatUserLabel(member)}`}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>

        {availableUsers.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {availableUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => handleAddMember(u.id)}
                disabled={addingId === u.id}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-400"
              >
                + {formatUserLabel(u)}
              </button>
            ))}
          </div>
        )}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>

      <button
        onClick={handleDelete}
        className="flex cursor-pointer items-center gap-1.5 self-start rounded-md p-1.5 text-xs font-medium text-red-500 hover:bg-red-100 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        Delete list
      </button>
    </div>
  );
}
