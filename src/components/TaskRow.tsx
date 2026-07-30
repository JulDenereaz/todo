"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";
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

  return (
    <li
      ref={sortable ? setNodeRef : undefined}
      style={style}
      className="flex flex-col rounded-md border border-transparent bg-white dark:bg-zinc-900 dark:hover:border-zinc-800 hover:border-zinc-200"
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
          <ChevronIcon open={expanded} className="h-4 w-4 shrink-0 text-zinc-400" />
          <span className="truncate">{task.title}</span>
        </button>

        {task.subtasks.length > 0 && (
          <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {doneCount}/{task.subtasks.length}
          </span>
        )}

        {task.dueDate && (
          <span className="shrink-0 text-xs text-zinc-400">
            {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}

        {task.tags.slice(0, 2).map((tag) => (
          <span
            key={tag.id}
            className="hidden shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 sm:inline"
          >
            {tag.name}
          </span>
        ))}

        <button
          onClick={() => onDelete(task.id)}
          className="shrink-0 rounded p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
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

      {expanded && <TaskDetailAccordion taskId={task.id} />}
    </li>
  );
}
