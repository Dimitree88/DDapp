"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { numericDraftValid, numericValueValid, type NumericMode } from "@/lib/numeric";
import { compareOptionLabels } from "@/lib/sortOptions";

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

type FieldInfoOpen = (id: string, title: string, trigger: HTMLButtonElement) => void;
export const FieldInfoContext = createContext<FieldInfoOpen>(() => {});

export function InfoLabel({ id, title, dialogTitle, className = "" }: { id: string; title: string; dialogTitle?: string; className?: string }) {
  const open = useContext(FieldInfoContext);
  return <button type="button" aria-label={`Informazioni su ${dialogTitle ?? title}`} aria-haspopup="dialog"
    onClick={(event) => { event.stopPropagation(); open(id, dialogTitle ?? title, event.currentTarget); }}
    className={`touch-manipulation text-left active:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${className}`}>
    {title}
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

function EditIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" />
  </svg>;
}

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
  showInfo = true,
  valueInfoId,
  valueInfoTitle,
  showEditIcon = false,
  displayValue,
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
  showInfo?: boolean;
  valueInfoId?: string;
  valueInfoTitle?: string;
  showEditIcon?: boolean;
  displayValue?: ReactNode;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const openInfo = useContext(FieldInfoContext);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const infoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInfoTap = useRef(0);
  useEffect(() => () => { if (infoTimer.current) clearTimeout(infoTimer.current); }, []);
  const onTap = useDoubleTap(() => {
    if (locked) return;
    if (!unlocked) return requireUnlock();
    setDraft(value);
    setEditing(true);
  });
  const startEditing = () => {
    if (locked) return;
    if (!unlocked) return requireUnlock();
    setDraft(value);
    setEditing(true);
  };
  const editButton = showEditIcon && !locked ? <button type="button" aria-label={`Modifica ${label}`} onClick={startEditing} className="shrink-0 rounded p-1 text-ink-faint hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><EditIcon /></button> : null;
  const close = () => {
    if (numeric && !numericValueValid(draft, numeric)) onChange("");
    setEditing(false);
  };
  const onValueTap = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!valueInfoId) return;
    const trigger = event.currentTarget;
    if (locked) return openInfo(valueInfoId, valueInfoTitle ?? value, trigger);
    const now = Date.now();
    if (now - lastInfoTap.current < 320) {
      if (infoTimer.current) clearTimeout(infoTimer.current);
      infoTimer.current = null;
      lastInfoTap.current = 0;
      if (unlocked) { setDraft(value); setEditing(true); }
      return;
    }
    lastInfoTap.current = now;
    infoTimer.current = setTimeout(() => { openInfo(valueInfoId, valueInfoTitle ?? value, trigger); infoTimer.current = null; }, 330);
  };

  return (
    <div className="block">
      {label && (Boolean(valueInfoId && value) || showInfo ? <InfoLabel id={valueInfoId && value ? valueInfoId : helpId ?? label} title={label} dialogTitle={valueInfoId && value ? valueInfoTitle ?? value : undefined} className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-ink-soft" /> : <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-ink-soft">{label}</span>)}
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
            {[...options].sort(compareOptionLabels).map((option) => <option key={option} value={option}>{option}</option>)}
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
      ) : valueInfoId && value ? (
        <div className={`${readonlyBase} flex items-center gap-0.5 ${unlocked && !locked ? editableHint : ""}`}>
          <button type="button" aria-label={`Informazioni su ${valueInfoTitle ?? value}`} aria-haspopup="dialog"
            onClick={onValueTap}
            className={`min-w-0 text-left ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}>
            {displayValue ?? value}
          </button>
          {editButton}
        </div>
      ) : locked && showInfo ? (
        <button type="button" aria-label={`Informazioni su ${label || helpId || "campo"}`} aria-haspopup="dialog"
          onClick={(event) => openInfo(helpId ?? label, label || helpId || "Campo", event.currentTarget)}
          className={`${readonlyBase} text-left ${multiline ? "whitespace-pre-wrap leading-relaxed" : ""}`}>
          {value ? displayValue ?? value : <span className="text-ink-faint">—</span>}
        </button>
      ) : (
        <div className={`${readonlyBase} flex items-center gap-0.5 ${unlocked && !locked ? editableHint : ""}`}>
          <div
            onClick={onTap}
            className={`min-w-0 ${
              multiline ? "whitespace-pre-wrap leading-relaxed" : ""
            }`}
          >
            {value ? displayValue ?? value : <span className="text-ink-faint">—</span>}
          </div>
          {editButton}
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
  valueInfoId,
  showEditIcon = false,
}: {
  label: string;
  value: string;
  unit: string;
  onChange: (value: string) => void;
  valueInfoId?: string;
  showEditIcon?: boolean;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const openInfo = useContext(FieldInfoContext);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const infoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInfoTap = useRef(0);
  useEffect(() => () => { if (infoTimer.current) clearTimeout(infoTimer.current); }, []);
  const onTap = useDoubleTap(() => {
    if (!unlocked) return requireUnlock();
    setDraft(value);
    setEditing(true);
  });
  const startEditing = () => {
    if (!unlocked) return requireUnlock();
    setDraft(value);
    setEditing(true);
  };
  const editButton = showEditIcon ? <button type="button" aria-label={`Modifica ${label}`} onClick={startEditing} className="shrink-0 rounded p-1 text-ink-faint hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><EditIcon /></button> : null;
  const commit = () => {
    const parsed = Number(draft.replace(",", "."));
    onChange(draft.trim() && Number.isFinite(parsed) ? String(parsed) : "");
    setEditing(false);
  };
  return (
    <div className="block">
      {valueInfoId && value ? <InfoLabel id={valueInfoId} title={label} dialogTitle={`${label}: ${value} ${unit}`} className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-ink-soft" /> : <span className="mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-ink-soft">{label}</span>}
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
      ) : valueInfoId && value ? (
        <div className={`${readonlyBase} flex items-center gap-0.5 ${unlocked ? editableHint : ""}`}>
          <button type="button" aria-label={`Informazioni su ${label}: ${value} ${unit}`} aria-haspopup="dialog"
            onClick={(event) => {
              const trigger = event.currentTarget;
              const now = Date.now();
              if (now - lastInfoTap.current < 320) {
                if (infoTimer.current) clearTimeout(infoTimer.current);
                infoTimer.current = null;
                lastInfoTap.current = 0;
                if (unlocked) { setDraft(value); setEditing(true); }
                return;
              }
              lastInfoTap.current = now;
              infoTimer.current = setTimeout(() => { openInfo(valueInfoId, `${label}: ${value} ${unit}`, trigger); infoTimer.current = null; }, 330);
            }}
            className="min-w-0 text-left">
            {value} {unit}
          </button>
          {editButton}
        </div>
      ) : (
        <div className={`${readonlyBase} flex items-center gap-0.5 ${unlocked ? editableHint : ""}`}>
          <div onClick={onTap} className="min-w-0">
            {value ? `${value} ${unit}` : <span className="text-ink-faint">—</span>}
          </div>
          {editButton}
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
  onExplain,
  large = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  numeric?: NumericMode;
  onExplain?: (button: HTMLButtonElement) => void;
  large?: boolean;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const infoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInfoTap = useRef(0);
  useEffect(() => () => { if (infoTimer.current) clearTimeout(infoTimer.current); }, []);
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
        className={`rounded-md border border-line bg-card/80 px-2 py-1 ${large ? "text-xl" : "text-[15px]"} text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none ${className}`}
      />
    );
  }
  if (onExplain && value) return (
    <button type="button" aria-label={`Spiega ${value}`} aria-haspopup="dialog"
      onClick={(event) => {
        const trigger = event.currentTarget;
        const now = Date.now();
        if (now - lastInfoTap.current < 320) {
          if (infoTimer.current) clearTimeout(infoTimer.current);
          infoTimer.current = null;
          lastInfoTap.current = 0;
          if (unlocked) { setDraft(value); setEditing(true); }
          return;
        }
        lastInfoTap.current = now;
        infoTimer.current = setTimeout(() => { onExplain(trigger); infoTimer.current = null; }, 330);
      }}
      className={`touch-manipulation ${large ? "text-xl" : ""} text-ink ${unlocked ? "cursor-pointer underline decoration-line/60 decoration-dotted underline-offset-4" : ""} ${className}`}>
      {value}
    </button>
  );
  return (
    <span
      onClick={onTap}
      className={`inline-block touch-manipulation ${large ? "text-xl" : ""} text-ink ${
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
  onExplain,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
  helpId?: string;
  onExplain?: (button: HTMLButtonElement) => void;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const onTap = useDoubleTap(() => {
    if (locked) return;
    if (unlocked) onChange(!checked);
    else requireUnlock();
  });
  const active = checked
    ? "border-accent bg-accent/12 text-accent"
    : "border-line bg-card/60 text-ink-soft";
  return (
    <span className="inline-flex items-center">
    <button
      type="button"
      onClick={onTap}
      aria-label={`${label}; doppio tocco per ${checked ? "rimuovere" : "aggiungere"}`}
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
    </button>
    {onExplain ? <button type="button" onClick={(event) => onExplain(event.currentTarget)} className="ml-1.5 text-xs font-medium text-ink-soft">{label}</button> : <InfoLabel id={helpId ?? label} title={label} className="ml-1.5 text-xs font-medium text-ink-soft" />}
    </span>
  );
}
