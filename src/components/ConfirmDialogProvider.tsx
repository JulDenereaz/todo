"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ConfirmContext, type ConfirmOptions } from "@/lib/hooks/useConfirm";

export default function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("ConfirmDialog");
  const [pending, setPending] = useState<{ options: ConfirmOptions; resolve: (value: boolean) => void } | null>(
    null
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => setPending({ options, resolve }));
  }, []);

  const close = useCallback(
    (result: boolean) => {
      pending?.resolve(result);
      setPending(null);
    },
    [pending]
  );

  useEffect(() => {
    if (!pending) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pending, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {pending.options.title && (
              <h2 id="confirm-dialog-title" className="mb-1.5 text-sm font-semibold">
                {pending.options.title}
              </h2>
            )}
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{pending.options.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => close(false)}
                className="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {pending.options.cancelLabel ?? t("cancel")}
              </button>
              <button
                onClick={() => close(true)}
                autoFocus
                className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-white ${
                  pending.options.variant === "danger"
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                }`}
              >
                {pending.options.confirmLabel ?? t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
