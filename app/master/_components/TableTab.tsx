"use client";

import { startTransition, useOptimistic, useState } from "react";
import { signedNumber } from "@/lib/creature";
import { isBloodied } from "@/lib/masterRules";
import { saveEncounter } from "../actions";
import { endCombat } from "../combat-actions";
import { ActionBadges } from "./ActionStats";
import { DeathSaves } from "./CharacterPanel";
import { CombatSetup } from "./CombatSetup";
import { useMaster } from "./MasterContext";
import type { CharacterView, CreatureView, Encounter, Target } from "./types";
import { Button, HpBar, Sheet, cx, useToast } from "@/components/ui";

type Combatant = { target: Target; name: string; initiative: number | null; character?: CharacterView; creature?: CreatureView };

const isOut = (item: Combatant) => item.character ? item.character.death === "morto" : (item.creature?.data.hitPointsCurrent ?? 1) === 0;

function StatusTags({ conditions, exhaustion, concentration, extra }: { conditions: { nome: string }[]; exhaustion?: number; concentration?: { effetto: string } | null; extra?: string[] }) {
  const tags = [...(extra ?? []), ...[...new Set(conditions.map((item) => item.nome))], ...(exhaustion ? [`Indeb. ${exhaustion}`] : [])];
  if (!tags.length && !concentration) return null;
  return <div className="flex flex-wrap gap-1">
    {tags.map((tag) => <span key={tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-strong">{tag}</span>)}
    {concentration && <span className="max-w-full truncate rounded-full bg-magic/12 px-2 py-0.5 text-xs font-semibold text-magic-ink">◎ {concentration.effetto}</span>}
  </div>;
}

function HpButtons({ target, disabled }: { target: Target; disabled?: boolean }) {
  const { openPad } = useMaster();
  return <div className="flex shrink-0 gap-1.5" onClick={(event) => event.stopPropagation()}>
    <button type="button" disabled={disabled} onClick={() => openPad({ target, mode: "danni" })} aria-label="Danno"
      className="flex size-11 items-center justify-center rounded-xl bg-danger text-2xl font-bold text-on-accent active:bg-danger-strong disabled:opacity-40">−</button>
    <button type="button" disabled={disabled} onClick={() => openPad({ target, mode: "guarigione" })} aria-label="Cura"
      className="flex size-11 items-center justify-center rounded-xl bg-heal text-2xl font-bold text-on-accent active:bg-heal-strong disabled:opacity-40">+</button>
  </div>;
}

function InitiativeBadge({ value, current }: { value: number | null; current?: boolean }) {
  if (value === null) return null;
  return <span className={cx("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", current ? "bg-accent text-on-accent" : "bg-parchment text-ink")} aria-label={`Iniziativa ${value}`}>{value}</span>;
}

function CharacterRow({ item, current }: { item: Combatant; current?: boolean }) {
  const { openPanel } = useMaster();
  const character = item.character!;
  const dead = character.death === "morto";
  const status = dead ? "☠ Morto" : character.hp === 0 ? (character.death === "stabile" ? "Stabile" : "A 0 PF") : character.hp !== null && character.hpMax !== null && isBloodied(character.hp, character.hpMax) ? "Sanguinante" : "";
  return <article onClick={() => openPanel(item.target)} className={cx("flex min-w-0 cursor-pointer flex-col gap-2 rounded-2xl border bg-card/90 p-3 shadow-sm transition-colors active:bg-card", current ? "border-accent ring-2 ring-accent/60" : "border-line/70", dead && "opacity-60")}>
    <div className="flex items-start gap-2.5">
      <InitiativeBadge value={item.initiative} current={current} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[17px] font-bold leading-tight text-heading">{character.name}{character.inspiration && <span className="ml-1.5 text-warn" aria-label="Ispirazione eroica">★</span>}</h3>
        {character.levelReady && <span className="mt-0.5 inline-block rounded-full bg-warn/45 px-2.5 py-0.5 text-xs font-bold text-warn-ink">⬆ Livello {Number(character.livello) + 1} pronto</span>}
        <p className="truncate text-xs text-ink-soft">{[character.classe && `${character.classe} ${character.livello}`, character.passivePerception && `PP ${character.passivePerception}`, character.initiative && `Iniz ${character.initiative}`].filter(Boolean).join(" · ")}</p>
      </div>
      <span className="flex shrink-0 flex-col items-center rounded-lg border border-line/70 bg-surface/70 px-2 py-0.5 leading-tight"><span className="text-[10px] font-bold text-ink-soft">CA</span><span className="font-bold text-ink">{character.ac ?? "—"}</span></span>
    </div>
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
          <span><strong className="text-lg text-ink">{character.hp ?? "—"}</strong><span className="text-ink-soft">/{character.hpMax ?? "—"}</span>{character.temp > 0 && <strong className="ml-1 text-temp">+{character.temp}</strong>}</span>
          {status && <span className={cx("text-xs font-semibold", character.hp === 0 ? "text-danger-strong" : "text-warn-strong")}>{status}</span>}
        </div>
        <HpBar current={character.hp} max={character.hpMax} temp={character.temp} dead={dead} />
      </div>
      <HpButtons target={item.target} disabled={dead || character.hp === null} />
    </div>
    <StatusTags conditions={character.conditions.filter((condition) => !(condition.nome === "Privo di sensi" && character.hp === 0))} exhaustion={character.exhaustion} concentration={character.concentration} />
    {character.hp === 0 && character.death === "tiri" && <div onClick={(event) => event.stopPropagation()}>
      {current && <p className="mb-1 text-xs font-semibold text-danger-strong">Inizia il turno a 0 PF: tiro salvezza contro morte (p. 29)</p>}
      <DeathSaves character={character} compact />
    </div>}
  </article>;
}

function CreatureRow({ item, current }: { item: Combatant; current?: boolean }) {
  const { openPanel } = useMaster();
  const creature = item.creature!;
  const { data } = creature;
  const down = data.hitPointsCurrent === 0;
  const first = data.actions[0];
  return <article onClick={() => openPanel(item.target)} className={cx("flex min-w-0 cursor-pointer flex-col gap-2 rounded-2xl border bg-card/90 p-3 shadow-sm transition-colors active:bg-card", current ? "border-accent ring-2 ring-accent/60" : "border-line/70", down && "opacity-60")}>
    <div className="flex items-start gap-2.5">
      <InitiativeBadge value={item.initiative} current={current} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[17px] font-bold leading-tight text-heading">{creature.name}</h3>
        <p className="truncate text-xs text-ink-soft">{[data.creatureType, data.challengeRating && `GS ${data.challengeRating}`, data.initiativeBonus !== null && data.initiativeBonus !== undefined && `Iniz ${signedNumber(data.initiativeBonus)}`].filter(Boolean).join(" · ")}</p>
      </div>
      <span className="flex shrink-0 flex-col items-center rounded-lg border border-line/70 bg-surface/70 px-2 py-0.5 leading-tight"><span className="text-[10px] font-bold text-ink-soft">CA</span><span className="font-bold text-ink">{data.armorClass}</span></span>
    </div>
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
          <span><strong className="text-lg text-ink">{data.hitPointsCurrent}</strong><span className="text-ink-soft">/{data.hitPointsMax}</span>{(data.hitPointsTemp ?? 0) > 0 && <strong className="ml-1 text-temp">+{data.hitPointsTemp}</strong>}</span>
          {down ? <span className="text-xs font-semibold text-danger-strong">☠ A 0 PF</span> : isBloodied(data.hitPointsCurrent, data.hitPointsMax) ? <span className="text-xs font-semibold text-warn-strong">Sanguinante</span> : null}
        </div>
        <HpBar current={data.hitPointsCurrent} max={data.hitPointsMax} temp={data.hitPointsTemp ?? 0} />
      </div>
      <HpButtons target={item.target} />
    </div>
    <StatusTags conditions={data.conditions ?? []} concentration={data.concentration} />
    {first && !down && <ActionBadges action={first} />}
  </article>;
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-2xl border border-line/60 bg-card/90 px-1 text-xs font-semibold text-ink shadow-sm active:bg-card">
    <span className="text-xl" aria-hidden>{icon}</span>{label}
  </button>;
}

function Row({ item, current }: { item: Combatant; current?: boolean }) {
  return item.character ? <CharacterRow item={item} current={current} /> : <CreatureRow item={item} current={current} />;
}

// --- Fine del combattimento --------------------------------------------

function EndCombatSheet({ open, onClose, defeated }: { open: boolean; onClose: () => void; defeated: CreatureView[] }) {
  return <Sheet open={open} onClose={onClose} title="Fine combattimento">{open && <EndCombatBody onClose={onClose} defeated={defeated} />}</Sheet>;
}

function EndCombatBody({ onClose, defeated }: { onClose: () => void; defeated: CreatureView[] }) {
  const { sessionId, run, pending, openTool } = useMaster();
  const [remove, setRemove] = useState(true);
  const xp = defeated.reduce((sum, item) => sum + item.data.experiencePoints, 0);
  const finish = async () => {
    const result = await run(() => endCombat({ sessionId, removeDefeated: remove }), { quiet: true });
    if (!result.ok) return;
    onClose();
    if (xp > 0) openTool({ kind: "pe", xp: { amount: xp, reason: `Combattimento: ${defeated.map((item) => item.name).join(", ")}` } });
  };
  return <div className="flex flex-col gap-3">
    {defeated.length ? <div className="rounded-2xl bg-surface/75 p-3">
      <p className="mb-1 font-bold text-ink">Nemici sconfitti</p>
      <ul className="text-sm text-ink">{defeated.map((item) => <li key={item.id} className="flex justify-between gap-2"><span>{item.name}</span><span className="text-ink-soft">{item.data.experiencePoints} PE</span></li>)}</ul>
      <p className="mt-2 border-t border-line/50 pt-2 text-sm font-semibold">Totale: {xp} PE</p>
    </div> : <p className="text-sm text-ink-soft">Nessun nemico a 0 PF.</p>}
    {defeated.length > 0 && <label className="flex items-start gap-3 rounded-xl bg-surface/70 p-3 text-sm text-ink">
      <input type="checkbox" checked={remove} onChange={(event) => setRemove(event.target.checked)} className="mt-0.5 size-6 shrink-0 accent-accent" />
      <span>Togli dalla Sessione i nemici sconfitti. Quelli creati per lo scontro vengono eliminati; i modelli restano in libreria.</span>
    </label>}
    <p className="text-xs text-ink-soft">Round e ordine d&apos;iniziativa si azzerano; PF e stati restano.{xp > 0 ? " Poi potrai assegnare i PE." : ""}</p>
    <Button tone="primary" className="min-h-14 text-lg" disabled={pending} onClick={finish}>{xp > 0 ? "Termina e assegna PE" : "Termina combattimento"}</Button>
  </div>;
}

// --- Scheda Tavolo ----------------------------------------------------

export function TableTab() {
  const { data, sessionId, openTool } = useMaster();
  const toast = useToast();
  const [encounter, setEncounter] = useOptimistic(data.session!.encounter);
  const [setupOpen, setSetupOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const combatants: Combatant[] = [
    ...data.party.map((character) => ({ target: { kind: "pg" as const, id: character.id }, name: character.name, initiative: null, character })),
    ...data.foes.map((creature) => ({ target: { kind: "cr" as const, id: creature.id }, name: creature.name, initiative: null, creature })),
  ];
  const find = (kind: string, id: string) => combatants.find((item) => item.target.kind === kind && item.target.id === id);
  const ordered = encounter ? encounter.order.flatMap((entry) => { const item = find(entry.kind, entry.id); return item ? [{ ...item, initiative: entry.initiative }] : []; }) : [];
  const outside = encounter ? combatants.filter((item) => !ordered.some((entry) => entry.target.kind === item.target.kind && entry.target.id === item.target.id)) : combatants;
  const turn = encounter ? Math.min(encounter.turn, Math.max(0, ordered.length - 1)) : 0;

  const persist = (next: Encounter | null) => startTransition(async () => {
    setEncounter(next);
    const result = await saveEncounter({ sessionId, encounter: next }).catch(() => ({ ok: false as const, error: "Connessione non riuscita: riprova." }));
    if (!result.ok) toast.show({ tone: "error", title: result.error });
  });

  const step = (delta: 1 | -1) => {
    if (!encounter || !ordered.length) return;
    let index = turn;
    let round = encounter.round;
    for (let attempts = 0; attempts < ordered.length; attempts += 1) {
      index += delta;
      if (index >= ordered.length) { index = 0; round += 1; }
      if (index < 0) { index = ordered.length - 1; round = Math.max(1, round - 1); }
      if (!isOut(ordered[index])) break;
    }
    persist({ round, turn: index, order: ordered.map((item) => ({ kind: item.target.kind, id: item.target.id, initiative: item.initiative ?? 0 })) });
  };

  const current = ordered[turn];
  const party = outside.filter((item) => item.character);
  const foes = outside.filter((item) => item.creature);

  return <div className="flex flex-col gap-4 pb-4">
    {encounter ? <section className="sticky top-[60px] z-20 -mx-4 flex items-center gap-2 border-b border-line/60 bg-parchment/95 px-4 py-2 backdrop-blur">
      <div className="min-w-0 flex-1">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-accent">Round {encounter.round}</p>
        <p className="truncate text-sm font-semibold text-ink">Turno di {current?.name ?? "—"}</p>
      </div>
      <Button className="w-11 px-0" onClick={() => step(-1)} aria-label="Turno precedente">‹</Button>
      <Button tone="primary" onClick={() => step(1)}>Prossimo ›</Button>
    </section> : <Button tone="primary" className="min-h-14 text-lg" disabled={!data.party.length && !data.foes.length && !data.library.length} onClick={() => setSetupOpen(true)}>⚔ Combattimento</Button>}
    <div className="grid grid-cols-4 gap-1.5">
      <QuickAction icon="💥" label="Più bersagli" onClick={() => openTool({ kind: "gruppo" })} />
      <QuickAction icon="☕" label="Riposo breve" onClick={() => openTool({ kind: "riposo-breve" })} />
      <QuickAction icon="☾" label="Dormire" onClick={() => openTool({ kind: "riposo-lungo" })} />
      <QuickAction icon="✦" label="PE" onClick={() => openTool({ kind: "pe" })} />
    </div>

    {encounter && <ol className="grid grid-cols-1 items-start gap-2.5 md:grid-cols-2">{ordered.map((item, index) => <li key={`${item.target.kind}:${item.target.id}`}><Row item={item} current={index === turn} /></li>)}</ol>}
    {encounter && <div className="flex gap-2">
      <Button className="flex-1" onClick={() => setSetupOpen(true)}>+ Nemici / ordine</Button>
      <Button className="flex-1" onClick={() => setEndOpen(true)}>Termina combattimento</Button>
    </div>}

    {party.length > 0 && <section className="flex flex-col gap-2">
      {encounter && <h2 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Fuori dal combattimento</h2>}
      {!encounter && <h2 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Personaggi</h2>}
      <div className="grid grid-cols-1 items-start gap-2.5 md:grid-cols-2">{party.map((item) => <Row key={item.target.id} item={item} />)}</div>
    </section>}
    {foes.length > 0 && <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">{encounter && !party.length ? "Fuori dal combattimento" : "Creature"}</h2>
      <div className="grid grid-cols-1 items-start gap-2.5 md:grid-cols-2">{foes.map((item) => <Row key={item.target.id} item={item} />)}</div>
    </section>}
    {!combatants.length && <p className="rounded-2xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">Nessun partecipante. Aggiungili dal menu «Altro».</p>}

    <CombatSetup open={setupOpen} onClose={() => setSetupOpen(false)} encounter={encounter} />
    <EndCombatSheet open={endOpen} onClose={() => setEndOpen(false)} defeated={ordered.flatMap((item) => item.creature && item.creature.data.hitPointsCurrent === 0 ? [item.creature] : [])} />
  </div>;
}
