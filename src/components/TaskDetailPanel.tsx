"use client";

import { Suspense, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTaskDetail } from "@/lib/hooks/useTaskDetail";
import { useTags } from "@/lib/hooks/useTags";
import SubtaskList from "./SubtaskList";
import type { Priority } from "@/lib/types";

function PanelInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("task");

  const { task, update, addSubtask, toggleSubtask, deleteSubtask, addTag, removeTag } = useTaskDetail(taskId);
  const { tags, createTag } = useTags();
  const [notesDraft, setNotesDraft] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");

  if (!taskId) return null;

  function close() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("task");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    const name = newTagName.trim();
    if (!name) return;
    setNewTagName("");
    const tag = await createTag(name);
    await addTag(tag.id);
  }

  if (!task) {
    return (
      <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={close}>
        <div className="h-full w-full max-w-md bg-white p-6 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-zinc-400">Loading…</p>
        </div>
      </div>
    );
  }

  const availableTags = tags.filter((t) => !task.tags.some((tt) => tt.id === t.id));

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={close}>
      <div
        className="flex h-full w-full max-w-md flex-col gap-4 overflow-y-auto bg-white p-6 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <input
            value={task.title}
            onChange={(e) => update({ title: e.target.value })}
            className="flex-1 bg-transparent text-lg font-semibold outline-none"
          />
          <button onClick={close} className="rounded p-1 text-zinc-400 hover:text-zinc-700" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-1.5">
            <span className="text-zinc-400">Priority</span>
            <select
              value={task.priority}
              onChange={(e) => update({ priority: e.target.value as Priority })}
              className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5">
            <span className="text-zinc-400">Due</span>
            <input
              type="date"
              value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
              onChange={(e) => update({ dueDate: e.target.value || null })}
              className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 dark:border-zinc-700"
            />
          </label>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">Notes</div>
          <textarea
            value={notesDraft ?? task.notes ?? ""}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={() => {
              if (notesDraft !== null) update({ notes: notesDraft || null });
              setNotesDraft(null);
            }}
            rows={4}
            placeholder="Add notes..."
            className="w-full rounded-md border border-zinc-200 bg-transparent p-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
          />
        </div>

        <div>
          <div className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => removeTag(tag.id)}
                className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              >
                {tag.name} ✕
              </button>
            ))}
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => addTag(tag.id)}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              >
                + {tag.name}
              </button>
            ))}
          </div>
          <form onSubmit={handleCreateTag} className="mt-2 flex gap-1.5">
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag..."
              className="flex-1 rounded-md border border-zinc-200 bg-transparent px-2 py-1 text-xs outline-none dark:border-zinc-700"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Add
            </button>
          </form>
        </div>

        <SubtaskList
          subtasks={task.subtasks}
          onAdd={addSubtask}
          onToggle={toggleSubtask}
          onDelete={deleteSubtask}
        />
      </div>
    </div>
  );
}

export default function TaskDetailPanel() {
  return (
    <Suspense fallback={null}>
      <PanelInner />
    </Suspense>
  );
}
