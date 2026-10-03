"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Contesto di modifica condiviso: i campi non ricevono più `editable` per prop,
// ma leggono qui se la scheda è sbloccata e come richiedere lo sblocco (PIN).
type EditCtx = {
  unlocked: boolean;
  requireUnlock: () => void;
};

export const EditContext = createContext<EditCtx>({
  unlocked: false,
  requireUnlock: () => {},
});

export function EditProvider({
  unlocked,
  requireUnlock,
  children,
}: EditCtx & { children: ReactNode }) {
  return (
    <EditContext.Provider value={{ unlocked, requireUnlock }}>
      {children}
    </EditContext.Provider>
  );
}

// Rileva il "doppio tocco/click" senza affidarsi al dblclick nativo (inaffidabile
// su iOS). Due tocchi entro ~320 ms attivano l'azione; un tocco singolo no.
export function useDoubleTap(onDouble: () => void) {
  const last = useRef(0);
  return () => {
    const now = Date.now();
    if (now - last.current < 320) {
      last.current = 0;
      onDouble();
    } else {
      last.current = now;
    }
  };
}

const inputBase =
  "w-full rounded-lg border border-line bg-card/80 px-3 py-1.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none";
const readonlyBase =
  "w-full rounded-lg border border-transparent bg-card/40 px-3 py-1 text-[15px] text-ink min-h-[2rem] touch-manipulation";
const editableHint = "cursor-pointer border-dashed border-line/60";

function enterBlurs(e: React.KeyboardEvent) {
  if (e.key === "Enter") (e.target as HTMLElement).blur();
}

export function TextField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder = "",
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const [editing, setEditing] = useState(false);
  const onTap = useDoubleTap(() => (unlocked ? setEditing(true) : requireUnlock()));

  return (
    <label className="block">
      <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      {editing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            rows={2}
            autoFocus
            onBlur={() => setEditing(false)}
            className={`${inputBase} resize-y leading-snug`}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            autoFocus
            onBlur={() => setEditing(false)}
            onKeyDown={enterBlurs}
            className={inputBase}
          />
        )
      ) : (
        <div
          onClick={onTap}
          className={`${readonlyBase} ${unlocked ? editableHint : ""} ${
            multiline ? "whitespace-pre-wrap leading-relaxed" : ""
          }`}
        >
          {value || <span className="text-ink-faint">—</span>}
        </div>
      )}
    </label>
  );
}

export function InlineInput({
  value,
  onChange,
  placeholder = "",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const [editing, setEditing] = useState(false);
  const onTap = useDoubleTap(() => (unlocked ? setEditing(true) : requireUnlock()));

  if (editing) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus
        onBlur={() => setEditing(false)}
        onKeyDown={enterBlurs}
        className={`rounded-md border border-line bg-card/80 px-2 py-1 text-[15px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none ${className}`}
      />
    );
  }
  return (
    <span
      onClick={onTap}
      className={`inline-block touch-manipulation text-ink ${
        unlocked
          ? "cursor-pointer underline decoration-line/60 decoration-dotted underline-offset-4"
          : ""
      } ${className}`}
    >
      {value || <span className="text-ink-faint">—</span>}
    </span>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const onTap = useDoubleTap(() =>
    unlocked ? onChange(!checked) : requireUnlock(),
  );
  const active = checked
    ? "border-accent bg-accent/12 text-accent"
    : "border-line bg-card/60 text-ink-soft";
  return (
    <button
      type="button"
      onClick={onTap}
      className={`flex touch-manipulation items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${active}`}
    >
      <span
        className={`grid h-3.5 w-3.5 place-items-center rounded-full border text-[9px] ${
          checked ? "border-accent bg-accent text-parchment" : "border-ink-faint"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      {label}
    </button>
  );
}
