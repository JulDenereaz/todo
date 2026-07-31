"use client";

import { useEffect, useState } from "react";
import { getStoredTheme, setTheme, type ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export default function ThemeToggle() {
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
          key={opt.value}
          onClick={() => handleChange(opt.value)}
          aria-pressed={theme === opt.value}
          className={`flex-1 cursor-pointer rounded px-2 py-1 text-xs font-medium ${
            theme === opt.value
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
