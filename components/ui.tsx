"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

// --- Identificatori comando (funziona anche su http in rete locale) -----

export function uuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const cx = (...items: (string | false | null | undefined)[]) => items.filter(Boolean).join(" ");

// --- Pulsanti ---------------------------------------------------------

type Tone = "primary" | "secondary" | "danger" | "heal" | "ghost" | "temp";
const tones: Record<Tone, string> = {
  primary: "bg-accent text-on-accent active:bg-accent-strong disabled:bg-accent/50",
  secondary: "border border-line bg-surface/80 text-ink active:bg-parchment disabled:opacity-50",
  danger: "bg-danger text-on-accent active:bg-danger-strong disabled:bg-danger/50",
  heal: "bg-heal text-on-accent active:bg-heal-strong disabled:bg-heal/50",
  temp: "bg-temp text-on-accent active:bg-temp-strong disabled:bg-temp/50",
  ghost: "text-accent active:bg-parchment disabled:opacity-50",
};

export function Button({ tone = "secondary", className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: Tone }) {
  return <button type="button" {...props} className={cx("inline-flex min-h-11 select-none items-center justify-center gap-1.5 rounded-xl px-4 text-[15px] font-semibold transition-colors", tones[tone], className)}>{children}</button>;
}

export function Chip({ active, onClick, children, className, tone = "accent", disabled }: { active?: boolean; onClick?: () => void; children: ReactNode; className?: string; tone?: "accent" | "danger" | "temp"; disabled?: boolean }) {
  const on = tone === "danger" ? "border-danger bg-danger text-on-accent" : tone === "temp" ? "border-temp bg-temp text-on-accent" : "border-accent bg-accent text-on-accent";
  return <button type="button" aria-pressed={active} disabled={disabled} onClick={onClick} className={cx("min-h-10 rounded-full border px-3.5 text-sm font-semibold transition-colors disabled:opacity-40", active ? on : "border-line bg-surface/70 text-ink active:bg-parchment", className)}>{children}</button>;
}

export function Pips({ total, filled, tone = "accent", size = "md" }: { total: number; filled: number; tone?: "accent" | "heal" | "danger"; size?: "sm" | "md" }) {
  const color = tone === "heal" ? "border-heal bg-heal" : tone === "danger" ? "border-danger bg-danger" : "border-accent bg-accent";
  return <span className="inline-flex flex-wrap gap-1" aria-label={`${filled} su ${total}`}>
    {Array.from({ length: total }, (_, index) => <span key={index} className={cx("rounded-full border", size === "sm" ? "size-2.5" : "size-3.5", index < filled ? color : "border-line bg-surface")} />)}
  </span>;
}

// Valore sintetico. Con onClick diventa toccabile e apre la spiegazione del calcolo.
export function Stat({ label, value, hint, onClick, explainLabel }: { label: string; value: ReactNode; hint?: string; onClick?: () => void; explainLabel?: string }) {
  const body = <>
    <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
    <span className={cx("text-lg font-bold leading-tight text-ink", onClick && "underline decoration-line decoration-dotted underline-offset-4")}>{value === "" || value === null || value === undefined ? "—" : value}</span>
    {hint && <span className="text-[11px] leading-tight text-ink-soft">{hint}</span>}
  </>;
  const base = "flex min-w-0 flex-col items-center rounded-xl bg-surface/60 px-2 py-1.5 text-center";
  if (!onClick) return <div className={base}>{body}</div>;
  return <button type="button" onClick={onClick} aria-haspopup="dialog" aria-label={`Spiega il calcolo: ${explainLabel ?? label}`}
    className={cx(base, "touch-manipulation transition-colors active:bg-parchment")}>{body}</button>;
}

export function Section({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">{title}</h3>{action}</div>
    {children}
  </section>;
}

export function NumberInput({ value, onChange, className, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { value: string; onChange: (value: string) => void }) {
  return <input {...props} inputMode="numeric" value={value} onChange={(event) => onChange(event.target.value.replace(/[^\d-]/g, ""))}
    className={cx("min-h-11 min-w-0 rounded-xl border border-line bg-surface px-3 text-base text-ink", className)} />;
}

export function TextInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx("min-h-11 min-w-0 rounded-xl border border-line bg-surface px-3 text-base text-ink placeholder:text-ink-faint", className)} />;
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <label className={cx("flex min-w-0 flex-col gap-1 text-xs font-semibold text-ink-soft", className)}>{label}{children}</label>;
}

// --- Barra dei PF -----------------------------------------------------

export function HpBar({ current, max, temp, dead }: { current: number | null; max: number | null; temp: number; dead?: boolean }) {
  if (current === null || max === null || max < 1) return <div className="h-2.5 rounded-full bg-line/40" />;
  const ratio = Math.max(0, Math.min(1, current / max));
  const color = dead || current === 0 ? "bg-danger" : ratio <= 0.5 ? "bg-warn" : "bg-heal";
  const tempRatio = Math.min(1 - ratio, temp / max);
  return <div className="flex h-2.5 overflow-hidden rounded-full bg-line/40" aria-hidden>
    <div className={cx("h-full transition-[width] duration-300", color)} style={{ width: `${ratio * 100}%` }} />
    {temp > 0 && <div className="h-full bg-temp/70" style={{ width: `${Math.max(0.04, tempRatio) * 100}%` }} />}
  </div>;
}

