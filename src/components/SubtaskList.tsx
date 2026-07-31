"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Subtask } from "@/lib/types";
import { TrashIcon } from "./icons";
import Checkbox from "./Checkbox";

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
  const t = useTranslations("SubtaskList");
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
      <div className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">{t("subtasks")}</div>
      <ul className="mb-2 flex flex-col gap-1">
        {subtasks.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              size="sm"
              checked={s.completed}
              onChange={() => onToggle(s.id, !s.completed)}
              aria-label={t("markComplete")}
            />
            <span className={`flex-1 ${s.completed ? "text-zinc-400 line-through" : ""}`}>{s.title}</span>
            <button
              onClick={() => onDelete(s.id)}
              className="shrink-0 cursor-pointer rounded p-1 text-red-500 hover:bg-red-100 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
              aria-label={t("deleteSubtask")}
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="flex gap-1.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("addPlaceholder")}
          className="flex-1 rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-sm outline-none dark:border-zinc-700"
        />
        <button type="submit" className="rounded-md bg-zinc-100 px-2.5 py-1 text-sm dark:bg-zinc-800">
          {t("add")}
        </button>
      </form>
    </div>
  );
}
