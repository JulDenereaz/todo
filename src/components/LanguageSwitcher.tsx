"use client";

import { useLocaleSwitcher } from "@/lib/hooks/useLocaleSwitcher";
import type { Locale } from "@/i18n/request";

// Each language's own name for itself, not translated — a French speaker should
// still see "Français" as an option even while the UI is showing in English.
const OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleSwitcher();

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-700">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setLocale(opt.value)}
          aria-pressed={locale === opt.value}
          className={`flex-1 cursor-pointer rounded px-2 py-1 text-xs font-medium ${
            locale === opt.value
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
