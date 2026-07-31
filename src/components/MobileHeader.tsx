"use client";

import { useTranslations } from "next-intl";

export default function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const t = useTranslations("MobileHeader");

  return (
    <header className="flex items-center gap-3 border-b border-zinc-200 p-3 dark:border-zinc-800 sm:hidden">
      <button
        onClick={onMenuClick}
        aria-label={t("openMenu")}
        className="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
        </svg>
      </button>
      <span className="text-sm font-semibold">Todo</span>
    </header>
  );
}
