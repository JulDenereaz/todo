"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

function SignInInner() {
  const t = useTranslations("SignInPage");
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  useEffect(() => {
    signIn("authelia", { callbackUrl });
  }, [callbackUrl]);

  return (
    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
      {t("redirecting")}
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