// --- Pannello a scorrimento (bottom sheet su telefono, dialogo su tablet) ---

// Pannelli aperti, dal più vecchio al più recente: Esc chiude solo quello in cima.
const openSheets: string[] = [];
const subscribeMounted = () => () => {};

export function Sheet({ open, onClose, title, subtitle, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const mounted = useSyncExternalStore(subscribeMounted, () => true, () => false);
  const titleId = useId();
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    if (!open) return;
    openSheets.push(titleId);
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && openSheets.at(-1) === titleId) close.current(); };
    window.addEventListener("keydown", onKey);
    return () => {
      const index = openSheets.lastIndexOf(titleId);
      if (index >= 0) openSheets.splice(index, 1);
      if (!openSheets.length) document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, titleId]);
  if (!open || !mounted) return null;
  return createPortal(<div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
    <div className="absolute inset-0 animate-[fadeIn_.15s_ease-out] bg-ink/55" onClick={onClose} aria-hidden />
    <div role="dialog" aria-modal="true" aria-labelledby={titleId}
      className={cx("relative flex max-h-[92dvh] w-full animate-[sheetUp_.2s_ease-out] flex-col rounded-t-3xl border-t-2 border-gold bg-card shadow-2xl sm:rounded-3xl sm:border-2", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
      <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-line/70 sm:hidden" aria-hidden />
      <header className="flex shrink-0 items-start gap-3 border-b border-line/50 px-4 pb-3 pt-2 sm:pt-4">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="truncate text-lg font-bold text-heading">{title}</h2>
          {subtitle && <div className="text-sm text-ink-soft">{subtitle}</div>}
        </div>
        <button type="button" onClick={onClose} aria-label="Chiudi" className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-ink-soft active:bg-parchment">×</button>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
      {footer && <footer className="shrink-0 border-t border-line/50 bg-card px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3">{footer}</footer>}
      {!footer && <div className="h-[env(safe-area-inset-bottom)] shrink-0" />}
    </div>
  </div>, document.body);
}

// --- Notifiche --------------------------------------------------------

type ToastData = { id: number; title: string; lines?: string[]; warnings?: string[]; tone: "ok" | "error"; undo?: () => void };
type ToastApi = { show: (toast: Omit<ToastData, "id">) => void };
const ToastContext = createContext<ToastApi>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((next: Omit<ToastData, "id">) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ ...next, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), next.tone === "error" || next.warnings?.length ? 9000 : 6000);
  }, []);
  return <ToastContext.Provider value={{ show }}>
    {children}
    {toast && <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-[60] flex justify-center px-3" role="status" aria-live="polite">
      <div key={toast.id} className={cx("pointer-events-auto flex w-full max-w-md animate-[sheetUp_.2s_ease-out] items-start gap-3 rounded-2xl px-4 py-3 shadow-xl", toast.tone === "error" ? "bg-danger-strong text-on-accent" : "bg-ink text-parchment")}>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-bold">{toast.title}</p>
          {toast.lines?.slice(0, 3).map((line, index) => <p key={index} className="opacity-85">{line}</p>)}
          {toast.warnings?.map((line, index) => <p key={`w${index}`} className="mt-1 rounded-lg bg-warn/45 px-2 py-1 font-semibold text-ink">⚠ {line}</p>)}
        </div>
        {toast.undo && <button type="button" className="min-h-10 shrink-0 rounded-xl border border-parchment/40 px-3 text-sm font-bold" onClick={() => { toast.undo?.(); setToast(null); }}>Annulla</button>}
        <button type="button" aria-label="Chiudi notifica" className="-mr-1 min-h-10 shrink-0 px-1 text-lg opacity-70" onClick={() => setToast(null)}>×</button>
      </div>
    </div>}
  </ToastContext.Provider>;
}

// --- Conferma ---------------------------------------------------------

type ConfirmOptions = { title: string; message?: ReactNode; confirmLabel?: string; danger?: boolean };
const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false);
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (value: boolean) => void }) | null>(null);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setState({ ...options, resolve })), []);
  const answer = (value: boolean) => { state?.resolve(value); setState(null); };
  return <ConfirmContext.Provider value={confirm}>
    {children}
    <Sheet open={Boolean(state)} onClose={() => answer(false)} title={state?.title ?? ""}
      footer={<div className="flex gap-2"><Button className="flex-1" onClick={() => answer(false)}>Annulla</Button><Button className="flex-1" tone={state?.danger ? "danger" : "primary"} onClick={() => answer(true)}>{state?.confirmLabel ?? "Conferma"}</Button></div>}>
      <div className="text-[15px] leading-relaxed text-ink">{state?.message}</div>
    </Sheet>
  </ConfirmContext.Provider>;
}
