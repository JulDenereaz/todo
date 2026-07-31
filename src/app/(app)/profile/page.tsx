"use client";

import { useTranslations } from "next-intl";
import ProfileSettings from "@/components/ProfileSettings";

export default function ProfilePage() {
  const t = useTranslations("ProfilePage");
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-4 text-xl font-semibold">{t("title")}</h1>
      <ProfileSettings />
    </div>
  );
}
