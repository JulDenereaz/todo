"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";

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
  sortable,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  sortable?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { setNodeRef, attributes, listeners, transform, transition } = useSortable({
    id: task.id,
    disabled: !sortable,
  });
  const style = sortable ? { transform: CSS.Transform.toString(transform), transition } : undefined;

  const params = new URLSearchParams(searchParams.toString());
  params.set("task", task.id);
  const detailHref = `${pathname}?${params.toString()}`;

  return (
    <li
      ref={sortable ? setNodeRef : undefined}
      style={style}
      className="group flex items-center gap-2 rounded-md border border-transparent bg-white px-2 py-2 hover:border-zinc-200 dark:bg-zinc-900 dark:hover:border-zinc-800"
    >
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

      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
        className="h-4 w-4 shrink-0 accent-zinc-900 dark:accent-zinc-100"
      />

      {task.priority !== "none" && (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PRIORITY_COLOR[task.priority] }} />
      )}

      <Link href={detailHref} className={`flex-1 truncate text-sm ${task.completed ? "text-zinc-400 line-through" : ""}`}>
        {task.title}
      </Link>

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
        className="shrink-0 rounded p-1 text-zinc-300 opacity-0 hover:text-red-500 group-hover:opacity-100"
        aria-label="Delete task"
      >
        ✕
      </button>
    </li>
  );
}
