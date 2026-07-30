export default function Checkbox({
  checked,
  onChange,
  size = "md",
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
  "aria-label"?: string;
}) {
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span className={`relative inline-flex shrink-0 ${dim}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        className={`peer ${dim} cursor-pointer appearance-none rounded border border-zinc-300 bg-white transition-colors checked:border-zinc-900 checked:bg-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:checked:border-zinc-100 dark:checked:bg-zinc-100`}
      />
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute inset-0 h-full w-full scale-75 text-white opacity-0 peer-checked:opacity-100 dark:text-zinc-900"
      >
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    </span>
  );
}
