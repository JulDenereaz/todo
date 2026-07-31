import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withLogging } from "@/lib/api-logging";
import { LOCALE_COOKIE, resolveLocale } from "@/i18n/request";

const setLocaleSchema = z.object({ locale: z.string() });

// Not user-scoped (no requireUserId()) — locale is a display preference, not sensitive data.
export const POST = withLogging("locale", async (req: NextRequest) => {
  const parsed = setLocaleSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid locale" }, { status: 400 });

  const locale = resolveLocale(parsed.data.locale);
  const res = NextResponse.json({ locale });
  res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
});
