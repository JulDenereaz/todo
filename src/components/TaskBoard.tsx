"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLists } from "@/lib/hooks/useLists";
import { useTasks } from "@/lib/hooks/useTasks";
import type { Task } from "@/lib/types";
import { formatUserLabel } from "@/lib/format";
import QuickAddTask from "./QuickAddTask";
import TaskList from "./TaskList";
import CompletedTasksSection from "./CompletedTasksSection";

type SortOption = "manual" | "dueDate" | "priority" | "alpha";

const PRIORITY_RANK: Record<Task["priority"], number> = { high: 3, medium: 2, low: 1, none: 0 };

function sortByOption(list: Task[], sortBy: SortOption) {
  const arr = [...list];
  switch (sortBy) {
    case "dueDate":
      return arr.sort((a, b) => (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31"));
    case "priority":
      return arr.sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
    case "alpha":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return arr.sort((a, b) => a.position - b.position);
  }
}

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
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("manual");
  const [assigneeFilter, setAssigneeFilter] = useState("any");

  const activeList = listId ? lists.find((l) => l.id === listId) : undefined;
  const title = listId ? (activeList?.name ?? "List") : "All tasks";
  const defaultListId = listId ?? lists[0]?.id;

  const query = search.trim().toLowerCase();
  const hasActiveFilter = !!query || assigneeFilter !== "any";

  const assigneeOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const t of tasks) {
      if (t.assignee) byId.set(t.assignee.id, formatUserLabel(t.assignee));
    }
    return [...byId.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [tasks]);

  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (query && !t.title.toLowerCase().includes(query) && !(t.notes?.toLowerCase().includes(query) ?? false)) {
          return false;
        }
        if (assigneeFilter === "unassigned") return !t.assigneeId;
        if (assigneeFilter !== "any") return t.assigneeId === assigneeFilter;
        return true;
      }),
    [tasks, query, assigneeFilter]
  );
  const activeTasks = useMemo(
    () => sortByOption(filteredTasks.filter((t) => !t.completed), sortBy),
    [filteredTasks, sortBy]
  );
  const completedTasks = useMemo(
    () =>
      filteredTasks
        .filter((t) => t.completed)
        .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime()),
    [filteredTasks]
  );

  function toggleExpand(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (expandedTaskId === id) params.delete("task");
    else params.set("task", id);
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        {activeList?.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: activeList.color }} />}
        {title}
      </h1>

      {defaultListId && <QuickAddTask listId={defaultListId} onCreate={createTask} />}

      <div className="mb-4 flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="flex-1 rounded-md border border-zinc-200 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="shrink-0 rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
          aria-label="Sort tasks"
        >
          <option value="manual">Manual order</option>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
          <option value="alpha">Alphabetical</option>
        </select>
        {assigneeOptions.length > 0 && (
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="shrink-0 rounded-md border border-zinc-200 bg-transparent px-2 py-1.5 text-sm dark:border-zinc-700"
            aria-label="Filter by assignee"
          >
            <option value="any">Anyone</option>
            <option value="unassigned">Unassigned</option>
            {assigneeOptions.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        )}
      </div>

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
              onReorder={listId && sortBy === "manual" && !hasActiveFilter ? reorderTasks : undefined}
              expandedTaskId={expandedTaskId}
              onToggleExpand={toggleExpand}
              onToggleSubtask={toggleSubtask}
            />
          ) : (
            <p className="mt-6 text-sm text-zinc-400">
              {hasActiveFilter ? "No tasks match your filters." : "No active tasks."}
            </p>
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
