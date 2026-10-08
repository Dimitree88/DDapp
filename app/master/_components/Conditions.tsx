"use client";

import { useState } from "react";
import conditionTexts from "@/lib/manuale-2024/testi/condizioni.json";
import { conditionNames, impliedConditions } from "@/lib/masterRules";
import type { CondizioneAttiva, ConcentrazioneAttiva } from "@/lib/sheet";
import { useMaster } from "./MasterContext";
import type { Target } from "./types";
import { Button, Chip, Section, Sheet, TextInput } from "@/components/ui";

const texts = (conditionTexts as { testi: Record<string, string> }).testi;
const slug = (name: string) => `condizione:${name.toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-")}`;
export const conditionText = (name: string) => texts[slug(name)] ?? "";

export function ConditionInfo({ name, onClose }: { name: string | null; onClose: () => void }) {
  return <Sheet open={Boolean(name)} onClose={onClose} title={name ?? ""} subtitle="Glossario delle regole">
    <div className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{name ? conditionText(name) || "Testo non disponibile." : ""}</div>
  </Sheet>;
}

export function ConditionsEditor({ target, conditions }: { target: Target; conditions: CondizioneAttiva[] }) {
  const { command, pending } = useMaster();
  const [source, setSource] = useState("");
  const [duration, setDuration] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const active = new Set(conditions.map((item) => item.nome));
  const implied = new Set(conditions.flatMap((item) => impliedConditions[item.nome] ?? []));

  const add = async (name: string) => {
    const result = await command(target, "condizione-aggiungi", { condition: name, source, duration });
    if (result.ok) { setSource(""); setDuration(""); }
  };

  return <Section title="Condizioni">
    {conditions.length > 0 && <ul className="flex flex-col gap-1.5">
      {conditions.map((condition, index) => <li key={`${condition.nome}-${index}`} className="flex items-center gap-2 rounded-xl bg-white/80 py-1 pl-3 pr-1">
        <button type="button" className="min-w-0 flex-1 py-1 text-left" onClick={() => setInfo(condition.nome)}>
          <span className="font-semibold text-ink">{condition.nome}</span>
          {(condition.fonte || condition.durata) && <span className="block truncate text-xs text-ink-soft">{[condition.fonte, condition.durata].filter(Boolean).join(" · ")}</span>}
          {impliedConditions[condition.nome] && <span className="block text-xs text-ink-soft">include: {impliedConditions[condition.nome].join(", ")}</span>}
        </button>
        <button type="button" disabled={pending} onClick={() => command(target, "condizione-rimuovi", { index })} aria-label={`Rimuovi ${condition.nome}`}
          className="min-h-10 rounded-lg px-3 text-sm font-semibold text-accent active:bg-parchment disabled:opacity-50">Rimuovi</button>
      </li>)}
    </ul>}
    <div className="flex flex-wrap gap-1.5">
      {conditionNames.map((name) => <Chip key={name} active={active.has(name)} disabled={pending} onClick={() => active.has(name) ? setInfo(name) : add(name)}
        className={implied.has(name) && !active.has(name) ? "border-dashed" : undefined}>{name}</Chip>)}
    </div>
    <div className="grid grid-cols-2 gap-2">
      <TextInput value={source} onChange={(event) => setSource(event.target.value)} placeholder="Fonte (facoltativa)" aria-label="Fonte della prossima condizione" />
      <TextInput value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Durata (facoltativa)" aria-label="Durata della prossima condizione" />
    </div>
    <p className="text-xs text-ink-soft">Tocca una condizione per applicarla; tocca un nome nell&apos;elenco per leggerne gli effetti.</p>
    <ConditionInfo name={info} onClose={() => setInfo(null)} />
  </Section>;
}

export function ConcentrationEditor({ target, concentration }: { target: Target; concentration: ConcentrazioneAttiva | null | undefined }) {
  const { command, pending } = useMaster();
  const [effect, setEffect] = useState("");
  const [duration, setDuration] = useState("");
  if (concentration) return <Section title="Concentrazione">
    <div className="flex items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 py-1 pl-3 pr-1">
      <div className="min-w-0 flex-1 py-1"><p className="font-semibold text-violet-950">◎ {concentration.effetto}</p>{(concentration.durata || concentration.fonte) && <p className="text-xs text-violet-900/80">{[concentration.fonte, concentration.durata].filter(Boolean).join(" · ")}</p>}</div>
      <Button tone="ghost" disabled={pending} onClick={() => command(target, "concentrazione-termina")}>Termina</Button>
    </div>
    <p className="text-xs text-ink-soft">Danni: TS Costituzione CD 10 o metà danni (max 30). Incapacitato o morto: termina (p. 364).</p>
  </Section>;
  return <Section title="Concentrazione">
    <div className="flex gap-2">
      <TextInput value={effect} onChange={(event) => setEffect(event.target.value)} placeholder="Incantesimo o effetto" className="flex-1" aria-label="Effetto concentrato" />
      <TextInput value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Durata" className="w-24" aria-label="Durata della concentrazione" />
    </div>
    <Button disabled={pending || !effect.trim()} onClick={async () => { const result = await command(target, "concentrazione-imposta", { effect, duration }); if (result.ok) { setEffect(""); setDuration(""); } }}>Registra concentrazione</Button>
  </Section>;
}
