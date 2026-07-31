"use client";

import { useTranslations, useLocale } from "next-intl";
import { useProfile } from "@/lib/hooks/useProfile";
import { useConfirm } from "@/lib/hooks/useConfirm";
import AvatarUploader from "./AvatarUploader";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { TrashIcon } from "./icons";

export default function ProfileSettings() {
  const t = useTranslations("ProfileSettings");
  const locale = useLocale();
  const { profile, isLoading, deleteAccount } = useProfile();
  const confirm = useConfirm();

  async function handleDeleteAccount() {
    const ok = await confirm({
      title: t("deleteConfirmTitle"),
      message: t("deleteConfirmMessage"),
      confirmLabel: t("deleteConfirmLabel"),
      variant: "danger",
    });
    if (!ok) return;
    await deleteAccount();
    window.location.href = "/api/auth/signout";
  }

  if (isLoading || !profile) {
    return <p className="mt-6 text-sm text-zinc-400">{t("loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="mb-3 text-xs font-semibold uppercase text-zinc-400">{t("account")}</div>
        <AvatarUploader profile={profile} />
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-400">{t("name")}</dt>
            <dd className="truncate font-medium">{profile.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-400">{t("email")}</dt>
            <dd className="truncate font-medium">{profile.email || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500 dark:text-zinc-400">{t("memberSince")}</dt>
            <dd className="font-medium">
              {new Date(profile.createdAt).toLocaleDateString(locale, { year: "numeric", month: "long" })}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-zinc-400">{t("ssoNote")}</p>
      </section>

      <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="mb-3 text-xs font-semibold uppercase text-zinc-400">{t("appearance")}</div>
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1.5 text-xs text-zinc-500 dark:text-zinc-400">{t("theme")}</div>
            <ThemeToggle />
          </div>
          <div>
            <div className="mb-1.5 text-xs text-zinc-500 dark:text-zinc-400">{t("language")}</div>
            <LanguageSwitcher />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- API route, not a Next page; needs a full navigation */}
        <a
          href="/api/auth/signout"
          className="inline-block rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t("signOut")}
        </a>
      </section>

      <section className="rounded-md border border-red-200 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
        <div className="mb-2 text-xs font-semibold uppercase text-red-500 dark:text-red-400">{t("dangerZone")}</div>
        <button
          type="button"
          onClick={handleDeleteAccount}
          className="flex cursor-pointer items-center gap-1.5 rounded-md p-1.5 text-sm font-medium text-red-500 hover:bg-red-100 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
        >
          <TrashIcon className="h-4 w-4" />
          {t("deleteAccount")}
        </button>
      </section>
    </div>
  );
}
