"use client";

import { createContext, useContext } from "react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" renders the confirm button in red, for destructive actions like delete. */
  variant?: "default" | "danger";
}

export const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

/** Resolves to true/false once the user picks confirm/cancel (or dismisses) the dialog. */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used within <ConfirmDialogProvider>");
  return confirm;
}
