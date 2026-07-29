"use client";

import { useState } from "react";
import type { Subtask } from "@/lib/types";

export default function SubtaskList({
  subtasks,
  onAdd,
  onToggle,
  onDelete,
}: {
  subtasks: Subtask[];
  onAdd: (title: string) => Promise<void> | void;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setTitle("");
    await onAdd(trimmed);
  }

  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">Subtasks</div>
      <ul className="mb-2 flex flex-col gap-1">
        {subtasks.map((s) => (
          <li key={s.id} className="group flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={s.completed}
              onChange={() => onToggle(s.id, !s.completed)}
              className="h-3.5 w-3.5 accent-zinc-900 dark:accent-zinc-100"
            />
            <span className={`flex-1 ${s.completed ? "text-zinc-400 line-through" : ""}`}>{s.title}</span>
            <button
              onClick={() => onDelete(s.id)}
              className="text-zinc-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
              aria-label="Delete subtask"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add subtask..."
          className="flex-1 rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-zinc-700"
        />
        <button type="submit" className="rounded-md bg-zinc-100 px-2.5 py-1 text-sm dark:bg-zinc-800">
          Add
        </button>
      </form>
    </div>
  );
}
