"use client";

import Link from "next/link";
import { useState } from "react";
import { abilityModifierValue, creatureAbilityExplanation, creatureActionCategories, signedNumber, type CreatureAction } from "@/lib/creature";
import type { CalculationExplanation } from "@/lib/calculationExplanation";
import { rollDie, rollFormula, type FormulaRoll } from "@/lib/masterRules";
import { removeParticipant } from "../actions";
import { duplicateCreature } from "../creature-actions";
import { ActionStats } from "./ActionStats";
import { CalculationSheet } from "./CharacterPanel";
import { ConcentrationEditor, ConditionsEditor } from "./Conditions";
import { CreatureEditor } from "./CreatureEditor";
import { useMaster } from "./MasterContext";
import type { CreatureView } from "./types";
import { abilityName } from "@/lib/abilityNames";
import { Button, Chip, HpBar, Section, Sheet, Stat, cx, useConfirm } from "@/components/ui";

export function CreaturePanel({ creature, onClose }: { creature: CreatureView | null; onClose: () => void }) {
  const data = creature?.data;
  return <Sheet open={Boolean(creature)} onClose={onClose} wide title={creature?.name ?? ""}
    subtitle={data ? [[data.creatureType, data.size].filter(Boolean).join(" "), data.alignment].filter(Boolean).join(", ") : ""}>
    {creature && <CreatureBody creature={creature} onClose={onClose} />}
  </Sheet>;
}

type Roll = { key: string; d20: number[]; kept: number; total: number; critical: boolean; fumble: boolean; damage: FormulaRoll | null; mode: "normale" | "vantaggio" | "svantaggio" };

function AttackCard({ action, creatureName }: { action: CreatureAction; creatureName: string }) {
  const { data, openPad } = useMaster();
  const [mode, setMode] = useState<Roll["mode"]>("normale");
  const [roll, setRoll] = useState<Roll | null>(null);
  const isAttack = action.attackType.startsWith("Tiro per colpire");
  const isSave = action.attackType === "Tiro salvezza";
  const hasDamage = Boolean(action.damageFormula.trim());

  const attack = () => {
    const d20 = mode === "normale" ? [rollDie(20)] : [rollDie(20), rollDie(20)];
    const kept = mode === "vantaggio" ? Math.max(...d20) : mode === "svantaggio" ? Math.min(...d20) : d20[0];
    const critical = kept === 20;
    setRoll({ key: String(Date.now()), d20, kept, total: kept + action.hitBonus, critical, fumble: kept === 1, damage: hasDamage ? rollFormula(action.damageFormula, critical) : null, mode });
  };
  const damageOnly = () => setRoll({ key: String(Date.now()), d20: [], kept: 0, total: 0, critical: false, fumble: false, damage: rollFormula(action.damageFormula), mode });

  const applyTo = (targetId: string, kind: "pg" | "cr", amount: number, critical: boolean) => openPad({ target: { kind, id: targetId } as { kind: "pg" | "cr"; id: string }, mode: "danni", amount, critical, source: `${creatureName}: ${action.name}${action.damageType ? ` (${action.damageType})` : ""}` });

  const damage = roll?.damage?.total ?? 0;
  const half = Math.floor(damage / 2);
  return <li className="rounded-2xl border border-line/60 bg-surface/80 p-3">
    <p className="mb-1.5 text-[15px] font-bold leading-snug text-ink">{action.name}{action.attackType !== "Altro" && <span className="ml-1.5 text-xs font-medium text-ink-soft">{action.attackType}</span>}</p>
    <ActionStats action={action} />
    {action.description && <p className="mt-1.5 text-sm leading-snug text-ink-soft">{action.description}</p>}
    {(isAttack || isSave || hasDamage) && <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {isAttack && <>
        <div className="flex rounded-xl bg-parchment/70 p-0.5 text-xs font-semibold">
          {(["svantaggio", "normale", "vantaggio"] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} aria-pressed={mode === item}
            className={cx("min-h-9 rounded-lg px-2", mode === item ? "bg-surface text-ink shadow-sm" : "text-ink-soft")}>{item === "normale" ? "Normale" : item === "vantaggio" ? "Vant." : "Svant."}</button>)}
        </div>
        <Button tone="primary" className="min-h-10" onClick={attack}>🎲 Attacca {signedNumber(action.hitBonus)}</Button>
      </>}
      {!isAttack && hasDamage && <Button tone="primary" className="min-h-10" onClick={damageOnly}>🎲 Tira danni</Button>}
    </div>}
    {roll && <div key={roll.key} className="mt-2 flex animate-[fadeIn_.2s_ease-out] flex-col gap-2 rounded-xl bg-parchment/60 p-2.5 text-sm">
      {roll.d20.length > 0 && <p className={cx("text-base", roll.critical ? "font-bold text-heal-strong" : roll.fumble ? "font-bold text-danger-strong" : "text-ink")}>
        Colpire: <strong className="text-xl">{roll.total}</strong> <span className="text-ink-soft">(d20 {roll.d20.length > 1 ? `${roll.d20.join(" / ")} → ${roll.kept}` : roll.kept} {signedNumber(action.hitBonus)})</span>
        {roll.critical && " · 20 naturale: colpo critico"}{roll.fumble && " · 1 naturale: mancato"}
      </p>}
      {roll.d20.length > 0 && !roll.fumble && !roll.critical && <p className="text-xs text-ink-soft">Colpisce CA {roll.total} o inferiore (p. 12).</p>}
      {roll.damage && !roll.fumble && <p className="text-base text-ink">Danni: <strong className="text-xl">{roll.damage.total}</strong> <span className="text-ink-soft">({roll.damage.text}) {action.damageType}{roll.critical ? " · dadi raddoppiati (p. 27)" : ""}</span>{isSave && <span className="text-ink-soft"> · metà: {half} (p. 28)</span>}</p>}
      {action.damageFormula && !rollFormula(action.damageFormula) && <p className="text-xs text-danger-strong">Formula danni non riconosciuta: correggila nella scheda.</p>}
      {roll.damage && !roll.fumble && damage > 0 && <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-ink-soft">Applica a:</span>
        <div className="flex flex-wrap gap-1.5">
          {data.party.filter((member) => member.death !== "morto").map((member) => <Chip key={member.id} onClick={() => applyTo(member.id, "pg", damage, roll.critical)}>{member.name}{member.ac !== null && roll.d20.length > 0 ? ` (CA ${member.ac}${member.ac <= roll.total || roll.critical ? " ✓" : " ✗"})` : ""}</Chip>)}
          {isSave && data.party.filter((member) => member.death !== "morto").map((member) => <Chip key={`h${member.id}`} onClick={() => applyTo(member.id, "pg", half, false)}>{member.name} · metà</Chip>)}
        </div>
      </div>}
    </div>}
  </li>;
}

