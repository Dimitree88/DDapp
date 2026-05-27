"use client";

const inputBase =
  "w-full rounded-lg border border-line bg-card/80 px-3 py-2 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none";
const readonlyBase =
  "w-full rounded-lg border border-transparent bg-card/40 px-3 py-2 text-base text-ink min-h-[2.6rem]";

export function TextField({
  label,
  value,
  onChange,
  editable,
  multiline = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      {editable ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className={`${inputBase} resize-y leading-relaxed`}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={inputBase}
          />
        )
      ) : (
        <div className={`${readonlyBase} ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}>
          {value || <span className="text-ink-faint">—</span>}
        </div>
      )}
    </label>
  );
}

export function InlineInput({
  value,
  onChange,
  editable,
  placeholder = "",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
  placeholder?: string;
  className?: string;
}) {
  if (editable) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`rounded-md border border-line bg-card/80 px-2 py-1.5 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none ${className}`}
      />
    );
  }
  return (
    <span className={`inline-block text-ink ${className}`}>
      {value || <span className="text-ink-faint">—</span>}
    </span>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  editable,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  editable: boolean;
}) {
  const active = checked
    ? "border-accent bg-accent/12 text-accent"
    : "border-line bg-card/60 text-ink-soft";
  return (
    <button
      type="button"
      disabled={!editable}
      onClick={() => editable && onChange(!checked)}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-default ${active}`}
    >
      <span
        className={`grid h-4 w-4 place-items-center rounded-full border text-[10px] ${
          checked ? "border-accent bg-accent text-parchment" : "border-ink-faint"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}
