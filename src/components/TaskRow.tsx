"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import type { Task } from "@/lib/types";
import { chipStyle } from "@/lib/colorStyle";
import { isOverdue } from "@/lib/format";
import { useConfirm } from "@/lib/hooks/useConfirm";
import TaskDetailAccordion from "./TaskDetailAccordion";
import { TrashIcon, ChevronIcon } from "./icons";
import Checkbox from "./Checkbox";

const PRIORITY_COLOR: Record<Task["priority"], string> = {
  none: "transparent",
  low: "#60a5fa",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default function TaskRow({
  task,
  onToggle,
  onDelete,
  expanded,
  onToggleExpand,
  onToggleSubtask,
  sortable,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleSubtask: (taskId: string, subtaskId: string, completed: boolean) => void;
  sortable?: boolean;
}) {
  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({
    id: task.id,
    disabled: !sortable,
  });
  const style = sortable ? { transform: CSS.Transform.toString(transform), transition } : undefined;
  const doneCount = task.subtasks.filter((s) => s.completed).length;
  const confirm = useConfirm();

  async function handleDelete() {
    const ok = await confirm({
      title: "Delete task",
      message: `Delete "${task.title}"?`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (ok) onDelete(task.id);
  }

  // Keep the accordion mounted once opened so collapsing can animate closed instead of vanishing instantly.
  const [everExpanded, setEverExpanded] = useState(expanded);
  useEffect(() => {
    if (expanded) setEverExpanded(true);
  }, [expanded]);

  return (
    <li
      ref={sortable ? setNodeRef : undefined}
      style={style}
      className={`flex flex-col rounded-md border bg-white shadow-sm transition-colors dark:bg-zinc-900 dark:shadow-[0_1px_3px_0_rgba(255,255,255,0.06)] ${
        expanded
          ? "border-blue-400 ring-1 ring-blue-400/30 dark:border-blue-500 dark:ring-blue-500/30"
          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
      }`}
    >
      <div className="group flex items-center gap-3 px-2 py-3">
        {sortable && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none px-1 text-zinc-300 dark:text-zinc-600"
            aria-label="Drag to reorder"
          >
            ⠿
          </button>
        )}

        <Checkbox checked={task.completed} onChange={() => onToggle(task)} aria-label="Mark task complete" />

        {task.priority !== "none" && (
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PRIORITY_COLOR[task.priority] }} />
        )}

        <button
          onClick={onToggleExpand}
          className={`flex flex-1 items-center gap-1.5 truncate text-left text-lg font-semibold ${task.completed ? "text-zinc-400 line-through" : ""}`}
          aria-expanded={expanded}
        >
          <ChevronIcon open={expanded} className="h-5 w-5 shrink-0 stroke-2 text-zinc-500 dark:text-zinc-300" />
          <span className="truncate">{task.title}</span>
        </button>

        {task.subtasks.length > 0 && (
          <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {doneCount}/{task.subtasks.length}
          </span>
        )}

        {task.dueDate && (
          <span
            className={`shrink-0 text-xs ${
              isOverdue(task.dueDate, task.completed) ? "font-medium text-red-500 dark:text-red-400" : "text-zinc-400"
            }`}
          >
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}

        <button
          onClick={handleDelete}
          className="shrink-0 cursor-pointer rounded p-1.5 text-red-500 hover:bg-red-100 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
          aria-label="Delete task"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {task.subtasks.length > 0 && (
        <ul className="flex flex-col gap-1 px-2 pb-3 pl-12">
          {task.subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <Checkbox
                size="sm"
                checked={s.completed}
                onChange={() => onToggleSubtask(task.id, s.id, !s.completed)}
                aria-label="Mark subtask complete"
              />
              <span className={`truncate text-sm ${s.completed ? "text-zinc-400 line-through" : "text-zinc-600 dark:text-zinc-300"}`}>
                {s.title}
              </span>
            </li>
          ))}
        </ul>
      )}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2 pb-3 pl-12">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                !tag.color ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" : ""
              }`}
              style={chipStyle(tag.color)}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">{everExpanded && <TaskDetailAccordion taskId={task.id} />}</div>
      </div>
    </li>
  );
}
