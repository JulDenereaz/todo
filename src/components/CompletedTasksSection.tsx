"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import TaskList from "./TaskList";
import { ChevronIcon } from "./icons";

export default function CompletedTasksSection({
  tasks,
  onToggle,
  onDelete,
  expandedTaskId,
  onToggleExpand,
  onToggleSubtask,
}: {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  expandedTaskId: string | null;
  onToggleExpand: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <ChevronIcon open={open} className="h-4 w-4 shrink-0" />
        Completed tasks
        <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {tasks.length}
        </span>
      </button>

      {open && (
        <TaskList
          tasks={tasks}
          onToggle={onToggle}
          onDelete={onDelete}
          expandedTaskId={expandedTaskId}
          onToggleExpand={onToggleExpand}
          onToggleSubtask={onToggleSubtask}
        />
      )}
    </div>
  );
}