function CreatureBody({ creature, onClose }: { creature: CreatureView; onClose: () => void }) {
  const { sessionId, run, openPad } = useMaster();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(false);
  const [copies, setCopies] = useState(1);
  const [explain, setExplain] = useState<CalculationExplanation | null>(null);
  const { data } = creature;
  const target = { kind: "cr" as const, id: creature.id };
  const down = data.hitPointsCurrent === 0;
  const grouped = creatureActionCategories.map((category) => ({ ...category, actions: data.actions.map((action, index) => ({ action, index })).filter(({ action }) => (action.category ?? "azione") === category.id) })).filter((group) => group.actions.length);

  return <div className="flex flex-col gap-5">
    <div className="grid grid-cols-4 gap-1.5">
      <Stat label="CA" value={data.armorClass} hint={data.armorClassNote || undefined} />
      <Stat label="Iniz." value={data.initiativeBonus === null || data.initiativeBonus === undefined ? "" : signedNumber(data.initiativeBonus)} />
      <Stat label="Velocità" value={`${String(data.speedMeters).replace(".", ",")} m`} hint={data.speedNote || undefined} />
      <Stat label="GS" value={data.challengeRating || "—"} hint={data.experiencePoints ? `${data.experiencePoints} PE` : undefined} />
    </div>

    <Section title="Punti ferita">
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-bold text-ink">{data.hitPointsCurrent}<span className="text-lg font-semibold text-ink-soft"> / {data.hitPointsMax}</span>{(data.hitPointsTemp ?? 0) > 0 && <span className="ml-2 text-lg font-bold text-temp">+{data.hitPointsTemp}</span>}</p>
        <span className="text-sm font-semibold text-ink-soft">{down ? "☠ A 0 PF" : data.hitPointsFormula}</span>
      </div>
      <HpBar current={data.hitPointsCurrent} max={data.hitPointsMax} temp={data.hitPointsTemp ?? 0} />
      {down && <p className="text-xs text-ink-soft">Un mostro muore a 0 PF; il DM può trattarlo come un personaggio (p. 28).</p>}
      <div className="grid grid-cols-3 gap-2">
        <Button tone="danger" onClick={() => openPad({ target, mode: "danni" })}>− Danno</Button>
        <Button tone="heal" onClick={() => openPad({ target, mode: "guarigione" })}>+ Cura</Button>
        <Button tone="temp" onClick={() => openPad({ target, mode: "pf-temporanei" })}>PF temp</Button>
      </div>
    </Section>

    {grouped.length > 0 ? grouped.map((group) => <Section key={group.id} title={group.label}>
      <ul className="flex flex-col gap-2">{group.actions.map(({ action, index }) => <AttackCard key={`${action.name}-${index}`} action={action} creatureName={creature.name} />)}</ul>
    </Section>) : <Section title="Azioni"><p className="text-sm text-ink-soft">Nessuna azione: aggiungila con «Modifica scheda».</p></Section>}

    {data.traits.length > 0 && <Section title="Tratti">
      <ul className="flex flex-col gap-1.5">{data.traits.map((trait, index) => <li key={index} className="text-[15px] leading-snug text-ink"><strong>{trait.name}.</strong> {trait.description}</li>)}</ul>
    </Section>}

    <ConditionsEditor target={target} conditions={data.conditions ?? []} />
    <ConcentrationEditor target={target} concentration={data.concentration} />

    {data.abilities?.some((ability) => ability.score !== null) && <Section title="Caratteristiche">
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
        {data.abilities.map((ability) => {
          const mod = abilityModifierValue(ability.score);
          return <button key={ability.abbr} type="button" aria-haspopup="dialog" aria-label={`Spiega modificatore e tiro salvezza di ${abilityName(ability.abbr)}`}
            onClick={() => setExplain(creatureAbilityExplanation(ability))}
            className="touch-manipulation rounded-lg bg-surface/60 py-1 text-center transition-colors active:bg-parchment">
            <div className="text-[10px] font-bold text-ink-soft">{abilityName(ability.abbr)}</div>
            <div className="text-sm font-bold text-ink">{ability.score ?? "—"}</div>
            <div className="text-[10px] text-ink-soft underline decoration-line decoration-dotted underline-offset-2">{mod === null ? "" : signedNumber(mod)} · TS {ability.save === null ? (mod === null ? "—" : signedNumber(mod)) : signedNumber(ability.save)}</div>
          </button>;
        })}
      </div>
    </Section>}
    {(data.skills || data.senses || data.languages) && <div className="flex flex-col gap-1 text-sm text-ink">
      {data.skills && <p><strong>Abilità</strong> {data.skills}</p>}
      {data.senses && <p><strong>Sensi</strong> {data.senses}</p>}
      {data.languages && <p><strong>Lingue</strong> {data.languages}</p>}
    </div>}
    {data.notes && <Section title="Note"><p className="whitespace-pre-line text-sm text-ink">{data.notes}</p></Section>}

    <div className="flex flex-col gap-2 border-t border-line/50 pt-3">
      <Button tone="primary" onClick={() => setEditing(true)}>✎ Modifica scheda e attacchi</Button>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-line bg-surface">
          <button type="button" className="min-h-11 w-10 text-lg" onClick={() => setCopies((value) => Math.max(1, value - 1))} aria-label="Meno copie">−</button>
          <span className="w-6 text-center font-bold">{copies}</span>
          <button type="button" className="min-h-11 w-10 text-lg" onClick={() => setCopies((value) => Math.min(20, value + 1))} aria-label="Più copie">+</button>
        </div>
        <Button className="flex-1" onClick={() => run(() => duplicateCreature({ id: creature.id, count: copies, addToSession: true }))}>Duplica nella Sessione</Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/creatura/${creature.id}`} className="inline-flex min-h-11 items-center font-semibold text-accent">Scheda completa ›</Link>
        <Button tone="ghost" className="text-sm text-ink-soft" onClick={async () => {
          if (!await confirm({ title: `Togliere ${creature.name} dalla Sessione?`, message: "La creatura resta nella libreria con i suoi valori attuali.", confirmLabel: "Togli" })) return;
          const result = await run(() => removeParticipant({ sessionId, kind: "cr", id: creature.id }), { quiet: true });
          if (result.ok) onClose();
        }}>Togli dalla Sessione</Button>
      </div>
    </div>
    <CreatureEditor open={editing} creature={creature} onClose={() => setEditing(false)} />
    <CalculationSheet calculation={explain} onClose={() => setExplain(null)} />
  </div>;
}
