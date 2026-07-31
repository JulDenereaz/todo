const SIZE_CLASSES = {
  sm: "h-7 w-7 text-xs",
  lg: "h-16 w-16 text-xl",
};

export default function Avatar({
  name,
  email,
  avatarUrl,
  size = "sm",
}: {
  name: string | null;
  email: string;
  avatarUrl?: string | null;
  size?: "sm" | "lg";
}) {
  const dimension = SIZE_CLASSES[size];
  const initials = (name || email || "?").trim().charAt(0).toUpperCase();

  if (avatarUrl) {
    // avatarUrl is a client-resized data: URL, not a hosted image — next/image's
    // optimization pipeline doesn't apply and isn't worth the extra config here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" className={`${dimension} shrink-0 rounded-full object-cover`} />;
  }

  return (
    <span
      className={`flex ${dimension} shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300`}
    >
      {initials}
    </span>
  );
}
