"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/request";
import { apiRequest } from "@/lib/fetcher";

/** Wraps next-intl's useLocale() with a setter — switching locale means setting the
    cookie server-side (src/i18n/request.ts reads it) then refreshing to re-render
    server components with the new messages. */
export function useLocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();

  async function setLocale(next: Locale) {
    await apiRequest("/api/locale", "POST", { locale: next });
    router.refresh();
  }

  return { locale, setLocale };
}
