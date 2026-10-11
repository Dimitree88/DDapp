import { formatHistoryValue, type HistoryChange } from "@/lib/history";

const coinStyles: Record<string, string> = {
  rame: "border-orange-700/60 bg-orange-700/15 text-orange-900",
  argento: "border-slate-400/70 bg-slate-200/70 text-slate-700",
  electrum: "border-yellow-500/70 bg-yellow-200/70 text-yellow-800",
  oro: "border-amber-500/80 bg-amber-300/60 text-amber-900",
  platino: "border-cyan-500/70 bg-cyan-100 text-cyan-800",
};

const coinNames: Record<string, string> = {
  rame: "rame", argento: "argento", electrum: "electrum", oro: "oro", platino: "platino",
};

export function HistoryChangeDisplay({ change }: { change: HistoryChange }) {
  const isHitPointChange = /^Punti ferita$/i.test(change.field);
  const beforeHp = Number(change.before);
  const afterHp = Number(change.after);
  const hpDirection = isHitPointChange && Number.isFinite(beforeHp) && Number.isFinite(afterHp)
    ? afterHp < beforeHp ? "down" : afterHp > beforeHp ? "up" : null
    : null;
  const match = /^Monete\s*·\s*(Rame|Argento|Electrum|Oro|Platino)$/i.exec(change.field);
  if (match) {
    const key = match[1].toLocaleLowerCase("it");
    return <span role="img" aria-label={`${coinNames[key]}: ${change.before} → ${change.after}`} className="inline-flex items-center gap-2 align-middle">
      <span title={`${change.before} monete di ${coinNames[key]}`} className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-1.5 text-[10px] font-bold tabular-nums ${coinStyles[key]}`}>{change.before}</span>
      <span aria-hidden>→</span>
      <span title={`${change.after} monete di ${coinNames[key]}`} className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-1.5 text-[10px] font-bold tabular-nums ${coinStyles[key]}`}>{change.after}</span>
    </span>;
  }

  return <><span className="font-semibold">{change.field}</span>{"  "}<span>
    {formatHistoryValue(change.before)} → {formatHistoryValue(change.after)}
    {hpDirection && <span role="img" aria-label={hpDirection === "down" ? "PF diminuiti" : "PF aumentati"}
      className={`ml-1 inline-flex size-5 items-center justify-center rounded-full align-middle text-xs font-bold leading-none text-white ${hpDirection === "down" ? "bg-danger" : "bg-heal"}`}>
      {hpDirection === "down" ? "↓" : "↑"}
    </span>}
  </span></>;
}
