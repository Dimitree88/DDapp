"use client";

import { useState } from "react";
import { signedNumber } from "@/lib/creature";
import { rollDie } from "@/lib/masterRules";
import { setupCombat, type EnemyDraft } from "../combat-actions";
import { useMaster } from "./MasterContext";
import type { Encounter } from "./types";
import { Button, Field, NumberInput, Sheet, TextInput, cx, uuid } from "@/components/ui";

type Draft = { key: string; baseName: string; count: number; templateId?: string; quick?: EnemyDraft["quick"]; bonus: number; armorClass: number; hitPoints: number };
type Row = { key: string; kind: "pg" | "cr" | "nuovo"; id: string; name: string; bonus: number; group: string; include: boolean; value: string; isEnemy: boolean };

const baseName = (name: string) => name.replace(/\s+\d+$/, "");

export function CombatSetup({ open, onClose, encounter }: { open: boolean; onClose: () => void; encounter: Encounter | null }) {
  return <Sheet open={open} onClose={onClose} wide title={encounter ? "Combattenti e iniziativa" : "Prepara combattimento"} subtitle="Iniziativa: prova di Destrezza, d20 + bonus (p. 23)">
    {open && <SetupBody encounter={encounter} onClose={onClose} />}
  </Sheet>;
}

function SetupBody({ encounter, onClose }: { encounter: Encounter | null; onClose: () => void }) {
  const { data, sessionId, run, pending } = useMaster();
  const inOrder = (kind: string, id: string) => encounter?.order.find((entry) => entry.kind === kind && entry.id === id);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries([
    ...data.party.map((item) => [`pg:${item.id}`, inOrder("pg", item.id) ? String(inOrder("pg", item.id)!.initiative) : ""]),
    ...data.foes.map((item) => [`cr:${item.id}`, inOrder("cr", item.id) ? String(inOrder("cr", item.id)!.initiative) : ""]),
  ]));
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set([
    ...data.party.filter((item) => encounter ? !inOrder("pg", item.id) : item.death === "morto").map((item) => `pg:${item.id}`),
    ...data.foes.filter((item) => encounter ? !inOrder("cr", item.id) : item.data.hitPointsCurrent === 0).map((item) => `cr:${item.id}`),
  ]));
  const [tieOrder, setTieOrder] = useState<string[]>(() => encounter ? encounter.order.map((entry) => `${entry.kind}:${entry.id}`) : []);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ name: "", count: "1", armorClass: "", hitPoints: "", bonus: "", attack: "", hitBonus: "", damage: "", damageType: "" });

  // Nomi numerati per i gruppi di creature uguali, senza duplicare quelli già in Sessione.
  const usedNames = new Set(data.foes.map((item) => item.name));
  const expanded = drafts.flatMap((draft) => {
    const taken = data.foes.filter((item) => baseName(item.name) === draft.baseName).map((item) => Number(/\s(\d+)$/.exec(item.name)?.[1] ?? 1));
    let next = taken.length ? Math.max(...taken) + 1 : 1;
    return Array.from({ length: draft.count }, (_, index) => {
      let name = draft.count === 1 && !taken.length && !usedNames.has(draft.baseName) ? draft.baseName : `${draft.baseName} ${next}`;
      while (usedNames.has(name) && name !== draft.baseName) { next += 1; name = `${draft.baseName} ${next}`; }
      next += 1;
      return { key: `${draft.key}-${index}`, name, draft };
    });
  });

  const rows: Row[] = [
    ...data.party.map((item) => ({ key: `pg:${item.id}`, kind: "pg" as const, id: item.id, name: item.name, bonus: Number(item.initiative || 0), group: `pg:${item.id}`, isEnemy: false })),
    ...data.foes.map((item) => ({ key: `cr:${item.id}`, kind: "cr" as const, id: item.id, name: item.name, bonus: Number(item.data.initiativeBonus ?? 0), group: `cr:${baseName(item.name)}:${item.data.initiativeBonus ?? 0}`, isEnemy: true })),
    ...expanded.map((item) => ({ key: `nuovo:${item.key}`, kind: "nuovo" as const, id: item.key, name: item.name, bonus: item.draft.bonus, group: `cr:${item.draft.baseName}:${item.draft.bonus}`, isEnemy: true })),
  ].map((row) => ({ ...row, include: !excluded.has(row.key), value: values[row.key] ?? "" }));

  const included = rows.filter((row) => row.include);
  const missing = included.filter((row) => row.value === "" || !Number.isFinite(Number(row.value)));
  const tieIndex = (key: string) => { const index = tieOrder.indexOf(key); return index < 0 ? 1e6 + rows.findIndex((row) => row.key === key) : index; };
  const ranking = [...included].filter((row) => row.value !== "").sort((a, b) => Number(b.value) - Number(a.value) || tieIndex(a.key) - tieIndex(b.key));

  const setValue = (key: string, value: string) => { setValues((current) => ({ ...current, [key]: value })); setExcluded((current) => { const next = new Set(current); next.delete(key); return next; }); };
  // Un solo tiro per un gruppo di creature identiche (p. 23); solo per chi non ha un valore.
  const rollFor = (filter: (row: Row) => boolean) => setValues((current) => {
    const next = { ...current };
    const groupRolls = new Map(rows.filter((row) => row.include && current[row.key]).map((row) => [row.group, current[row.key]]));
    for (const row of rows) {
      if (!row.include || current[row.key] || !filter(row)) continue;
      const value = groupRolls.get(row.group) ?? String(rollDie(20) + row.bonus);
      groupRolls.set(row.group, value);
      next[row.key] = value;
    }
    return next;
  });
  const moveTie = (key: string, delta: -1 | 1) => {
    const list = ranking.map((row) => row.key);
    const index = list.indexOf(key);
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setTieOrder(list);
  };

  const addTemplate = (id: string) => {
    const template = data.library.find((item) => item.id === id);
    if (!template) return;
    setDrafts((current) => {
      const existing = current.find((draft) => draft.templateId === id);
      if (existing) return current.map((draft) => draft === existing ? { ...draft, count: Math.min(20, draft.count + 1) } : draft);
      return [...current, { key: uuid(), baseName: baseName(template.name), count: 1, templateId: id, bonus: Number(template.data.initiativeBonus ?? 0), armorClass: template.data.armorClass, hitPoints: template.data.hitPointsMax }];
    });
  };
  const addQuick = () => {
    const count = Math.min(20, Math.max(1, Number(quick.count) || 1));
    const draft: Draft = {
      key: uuid(), baseName: quick.name.trim(), count, bonus: Number(quick.bonus) || 0, armorClass: Number(quick.armorClass), hitPoints: Number(quick.hitPoints),
      quick: {
        armorClass: Number(quick.armorClass), hitPoints: Number(quick.hitPoints), initiativeBonus: Number(quick.bonus) || 0,
        ...(quick.attack.trim() ? { attack: { name: quick.attack.trim(), hitBonus: Number(quick.hitBonus) || 0, damageFormula: quick.damage.trim(), damageType: quick.damageType.trim() } } : {}),
      },
    };
    setDrafts((current) => [...current, draft]);
    setQuick({ name: "", count: "1", armorClass: "", hitPoints: "", bonus: "", attack: "", hitBonus: "", damage: "", damageType: "" });
    setQuickOpen(false);
  };
  const quickValid = quick.name.trim() && Number(quick.armorClass) >= 0 && quick.armorClass !== "" && Number(quick.hitPoints) >= 1;

  const submit = async () => {
    const current = encounter?.order[encounter.turn];
    const result = await run(() => setupCombat({
      sessionId,
      drafts: expanded.map((item) => ({ key: item.key, name: item.name, ...(item.draft.templateId ? { templateId: item.draft.templateId } : { quick: item.draft.quick }) })),
      order: ranking.map((row) => ({ kind: row.kind, id: row.id, initiative: Number(row.value) })),
      round: encounter?.round ?? 1,
      currentId: current ? `${current.kind}:${current.id}` : null,
    }), { quiet: true });
    if (result.ok) onClose();
  };

  return <div className="flex flex-col gap-5">
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">1 · Nemici</h3>
      {data.library.length > 0 && <div className="flex flex-col gap-1.5">
        <p className="text-xs text-ink-soft">Dalla libreria (tocca più volte per aggiungerne altri):</p>
        <div className="flex flex-wrap gap-1.5">{data.library.map((item) => <button key={item.id} type="button" onClick={() => addTemplate(item.id)} className="min-h-10 rounded-full border border-line bg-surface/80 px-3 text-sm font-semibold text-ink active:bg-parchment">+ {item.name} <span className="font-normal text-ink-soft">CA {item.data.armorClass} · PF {item.data.hitPointsMax}</span></button>)}</div>
      </div>}
      {drafts.map((draft) => <div key={draft.key} className="flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/5 p-2">
        <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">{draft.baseName}</p><p className="text-xs text-ink-soft">CA {draft.armorClass} · PF {draft.hitPoints} · iniz {signedNumber(draft.bonus)}{draft.templateId ? "" : " · rapido"}</p></div>
        <div className="flex items-center rounded-xl border border-line bg-surface">
          <button type="button" className="h-10 w-9 text-lg" aria-label={`Meno ${draft.baseName}`} onClick={() => setDrafts((current) => current.flatMap((item) => item.key !== draft.key ? [item] : item.count > 1 ? [{ ...item, count: item.count - 1 }] : []))}>−</button>
          <span className="w-7 text-center font-bold">{draft.count}</span>
          <button type="button" className="h-10 w-9 text-lg" aria-label={`Più ${draft.baseName}`} onClick={() => setDrafts((current) => current.map((item) => item.key === draft.key ? { ...item, count: Math.min(20, item.count + 1) } : item))}>+</button>
        </div>
      </div>)}
      {quickOpen ? <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface/70 p-3">
        <div className="grid grid-cols-[1fr_5rem] gap-2">
          <Field label="Nome"><TextInput value={quick.name} onChange={(event) => setQuick({ ...quick, name: event.target.value })} placeholder="Es. Bandito" autoFocus /></Field>
          <Field label="Quanti"><NumberInput value={quick.count} onChange={(value) => setQuick({ ...quick, count: value })} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="CA"><NumberInput value={quick.armorClass} onChange={(value) => setQuick({ ...quick, armorClass: value })} placeholder="12" /></Field>
          <Field label="PF"><NumberInput value={quick.hitPoints} onChange={(value) => setQuick({ ...quick, hitPoints: value })} placeholder="11" /></Field>
          <Field label="Iniziativa"><NumberInput value={quick.bonus} onChange={(value) => setQuick({ ...quick, bonus: value })} placeholder="+1" /></Field>
        </div>
        <details className="text-sm"><summary className="cursor-pointer font-semibold text-accent">Attacco (facoltativo)</summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field label="Nome"><TextInput value={quick.attack} onChange={(event) => setQuick({ ...quick, attack: event.target.value })} placeholder="Scimitarra" /></Field>
            <Field label="Bonus colpire"><NumberInput value={quick.hitBonus} onChange={(value) => setQuick({ ...quick, hitBonus: value })} placeholder="+4" /></Field>
            <Field label="Danni"><TextInput value={quick.damage} onChange={(event) => setQuick({ ...quick, damage: event.target.value })} placeholder="1d6 + 2" /></Field>
            <Field label="Tipo"><TextInput value={quick.damageType} onChange={(event) => setQuick({ ...quick, damageType: event.target.value })} placeholder="taglienti" /></Field>
          </div>
        </details>
        <div className="flex gap-2"><Button className="flex-1" onClick={() => setQuickOpen(false)}>Annulla</Button><Button tone="primary" className="flex-1" disabled={!quickValid} onClick={addQuick}>Aggiungi</Button></div>
      </div> : <Button onClick={() => setQuickOpen(true)}>+ Nemico rapido</Button>}
    </section>

    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">2 · Iniziativa</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => rollFor((row) => row.isEnemy)}>🎲 Nemici</Button>
        <Button onClick={() => rollFor((row) => !row.isEnemy)}>🎲 Personaggi</Button>
      </div>
      <p className="text-xs text-ink-soft">I dadi tirano solo per chi non ha già un valore; creature uguali condividono un solo tiro. Puoi scrivere i risultati tirati al tavolo.</p>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => <li key={row.key} className={cx("flex items-center gap-2 rounded-xl border bg-surface/80 p-1.5", row.isEnemy ? "border-danger/25" : "border-line/60", !row.include && "opacity-45")}>
          <input type="checkbox" checked={row.include} onChange={() => setExcluded((current) => { const next = new Set(current); if (next.has(row.key)) next.delete(row.key); else next.add(row.key); return next; })} className="size-6 shrink-0 accent-accent" aria-label={`Includi ${row.name}`} />
          <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">{row.name}{row.kind === "nuovo" && <span className="ml-1 text-xs font-normal text-accent">nuovo</span>}</p><p className="text-xs text-ink-soft">{row.isEnemy ? "nemico" : "personaggio"} · {signedNumber(row.bonus)}</p></div>
          <button type="button" className="flex size-10 items-center justify-center rounded-lg text-lg active:bg-parchment" aria-label={`Tira iniziativa per ${row.name}`} onClick={() => setValue(row.key, String(rollDie(20) + row.bonus))}>🎲</button>
          <NumberInput value={row.value} onChange={(value) => setValue(row.key, value)} className="w-16 px-1 text-center text-lg font-bold" aria-label={`Iniziativa di ${row.name}`} />
        </li>)}
      </ul>
    </section>

    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">3 · Ordine dei turni</h3>
      {ranking.length ? <ol className="flex flex-col gap-1">
        {ranking.map((row, index) => {
          const tiedPrev = index > 0 && ranking[index - 1].value === row.value;
          const tiedNext = index < ranking.length - 1 && ranking[index + 1].value === row.value;
          return <li key={row.key} className={cx("flex items-center gap-2 rounded-xl px-2 py-1.5", row.isEnemy ? "bg-danger/8" : "bg-surface/80")}>
            <span className={cx("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", index === 0 ? "bg-accent text-on-accent" : "bg-parchment text-ink")}>{index + 1}</span>
            <span className="min-w-0 flex-1 truncate font-semibold text-ink">{row.name}</span>
            <span className="text-lg font-bold tabular-nums text-ink">{row.value}</span>
            {(tiedPrev || tiedNext) ? <span className="flex flex-col">
              <button type="button" className="h-5 w-7 text-xs text-ink-soft disabled:opacity-25" disabled={!tiedPrev} onClick={() => moveTie(row.key, -1)} aria-label={`Sposta su ${row.name}`}>▲</button>
              <button type="button" className="h-5 w-7 text-xs text-ink-soft disabled:opacity-25" disabled={!tiedNext} onClick={() => moveTie(row.key, 1)} aria-label={`Sposta giù ${row.name}`}>▼</button>
            </span> : <span className="w-7" />}
          </li>;
        })}
      </ol> : <p className="text-sm text-ink-soft">Inserisci o tira l&apos;iniziativa per vedere la classifica.</p>}
      {ranking.some((row, index) => index > 0 && ranking[index - 1].value === row.value) && <p className="text-xs text-ink-soft">Parità: decide il DM per le sue creature e i giocatori tra i personaggi; tra mostro e personaggio decide il DM (p. 23). Usa ▲▼.</p>}
    </section>

    <div className="sticky bottom-0 -mx-4 border-t border-line/50 bg-card px-4 pb-1 pt-3">
      <Button tone="primary" className="min-h-14 w-full text-lg" disabled={pending || !included.length || missing.length > 0} onClick={submit}>
        {missing.length ? `Manca l'iniziativa di ${missing.length}` : encounter ? "Salva ordine" : `⚔ Inizia: round 1 (${included.length})`}
      </Button>
    </div>
  </div>;
}
