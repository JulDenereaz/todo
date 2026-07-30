"use client";

import { useActivity } from "@/lib/hooks/useActivity";
import { formatRelativeTime } from "@/lib/format";
import type { ActivityEntry } from "@/lib/types";

const DOT_COLOR: Record<ActivityEntry["type"], string> = {
  task_created: "bg-zinc-400",
  task_updated: "bg-blue-500",
  task_deleted: "bg-red-500",
  member_added: "bg-blue-500",
  member_removed: "bg-red-500",
  list_renamed: "bg-zinc-400",
};

export default function ActivityFeed() {
  const { activity, isLoading } = useActivity();

  if (isLoading) {
    return <p className="mt-6 text-sm text-zinc-400">Loading…</p>;
  }

  if (activity.length === 0) {
    return <p className="mt-6 text-sm text-zinc-400">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-1">
      {activity.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[entry.type]}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-medium">{entry.actor?.name || entry.actor?.email || "Someone"}</span>{" "}
              <span className="text-zinc-600 dark:text-zinc-400">{entry.summary}</span>
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              {entry.listName} · {formatRelativeTime(entry.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
