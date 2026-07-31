"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Task } from "@/lib/types";

export default function QuickAddTask({
  listId,
  onCreate,
}: {
  listId: string;
  onCreate: (input: { listId: string; title: string }) => Promise<Task>;
}) {
  const t = useTranslations("QuickAddTask");
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setTitle("");
    try {
      await onCreate({ listId, title: trimmed });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("placeholder")}
        className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {t("add")}
      </button>
    </form>
  );
}
