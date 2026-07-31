"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getStoredTheme, setTheme, type ThemePreference } from "@/lib/theme";

const OPTIONS: ThemePreference[] = ["light", "dark", "system"];

export default function ThemeToggle() {
  const t = useTranslations("ThemeToggle");
  const [theme, setThemeState] = useState<ThemePreference>("system");

  // Reads the actual stored preference after mount, since it's only known client-side.
  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  function handleChange(value: ThemePreference) {
    setThemeState(value);
    setTheme(value);
  }

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-700">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => handleChange(opt)}
          aria-pressed={theme === opt}
          className={`flex-1 cursor-pointer rounded px-2 py-1 text-xs font-medium ${
            theme === opt
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {t(opt)}
        </button>
      ))}
    </div>
  );
}
