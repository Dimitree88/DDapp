"use client";

import Link from "next/link";
import { useState } from "react";
import type { CalculationExplanation } from "@/lib/calculationExplanation";
import { exhaustionEffects, isBloodied, xpProgress } from "@/lib/masterRules";
import { removeParticipant } from "../actions";
import { ConcentrationEditor, ConditionsEditor } from "./Conditions";
import { useMaster } from "./MasterContext";
import type { CharacterView } from "./types";
import { CalculationContent } from "@/components/CalculationContent";
import { Badge, StatTile } from "@/components/StatTile";
import { Button, HpBar, Pips, Section, Sheet, Stat, cx, useConfirm } from "@/components/ui";

// Pannello sovrapposto con la spiegazione di un valore calcolato.
export function CalculationSheet({ calculation, onClose }: { calculation: CalculationExplanation | null; onClose: () => void }) {
  return <Sheet open={Boolean(calculation)} onClose={onClose} title={calculation?.title ?? ""}>
    {calculation && <div className="text-ink"><CalculationContent calculation={calculation} /></div>}
  </Sheet>;
}

// Velocità con l'Indebolimento applicato, aggiunto alla spiegazione registrata.
function speedCalculation(character: CharacterView): CalculationExplanation | undefined {
  const base = character.calc.speed;
  if (!base || !character.exhaustion) return base;
  const speed = speedWithExhaustion(character);
  const reduction = String(exhaustionEffects(character.exhaustion).speedMeters).replace(".", ",");
  return {
    ...base, result: speed.value,
    details: [...base.details, { label: `Indebolimento ${character.exhaustion}`, value: `−${reduction} m` }],
    formula: `${base.formula}; Indebolimento −${reduction} m = ${speed.value} (p. 366)`,
  };
}

export function speedWithExhaustion(character: CharacterView) {
  const base = Number(character.speed);
  if (!character.speed || !Number.isFinite(base)) return { value: character.speed ? `${character.speed} m` : "", hint: undefined };
  if (!character.exhaustion) return { value: `${character.speed.replace(".", ",")} m`, hint: undefined };
  const reduced = Math.max(0, base - exhaustionEffects(character.exhaustion).speedMeters);
  return { value: `${String(reduced).replace(".", ",")} m`, hint: `base ${character.speed.replace(".", ",")}` };
}

export function DeathSaves({ character, compact }: { character: CharacterView; compact?: boolean }) {
  const { command, pending } = useMaster();
  const target = { kind: "pg" as const, id: character.id };
  if (character.hp !== 0 || character.death === "morto") return null;
  if (character.death === "stabile") return <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800">Stabile a 0 PF · privo di sensi · recupera 1 PF dopo 1d4 ore (p. 29)</div>;
  return <div className={cx("flex flex-col gap-2 rounded-2xl border border-red-300 bg-red-50 p-3", compact && "p-2")}>
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="font-bold text-red-900">Tiri contro morte</span>
      <span className="flex items-center gap-3"><span className="flex items-center gap-1 text-emerald-800">✓ <Pips total={3} filled={character.saves.successi} tone="emerald" /></span><span className="flex items-center gap-1 text-red-800">✗ <Pips total={3} filled={character.saves.fallimenti} tone="red" /></span></span>
    </div>
    <div className="grid grid-cols-4 gap-1.5">
      <Button tone="heal" className="px-1 text-sm" disabled={pending} onClick={() => command(target, "tiro-morte", { outcome: "successo" })}>10+</Button>
      <Button tone="danger" className="px-1 text-sm" disabled={pending} onClick={() => command(target, "tiro-morte", { outcome: "fallimento" })}>2–9</Button>
      <Button tone="secondary" className="px-1 text-sm" disabled={pending} onClick={() => command(target, "tiro-morte", { outcome: "uno" })}>1</Button>
      <Button tone="secondary" className="px-1 text-sm" disabled={pending} onClick={() => command(target, "tiro-morte", { outcome: "venti" })}>20</Button>
    </div>
    {!compact && <Button disabled={pending} onClick={() => command(target, "stabilizza")}>Stabilizzato (Medicina CD 10 riuscita)</Button>}
  </div>;
}

export function CharacterPanel({ character, onClose }: { character: CharacterView | null; onClose: () => void }) {
  return <Sheet open={Boolean(character)} onClose={onClose} wide
    title={character?.name ?? ""}
    subtitle={character ? [character.classe && `${character.classe} ${character.livello}`, character.sottoclasse, character.specie].filter(Boolean).join(" · ") : ""}>
    {character && <CharacterBody character={character} onClose={onClose} />}
  </Sheet>;
}

