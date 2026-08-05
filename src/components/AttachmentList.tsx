"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Attachment } from "@/lib/types";
import { TrashIcon } from "./icons";

export default function AttachmentList({
  attachments,
  onAddFile,
  onRemove,
  error,
}: {
  attachments: Attachment[];
  onAddFile: (file: File) => void;
  onRemove: (id: string) => void;
  error: string | null;
}) {
  const t = useTranslations("AttachmentList");
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Attachment | null>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onAddFile(file);
  }

  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase text-zinc-400">{t("attachments")}</div>

      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700"
            >
              <button
                type="button"
                onClick={() => setPreview(a)}
                className="block h-full w-full cursor-zoom-in"
                aria-label={t("viewImage")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable asset */}
                <img src={a.dataUrl} alt={a.filename ?? ""} className="h-full w-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                aria-label={t("removeAttachment")}
                className="absolute right-0.5 top-0.5 rounded bg-black/60 p-0.5 text-white opacity-0 group-hover:opacity-100"
              >
                <TrashIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs dark:bg-zinc-800"
        >
          {t("addImage")}
        </button>
        <span className="text-xs text-zinc-400">{t("pasteHint")}</span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable asset */}
          <img src={preview.dataUrl} alt={preview.filename ?? ""} className="max-h-full max-w-full rounded-md" />
        </div>
      )}
    </div>
  );
}
