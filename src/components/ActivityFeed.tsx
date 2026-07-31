"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useActivity } from "@/lib/hooks/useActivity";
import { formatRelativeTime } from "@/lib/format";
import { ChevronIcon } from "./icons";
import type { ActivityEntry } from "@/lib/types";

const DOT_COLOR: Record<ActivityEntry["type"], string> = {
  task_created: "bg-zinc-400",
  task_updated: "bg-blue-500",
  task_deleted: "bg-red-500",
  member_added: "bg-blue-500",
  member_removed: "bg-red-500",
  list_renamed: "bg-zinc-400",
};

const PAGE_SIZE = 10;

export default function ActivityFeed() {
  const t = useTranslations("ActivityFeed");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const { activity, total, isLoading } = useActivity({ page, pageSize: PAGE_SIZE });

  if (isLoading) {
    return <p className="mt-6 text-sm text-zinc-400">{t("loading")}</p>;
  }

  if (total === 0) {
    return <p className="mt-6 text-sm text-zinc-400">{t("noActivity")}</p>;
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, page * PAGE_SIZE);

  return (
    <>
      <ul className="flex flex-col gap-1">
        {activity.map((entry) => (
          <li key={entry.id} className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[entry.type]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{entry.actor?.name || entry.actor?.email || t("someone")}</span>{" "}
                {/* entry.summary is persisted in whatever language was active when it was written — see i18n plan's activity-log tradeoff */}
                <span className="text-zinc-600 dark:text-zinc-400">{entry.summary}</span>
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {entry.listName} · {formatRelativeTime(entry.createdAt, locale, t("justNow"))}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span className="text-xs">{t("range", { start: rangeStart, end: rangeEnd, total })}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
            aria-label={t("previousPage")}
            className="rounded-md p-1.5 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-zinc-800"
          >
            <ChevronIcon className="h-4 w-4 rotate-180" />
          </button>
          <span className="text-xs tabular-nums">{t("pageOf", { page, pageCount })}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pageCount}
            aria-label={t("nextPage")}
            className="rounded-md p-1.5 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-zinc-800"
          >
            <ChevronIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