function CharacterBody({ character, onClose }: { character: CharacterView; onClose: () => void }) {
  const { data, sessionId, command, run, openPad, pending } = useMaster();
  const confirm = useConfirm();
  const target = { kind: "pg" as const, id: character.id };
  const speed = speedWithExhaustion(character);
  const xp = xpProgress(character.xp, character.livello);
  const recipients = data.party.filter((member) => member.id !== character.id && !member.inspiration);
  const [transfer, setTransfer] = useState(false);
  const [explain, setExplain] = useState<CalculationExplanation | null>(null);
  const dead = character.death === "morto";
  const show = (calculation: CalculationExplanation | undefined) => calculation ? () => setExplain(calculation) : undefined;

  return <div className="flex flex-col gap-5">
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
      <Stat label="CA" value={character.ac ?? ""} onClick={show(character.calc.armor)} explainLabel="Classe Armatura" />
      <Stat label="Iniz." value={character.initiative} onClick={show(character.calc.initiative)} explainLabel="Iniziativa" />
      <Stat label="Perc. p." value={character.passivePerception} onClick={show(character.calc.passive)} explainLabel="Percezione passiva" />
      <Stat label="Velocità" value={speed.value} hint={speed.hint} onClick={show(speedCalculation(character))} />
      {character.spell && <Stat label="CD inc." value={character.spell.dc} hint={`${character.spell.attack} att.`} onClick={show(character.calc.spellDc)} explainLabel="CD degli incantesimi" />}
    </div>

    {character.attacks.length > 0 && <Section title="Attacchi">
      <ul className="flex flex-col gap-2">
        {character.attacks.map((attack) => <li key={attack.index} className="rounded-2xl border border-line/60 bg-white/80 p-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-ink">{attack.name}</span>
            {attack.mastery && <Badge tone="violet">Padronanza: {attack.mastery}</Badge>}
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            <StatTile icon="hit" label="Colpire" tone="accent" value={attack.attack} ariaLabel={`Spiega il tiro per colpire: ${attack.name}`} onClick={character.calc[`weapon:${attack.index}:attack`] ? () => setExplain(character.calc[`weapon:${attack.index}:attack`]) : undefined} />
            <StatTile icon="damage" label="Danni" tone="red" value={attack.damage} sub={attack.damageType} ariaLabel={`Spiega i danni: ${attack.name}`} onClick={character.calc[`weapon:${attack.index}:damage`] ? () => setExplain(character.calc[`weapon:${attack.index}:damage`]) : undefined} />
            <StatTile icon={attack.range?.label === "Gittata" ? "range" : "reach"} label={attack.range?.label ?? "Portata"} tone="sky" value={attack.range?.value ?? ""} sub={attack.range?.thrown ? `lancio ${attack.range.thrown}` : undefined} size={attack.range?.label === "Gittata" ? "sm" : "md"} ariaLabel={`Spiega la portata: ${attack.name}`} onClick={character.calc[`weapon:${attack.index}:range`] ? () => setExplain(character.calc[`weapon:${attack.index}:range`]) : undefined} />
          </div>
          {attack.warnings.map((warning) => <p key={warning} className="mt-1 text-xs font-semibold text-amber-800">⚠ {warning}</p>)}
        </li>)}
      </ul>
      {character.spell && <div className="grid grid-cols-2 gap-1.5">
        <StatTile icon="save" label="CD incantesimi" tone="accent" value={String(character.spell.dc)} sub={character.spell.ability} onClick={character.calc.spellDc ? () => setExplain(character.calc.spellDc) : undefined} />
        <StatTile icon="hit" label="Attacco magico" tone="accent" value={character.spell.attack} sub={character.spell.ability} onClick={character.calc.spellAttack ? () => setExplain(character.calc.spellAttack) : undefined} />
      </div>}
    </Section>}

    <Section title="Punti ferita">
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-ink">{character.hp ?? "—"}<span className="text-lg font-semibold text-ink-soft"> / {character.calc.maxHp
          ? <button type="button" aria-haspopup="dialog" aria-label="Spiega i punti ferita massimi" onClick={() => setExplain(character.calc.maxHp)} className="touch-manipulation underline decoration-line decoration-dotted underline-offset-4 active:text-accent">{character.hpMax ?? "—"}</button>
          : character.hpMax ?? "—"}</span>{character.temp > 0 && <span className="ml-2 text-lg font-bold text-sky-700">+{character.temp}</span>}</p>
        <span className="text-sm font-semibold text-ink-soft">{dead ? "☠ Morto" : character.hp === 0 ? "Privo di sensi" : character.hp !== null && character.hpMax !== null && isBloodied(character.hp, character.hpMax) ? "Sanguinante" : ""}</span>
      </div>
      <HpBar current={character.hp} max={character.hpMax} temp={character.temp} dead={dead} />
      <div className="grid grid-cols-3 gap-2">
        <Button tone="danger" disabled={dead} onClick={() => openPad({ target, mode: "danni" })}>− Danno</Button>
        <Button tone="heal" disabled={dead} onClick={() => openPad({ target, mode: "guarigione" })}>+ Cura</Button>
        <Button tone="temp" onClick={() => openPad({ target, mode: "pf-temporanei" })}>PF temp</Button>
      </div>
      <DeathSaves character={character} />
    </Section>

    <Section title="Ispirazione eroica">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cx("flex size-11 items-center justify-center rounded-full border-2 text-xl", character.inspiration ? "border-amber-500 bg-amber-400 text-white" : "border-line text-ink-faint")} aria-hidden>★</span>
        <span className="flex-1 text-sm text-ink">{character.inspiration ? "Posseduta" : "Non posseduta"}</span>
        {character.inspiration
          ? <><Button disabled={pending} onClick={() => command(target, "ispirazione-spendi")}>Spesa</Button>{recipients.length > 0 && <Button tone="ghost" onClick={() => setTransfer((value) => !value)}>Nuova → altro PG</Button>}</>
          : <Button tone="primary" disabled={pending} onClick={() => command(target, "ispirazione-conferisci")}>Conferisci</Button>}
      </div>
      {transfer && character.inspiration && <div className="flex flex-col gap-1.5 rounded-xl bg-white/70 p-2">
        <p className="text-xs text-ink-soft">Non si accumula: la nuova concessione può andare a un altro personaggio che ne è privo (p. 13).</p>
        <div className="flex flex-wrap gap-1.5">{recipients.map((member) => <Button key={member.id} disabled={pending} onClick={async () => { const result = await command(target, "ispirazione-trasferisci", { targetId: member.id }); if (result.ok) setTransfer(false); }}>{member.name}</Button>)}</div>
      </div>}
    </Section>

    <ConditionsEditor target={target} conditions={character.conditions} />

    <Section title="Indebolimento">
      <div className="flex items-center gap-3">
        <Button className="w-12 text-xl" disabled={pending || character.exhaustion <= 0} onClick={() => command(target, "indebolimento", { level: character.exhaustion - 1 })} aria-label="Riduci indebolimento">−</Button>
        <span className="w-8 text-center text-2xl font-bold">{character.exhaustion}</span>
        <Button className="w-12 text-xl" disabled={pending || character.exhaustion >= 6} onClick={() => command(target, "indebolimento", { level: character.exhaustion + 1 })} aria-label="Aumenta indebolimento">+</Button>
        <span className="flex-1 text-sm text-ink-soft">{character.exhaustion ? `d20 ${exhaustionEffects(character.exhaustion).d20} · velocità −${String(exhaustionEffects(character.exhaustion).speedMeters).replace(".", ",")} m` : "Nessuno"}{character.exhaustion === 5 && " · a 6 muore"}</span>
      </div>
    </Section>

    <ConcentrationEditor target={target} concentration={character.concentration} />

    {(character.resources.length > 0 || character.slots.length > 0) && <Section title="Risorse e slot">
      <ul className="flex flex-col gap-1.5">
        {character.resources.map((resource, index) => <li key={`${resource.nome}-${index}`} className="flex items-center gap-2 rounded-xl bg-white/80 py-1 pl-3 pr-1">
          <div className="min-w-0 flex-1"><p className="truncate font-semibold text-ink">{resource.nome}</p><p className="flex items-center gap-2 text-xs text-ink-soft"><Pips size="sm" total={resource.massimo} filled={resource.massimo - resource.spesi} /> {resource.massimo - resource.spesi}/{resource.massimo}{resource.ricarica && ` · ${resource.ricarica}`}</p></div>
          <button type="button" className="min-h-10 rounded-lg px-2 text-sm text-ink-soft active:bg-parchment disabled:opacity-40" disabled={pending || resource.spesi <= 0} onClick={() => command(target, "risorsa", { index, delta: -1 })} aria-label={`Ripristina un utilizzo di ${resource.nome}`}>↺</button>
          <Button className="min-h-10 px-3" disabled={pending || resource.spesi >= resource.massimo} onClick={() => command(target, "risorsa", { index, delta: 1 })}>Usa</Button>
        </li>)}
        {character.slots.map((slot) => <li key={slot.level} className="flex items-center gap-2 rounded-xl bg-white/80 py-1 pl-3 pr-1">
          <div className="min-w-0 flex-1"><p className="font-semibold text-ink">Slot {slot.level}° livello</p><p className="flex items-center gap-2 text-xs text-ink-soft"><Pips size="sm" total={slot.maximum} filled={slot.maximum - slot.spent} /> {slot.maximum - slot.spent}/{slot.maximum}</p></div>
          <button type="button" className="min-h-10 rounded-lg px-2 text-sm text-ink-soft active:bg-parchment disabled:opacity-40" disabled={pending || slot.spent <= 0} onClick={() => command(target, "slot", { level: slot.level, delta: -1 })} aria-label={`Ripristina uno slot di ${slot.level}° livello`}>↺</button>
          <Button className="min-h-10 px-3" disabled={pending || slot.spent >= slot.maximum} onClick={() => command(target, "slot", { level: slot.level, delta: 1 })}>Usa</Button>
        </li>)}
      </ul>
    </Section>}

    <Section title="Punti esperienza">
      {xp ? <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-sm"><span><strong className="text-lg text-ink">{xp.xp.toLocaleString("it-IT")}</strong> PE</span><span className="text-ink-soft">{xp.next === null ? "Livello massimo" : `livello ${xp.level + 1} a ${xp.next.toLocaleString("it-IT")}`}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-line/40"><div className="h-full bg-accent" style={{ width: `${xp.ratio * 100}%` }} /></div>
        {xp.ready && <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">PE sufficienti per il livello {xp.level + 1} (p. 41): il giocatore sceglie PF, sottoclasse, talenti e incantesimi dalla propria scheda con «Sali di livello».</p>}
      </div> : <p className="text-sm text-ink-soft">PE o livello da registrare.</p>}
    </Section>

    <Section title="Tiri salvezza e abilità">
      <div className="grid grid-cols-6 gap-1">
        {character.abilities.map((ability) => <button key={ability.abbr} type="button" aria-haspopup="dialog" aria-label={`Spiega il tiro salvezza di ${ability.abbr}`}
          disabled={!character.calc[`save:${ability.abbr}`]} onClick={() => setExplain(character.calc[`save:${ability.abbr}`])}
          className={cx("touch-manipulation rounded-lg py-1 text-center transition-colors active:bg-parchment", ability.proficient ? "bg-accent/10" : "bg-white/60")}>
          <div className="text-[11px] font-bold text-ink-soft">{ability.abbr}</div>
          <div className="text-sm font-bold text-ink underline decoration-line decoration-dotted underline-offset-2">{ability.save || "—"}</div>
          <div className="text-[10px] text-ink-faint">{ability.score || "—"}</div>
        </button>)}
      </div>
      {character.skills.length > 0 && <div className="flex flex-wrap gap-1.5">
        {character.skills.map((skill) => <button key={skill.nome} type="button" aria-haspopup="dialog" aria-label={`Spiega il bonus di ${skill.nome}`}
          disabled={!character.calc[`skill:${skill.nome}`]} onClick={() => setExplain(character.calc[`skill:${skill.nome}`])}
          className="min-h-9 touch-manipulation rounded-full border border-line/70 bg-white/70 px-3 text-sm text-ink active:bg-parchment">
          {skill.nome.charAt(0)}{skill.nome.slice(1).toLocaleLowerCase("it")} <strong>{skill.bonus}</strong>{skill.maestria ? " ★" : ""}
        </button>)}
      </div>}
      {character.languages.length > 0 && <p className="text-sm text-ink-soft">Lingue: {character.languages.join(", ")}</p>}
    </Section>
    <CalculationSheet calculation={explain} onClose={() => setExplain(null)} />

    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/50 pt-3">
      <Link href={`/personaggio/${character.id}`} className="inline-flex min-h-11 items-center font-semibold text-accent">Apri scheda completa ›</Link>
      <Button tone="ghost" className="text-sm text-ink-soft" onClick={async () => {
        if (!await confirm({ title: `Togliere ${character.name} dalla Sessione?`, message: "La scheda e gli eventi già registrati restano invariati. Potrai aggiungerlo di nuovo dal menu.", confirmLabel: "Togli" })) return;
        const result = await run(() => removeParticipant({ sessionId, kind: "pg", id: character.id }), { quiet: true });
        if (result.ok) onClose();
      }}>Togli dalla Sessione</Button>
    </div>
  </div>;
}
