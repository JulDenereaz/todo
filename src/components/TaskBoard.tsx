"use client";

import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLists } from "@/lib/hooks/useLists";
import { useTasks } from "@/lib/hooks/useTasks";
import QuickAddTask from "./QuickAddTask";
import TaskList from "./TaskList";

export default function TaskBoard({ listId, tagId }: { listId?: string; tagId?: string }) {
  const { lists } = useLists();
  const { tasks, isLoading, createTask, toggleComplete, deleteTask, reorderTasks, toggleSubtask } = useTasks({
    listId,
    tagId,
  });
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const expandedTaskId = searchParams.get("task");

  const title = listId ? (lists.find((l) => l.id === listId)?.name ?? "List") : "All tasks";
  const defaultListId = listId ?? lists[0]?.id;

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed) || a.position - b.position),
    [tasks]
  );

  function toggleExpand(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (expandedTaskId === id) params.delete("task");
    else params.set("task", id);
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-xl font-semibold">{title}</h1>

      {defaultListId && <QuickAddTask listId={defaultListId} onCreate={createTask} />}

      {isLoading ? (
        <p className="mt-6 text-sm text-zinc-400">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">No tasks yet.</p>
      ) : (
        <TaskList
          tasks={sorted}
          onToggle={toggleComplete}
          onDelete={deleteTask}
          onReorder={listId ? reorderTasks : undefined}
          expandedTaskId={expandedTaskId}
          onToggleExpand={toggleExpand}
          onToggleSubtask={toggleSubtask}
        />
      )}
    </div>
  );
}
