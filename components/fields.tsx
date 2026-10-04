"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { numericDraftValid, numericValueValid, type NumericMode } from "@/lib/numeric";

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

type FieldInfoOpen = (id: string, title: string, locked: boolean, trigger: HTMLButtonElement) => void;
export const FieldInfoContext = createContext<FieldInfoOpen>(() => {});

export function InfoButton({ id, title, locked = false }: { id: string; title: string; locked?: boolean }) {
  const open = useContext(FieldInfoContext);
  return <button type="button" aria-label={`Informazioni su ${title}`} aria-haspopup="dialog"
    onClick={(event) => { event.stopPropagation(); open(id, title, locked, event.currentTarget); }}
    className="ml-0.5 inline-flex min-h-6 min-w-6 shrink-0 touch-manipulation items-center justify-center rounded-full text-xs font-normal text-ink-faint active:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
    <span aria-hidden="true">ⓘ</span>
  </button>;
}

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
  options,
  numeric,
  allowEmpty = true,
  locked = false,
  helpId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  options?: readonly string[];
  numeric?: NumericMode;
  allowEmpty?: boolean;
  locked?: boolean;
  helpId?: string;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const openInfo = useContext(FieldInfoContext);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const onTap = useDoubleTap(() => {
    if (locked) return;
    if (!unlocked) return requireUnlock();
    setDraft(value);
    setEditing(true);
  });
  const close = () => {
    if (numeric && !numericValueValid(draft, numeric)) onChange("");
    setEditing(false);
  };

  return (
    <div className="block">
      {label && <span className="mb-0.5 flex items-center text-[10px] font-medium uppercase tracking-wide text-ink-soft">{label}<InfoButton id={helpId ?? label} title={label} locked={locked} />{locked && <span className="ml-1" aria-label="Scelta bloccata">🔒</span>}</span>}
      {editing && !locked ? (
        options ? (
          <select
            value={options.includes(value) ? value : ""}
            onChange={(e) => { onChange(e.target.value); setEditing(false); }}
            onBlur={() => setEditing(false)}
            autoFocus
            className={inputBase}
            aria-label={label || "Scegli un'opzione"}
          >
            {allowEmpty && <option value="">—</option>}
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : multiline ? (
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
            value={numeric ? draft : value}
            onChange={(e) => {
              const next = e.target.value;
              if (!numeric) return onChange(next);
              if (!numericDraftValid(next, numeric)) return;
              setDraft(next);
              if (numericValueValid(next, numeric)) onChange(next);
            }}
            placeholder={placeholder}
            inputMode={inputMode ?? (numeric === "unsigned" ? "numeric" : undefined)}
            autoFocus
            onBlur={close}
            onKeyDown={enterBlurs}
            className={inputBase}
          />
        )
      ) : locked ? (
        <button type="button" aria-label={`Informazioni su ${label || helpId || "campo"}`} aria-haspopup="dialog"
          onClick={(event) => openInfo(helpId ?? label, label || helpId || "Campo", true, event.currentTarget)}
          className={`${readonlyBase} text-left ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}>
          {value || <span className="text-ink-faint">—</span>}
        </button>
      ) : (
        <div
          onClick={onTap}
          className={`${readonlyBase} ${unlocked && !locked ? editableHint : ""} ${
            multiline ? "whitespace-pre-wrap leading-relaxed" : ""
          }`}
        >
          {value || <span className="text-ink-faint">—</span>}
        </div>
      )}
    </div>
  );
}

export function NumberUnitField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  onChange: (value: string) => void;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const onTap = useDoubleTap(() => {
    if (!unlocked) return requireUnlock();
    setDraft(value);
    setEditing(true);
  });
  const commit = () => {
    const parsed = Number(draft.replace(",", "."));
    onChange(draft.trim() && Number.isFinite(parsed) ? String(parsed) : "");
    setEditing(false);
  };
  return (
    <div className="block">
      <span className="mb-0.5 flex items-center text-[10px] font-medium uppercase tracking-wide text-ink-soft">{label}<InfoButton id={label} title={label} /></span>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            value={draft}
            onChange={(e) => { if (/^\d*(?:[.,]\d*)?$/.test(e.target.value)) setDraft(e.target.value); }}
            onBlur={commit}
            onKeyDown={enterBlurs}
            inputMode="decimal"
            autoFocus
            className={inputBase}
          />
          <span className="text-sm text-ink-soft">{unit}</span>
        </div>
      ) : (
        <div onClick={onTap} className={`${readonlyBase} ${unlocked ? editableHint : ""}`}>
          {value ? `${value} ${unit}` : <span className="text-ink-faint">—</span>}
        </div>
      )}
    </div>
  );
}

export function InlineInput({
  value,
  onChange,
  placeholder = "",
  className = "",
  numeric,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  numeric?: NumericMode;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const onTap = useDoubleTap(() => {
    if (!unlocked) return requireUnlock();
    setDraft(value);
    setEditing(true);
  });
  const close = () => {
    if (numeric && !numericValueValid(draft, numeric)) onChange("");
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        value={numeric ? draft : value}
        onChange={(e) => {
          const next = e.target.value;
          if (!numeric) return onChange(next);
          if (!numericDraftValid(next, numeric)) return;
          setDraft(next);
          if (numericValueValid(next, numeric)) onChange(next);
        }}
        placeholder={placeholder}
        inputMode={numeric === "unsigned" ? "numeric" : undefined}
        autoFocus
        onBlur={close}
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
  locked = false,
  helpId,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
  helpId?: string;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const openInfo = useContext(FieldInfoContext);
  const onTap = useDoubleTap(() =>
    locked ? undefined : unlocked ? onChange(!checked) : requireUnlock(),
  );
  const active = checked
    ? "border-accent bg-accent/12 text-accent"
    : "border-line bg-card/60 text-ink-soft";
  return (
    <span className="inline-flex items-center">
    <button
      type="button"
      onClick={(event) => locked
        ? openInfo(helpId ?? label, label, true, event.currentTarget)
        : onTap()}
      aria-disabled={locked}
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
    <InfoButton id={helpId ?? label} title={label} locked={locked} />
    </span>
  );
}
