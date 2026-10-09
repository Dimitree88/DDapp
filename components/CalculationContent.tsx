import type { CalculationExplanation } from "@/lib/calculationExplanation";
import { DiceText } from "@/components/DiceText";

// Corpo della spiegazione di un valore calcolato: regola, valori della scheda,
// calcolo e risultato. Lo stesso schema della Classe Armatura per ogni statistica.
export function CalculationContent({ calculation, guide }: { calculation: CalculationExplanation; guide?: string }) {
  return <>
    <p className="text-sm leading-relaxed">{calculation.rule}</p>
    {calculation.page && <p className="mt-2 text-xs text-ink-soft">Manuale del Giocatore 2024, p. {calculation.page}</p>}
    <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Valori della scheda</h3>
    <dl className="mt-2 space-y-1 text-sm">
      {calculation.details.map((detail) => (
        <div key={detail.label} className="flex justify-between gap-4 border-b border-line/50 py-1">
          <dt>{detail.label}</dt><dd className="text-right font-semibold">{detail.value}</dd>
        </div>
      ))}
    </dl>
    <div className="mt-4 rounded-lg bg-card/70 p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Calcolo</div>
      <div className="mt-1 text-sm">{calculation.formula}</div>
      <div className="mt-2 text-lg font-bold text-accent">Risultato: <DiceText text={calculation.result || "—"} /></div>
    </div>
    {guide && <div className="mt-4 text-sm"><h3 className="font-semibold text-accent">Come si modifica</h3><p className="mt-1">{guide}</p></div>}
  </>;
}
