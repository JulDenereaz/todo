"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useProfile } from "@/lib/hooks/useProfile";
import Avatar from "./Avatar";

const MAX_DIMENSION = 128;

/** Resizes/re-encodes client-side so the stored avatar stays small regardless of the source file.
    Takes pre-translated error messages since this runs outside the component tree (no useTranslations here). */
function resizeImage(
  file: File,
  messages: { canvasNotSupported: string; invalidImage: string; readFailed: string }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error(messages.canvasNotSupported));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error(messages.invalidImage));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error(messages.readFailed));
    reader.readAsDataURL(file);
  });
}

export default function AvatarUploader({
  profile,
}: {
  profile: { name: string | null; email: string; avatarUrl: string | null };
}) {
  const t = useTranslations("AvatarUploader");
  const { updateAvatar } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("notAnImage"));
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file, {
        canvasNotSupported: t("canvasNotSupported"),
        invalidImage: t("invalidImage"),
        readFailed: t("readFailed"),
      });
      await updateAvatar(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("updateFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar name={profile.name} email={profile.email} avatarUrl={profile.avatarUrl} size="lg" />
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="cursor-pointer rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {uploading ? t("uploading") : t("changePhoto")}
          </button>
          {profile.avatarUrl && (
            <button
              type="button"
              onClick={() => updateAvatar(null)}
              className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {t("remove")}
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
