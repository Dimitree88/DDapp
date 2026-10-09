import type { ReactNode } from "react";

// Icone essenziali per leggere a colpo d'occhio attacchi e incantesimi.
const paths = {
  hit: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></>,
  damage: <path d="M12 2.5l2.2 5.6 5.8-1.9-3 5.3 4.5 3.9-6 .7.3 6.1L12 18.6l-3.8 3.6.3-6.1-6-.7 4.5-3.9-3-5.3 5.8 1.9z" />,
  reach: <><path d="M14.5 4.5h5v5" /><path d="M19.5 4.5 9 15" /><path d="M5 13l6 6" /><path d="M7 17l-2.5 2.5" /></>,
  range: <><path d="M4 20 20 4" /><path d="M14 4h6v6" /><path d="M4 14v6h6" /></>,
  time: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  duration: <><path d="M7 3h10M7 21h10" /><path d="M8 3c0 5 8 5 8 9s-8 4-8 9" /><path d="M16 3c0 5-8 5-8 9s8 4 8 9" /></>,
  save: <path d="M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z" />,
  spell: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></>,
} as const;

export type IconName = keyof typeof paths;

export function StatIcon({ name, className = "size-3.5" }: { name: IconName; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className}`}>{paths[name]}</svg>;
}

export type TileTone = "accent" | "red" | "sky" | "violet" | "neutral";

const tones: Record<TileTone, string> = {
  accent: "border-accent/35 bg-accent/10 text-accent-strong",
  red: "border-red-700/30 bg-red-700/10 text-red-900",
  sky: "border-sky-700/30 bg-sky-700/10 text-sky-900",
  violet: "border-violet-700/25 bg-violet-100/80 text-violet-900",
  neutral: "border-line/70 bg-card/60 text-ink",
};

// Riquadro di una statistica di combattimento: etichetta con icona, valore grande,
// eventuale nota. Se riceve onClick diventa toccabile e apre la spiegazione.
export function StatTile({ icon, label, value, sub, tone = "neutral", onClick, ariaLabel, className = "", size = "md" }: {
  icon?: IconName;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: TileTone;
  onClick?: (button: HTMLButtonElement) => void;
  ariaLabel?: string;
  className?: string;
  size?: "md" | "sm";
}) {
  const body = <>
    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-80">
      {icon && <StatIcon name={icon} className="size-3" />}{label}
    </span>
    <span className={`${size === "sm" ? "text-[15px]" : "text-lg"} font-bold leading-tight tabular-nums [overflow-wrap:anywhere]`}>{value === "" || value === null || value === undefined ? "—" : value}</span>
    {sub && <span className="text-[11px] leading-tight opacity-80 [overflow-wrap:anywhere]">{sub}</span>}
  </>;
  const base = `flex min-h-14 min-w-0 flex-col justify-center gap-0.5 rounded-xl border px-2.5 py-1.5 text-left ${tones[tone]} ${className}`;
  if (!onClick) return <div className={base}>{body}</div>;
  return <button type="button" aria-haspopup="dialog" aria-label={ariaLabel ?? `Spiega ${label}`}
    onClick={(event) => { event.stopPropagation(); onClick(event.currentTarget); }}
    className={`${base} touch-manipulation transition-transform active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent`}>
    {body}
  </button>;
}

// Etichetta compatta (concentrazione, rituale, proprietà dell'arma...).
export function Badge({ children, tone = "neutral", icon }: { children: ReactNode; tone?: TileTone; icon?: IconName }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
    {icon && <StatIcon name={icon} className="size-3" />}{children}
  </span>;
}
