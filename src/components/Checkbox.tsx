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
  const dim = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const overflow = size === "sm" ? "-inset-0.5" : "-inset-1";

  return (
    <span className={`relative inline-flex shrink-0 ${dim}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        className={`${dim} cursor-pointer appearance-none rounded-full border-2 border-zinc-300 bg-transparent transition-colors dark:border-zinc-600`}
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`pointer-events-none absolute ${overflow} text-green-600 opacity-0 transition-opacity dark:text-green-500 ${checked ? "opacity-100" : ""}`}
      >
        <path d="M4 13l5 6 11-15" />
      </svg>
    </span>
  );
}
