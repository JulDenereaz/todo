"use client";

import { useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLists } from "@/lib/hooks/useLists";
import { useTasks } from "@/lib/hooks/useTasks";
import QuickAddTask from "./QuickAddTask";
import TaskList from "./TaskList";
import CompletedTasksSection from "./CompletedTasksSection";

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

  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.completed).sort((a, b) => a.position - b.position),
    [tasks]
  );
  const completedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.completed)
        .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime()),
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
      ) : tasks.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-400">No tasks yet.</p>
      ) : (
        <>
          {activeTasks.length > 0 ? (
            <TaskList
              tasks={activeTasks}
              onToggle={toggleComplete}
              onDelete={deleteTask}
              onReorder={listId ? reorderTasks : undefined}
              expandedTaskId={expandedTaskId}
              onToggleExpand={toggleExpand}
              onToggleSubtask={toggleSubtask}
            />
          ) : (
            <p className="mt-6 text-sm text-zinc-400">No active tasks.</p>
          )}

          {completedTasks.length > 0 && (
            <CompletedTasksSection
              tasks={completedTasks}
              onToggle={toggleComplete}
              onDelete={deleteTask}
              expandedTaskId={expandedTaskId}
              onToggleExpand={toggleExpand}
              onToggleSubtask={toggleSubtask}
            />
          )}
        </>
      )}
    </div>
  );
}
