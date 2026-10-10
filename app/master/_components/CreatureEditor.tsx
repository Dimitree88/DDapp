"use client";

import { useState } from "react";
import {
  averageDamage, creatureAbilityAbbrs, creatureActionCategories, creatureAttackTypes, creatureSizes, emptyCreature, normalizeCreature,
  type CreatureActionCategory, type CreatureData,
} from "@/lib/creature";
import type { ActionResult } from "@/lib/masterCommand";
import { deleteCreature, saveCreature } from "../creature-actions";
import type { CreatureView } from "./types";
import { abilityName } from "@/lib/abilityNames";
import { Button, Field, Section, Sheet, TextInput, cx, useConfirm, useToast } from "@/components/ui";

type ActionDraft = {
  name: string; category: CreatureActionCategory; attackType: string; hitBonus: string; reachMeters: string; range: string;
  saveDc: string; saveAbility: string; hitDamage: string; damageFormula: string; damageType: string; description: string;
};
type Draft = {
  name: string; description: string; creatureType: string; size: string; alignment: string;
  armorClass: string; armorClassNote: string; hitPointsMax: string; hitPointsCurrent: string; hitPointsFormula: string;
  initiativeBonus: string; speedMeters: string; speedNote: string; challengeRating: string; experiencePoints: string; proficiencyBonus: string;
  abilities: { abbr: string; score: string; save: string }[]; skills: string; senses: string; languages: string;
  traits: { name: string; description: string }[]; actions: ActionDraft[]; notes: string;
};

const str = (value: number | null | undefined) => value === null || value === undefined ? "" : String(value).replace(".", ",");

function toDraft(name: string, data: CreatureData): Draft {
  return {
    name, description: data.description, creatureType: data.creatureType, size: data.size, alignment: data.alignment ?? "",
    armorClass: str(data.armorClass), armorClassNote: data.armorClassNote, hitPointsMax: str(data.hitPointsMax), hitPointsCurrent: str(data.hitPointsCurrent),
    hitPointsFormula: data.hitPointsFormula ?? "", initiativeBonus: str(data.initiativeBonus), speedMeters: str(data.speedMeters), speedNote: data.speedNote ?? "",
    challengeRating: data.challengeRating, experiencePoints: str(data.experiencePoints), proficiencyBonus: str(data.proficiencyBonus),
    abilities: (data.abilities ?? []).map((ability) => ({ abbr: ability.abbr, score: str(ability.score), save: str(ability.save) })),
    skills: data.skills ?? "", senses: data.senses ?? "", languages: data.languages ?? "",
    traits: data.traits.map((trait) => ({ name: trait.name, description: trait.description })),
    actions: data.actions.map((action) => ({
      name: action.name, category: action.category ?? "azione", attackType: action.attackType, hitBonus: str(action.hitBonus), reachMeters: str(action.reachMeters),
      range: action.range ?? "", saveDc: str(action.saveDc), saveAbility: action.saveAbility ?? "", hitDamage: str(action.hitDamage),
      damageFormula: action.damageFormula, damageType: action.damageType, description: action.description ?? "",
    })),
    notes: data.notes ?? "",
  };
}

function fromDraft(draft: Draft, base: CreatureData): CreatureData {
  const num = (value: string) => value.trim().replace(",", ".");
  return normalizeCreature({
    ...base,
    description: draft.description, creatureType: draft.creatureType, size: draft.size, alignment: draft.alignment,
    armorClass: num(draft.armorClass), armorClassNote: draft.armorClassNote,
    hitPointsMax: num(draft.hitPointsMax), hitPointsCurrent: draft.hitPointsCurrent.trim() === "" ? num(draft.hitPointsMax) : num(draft.hitPointsCurrent), hitPointsFormula: draft.hitPointsFormula,
    initiativeBonus: num(draft.initiativeBonus), speedMeters: num(draft.speedMeters), speedNote: draft.speedNote,
    challengeRating: draft.challengeRating, experiencePoints: num(draft.experiencePoints), proficiencyBonus: num(draft.proficiencyBonus),
    abilities: draft.abilities.map((ability) => ({ abbr: ability.abbr, score: num(ability.score), save: num(ability.save) })),
    skills: draft.skills, senses: draft.senses, languages: draft.languages,
    traits: draft.traits.map((trait) => ({ ...trait, adjudication: "master" })),
    actions: draft.actions.map((action) => ({
      ...action, hitBonus: num(action.hitBonus), reachMeters: action.reachMeters.trim() === "" ? null : num(action.reachMeters),
      saveDc: num(action.saveDc), hitDamage: action.hitDamage.trim() === "" ? averageDamage(action.damageFormula) ?? 0 : num(action.hitDamage),
    })),
    notes: draft.notes,
  } as unknown as Partial<CreatureData>);
}

const blankAction = (): ActionDraft => ({ name: "", category: "azione", attackType: creatureAttackTypes[0], hitBonus: "", reachMeters: "1,5", range: "", saveDc: "", saveAbility: "", hitDamage: "", damageFormula: "", damageType: "", description: "" });

export function CreatureEditor({ open, creature, onClose, onSaved, addToSession }: { open: boolean; creature: CreatureView | null; onClose: () => void; onSaved?: (id: string) => void; addToSession?: boolean }) {
  return <Sheet open={open} onClose={onClose} wide title={creature ? `Modifica ${creature.name}` : "Nuova creatura"} subtitle="Valori della scheda delle statistiche (p. 346)">
    {open && <EditorBody key={creature?.id ?? "nuova"} creature={creature} onClose={onClose} onSaved={onSaved} addToSession={addToSession} />}
  </Sheet>;
}

function EditorBody({ creature, onClose, onSaved, addToSession }: { creature: CreatureView | null; onClose: () => void; onSaved?: (id: string) => void; addToSession?: boolean }) {
  const base = creature?.data ?? emptyCreature();
  const [draft, setDraft] = useState<Draft>(() => creature ? toDraft(creature.name, base) : { ...toDraft("", base), armorClass: "", hitPointsMax: "", hitPointsCurrent: "", speedMeters: "9" });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const setAction = (index: number, patch: Partial<ActionDraft>) => setDraft((current) => ({ ...current, actions: current.actions.map((action, i) => i === index ? { ...action, ...patch } : action) }));
  const moveAction = (index: number, delta: number) => setDraft((current) => {
    const actions = [...current.actions];
    const target = index + delta;
    if (target < 0 || target >= actions.length) return current;
    [actions[index], actions[target]] = [actions[target], actions[index]];
    return { ...current, actions };
  });

  const save = async () => {
    setSaving(true);
    let result: ActionResult;
    try { result = await saveCreature({ id: creature?.id ?? null, name: draft.name, data: fromDraft(draft, base), addToSession }); }
    catch { result = { ok: false, error: "Connessione non riuscita: riprova." }; }
    setSaving(false);
    if (!result.ok) { toast.show({ tone: "error", title: result.error }); return; }
    toast.show({ tone: "ok", title: creature ? "Creatura aggiornata" : "Creatura creata" });
    if (result.id) onSaved?.(result.id);
    onClose();
  };

  const remove = async () => {
    if (!creature || !await confirm({ title: `Eliminare ${creature.name}?`, message: "La creatura sparisce dalla libreria e da ogni Sessione. Gli eventi già registrati restano con il suo nome. Non si può annullare.", confirmLabel: "Elimina", danger: true })) return;
    const result = await deleteCreature({ id: creature.id }).catch(() => ({ ok: false as const, error: "Connessione non riuscita: riprova." }));
    if (!result.ok) { toast.show({ tone: "error", title: result.error }); return; }
    toast.show({ tone: "ok", title: "Creatura eliminata" });
    onClose();
  };

  const field = (key: keyof Draft, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, className?: string) =>
    <Field label={label} className={className}><TextInput {...props} value={draft[key] as string} onChange={(event) => set(key, event.target.value as never)} /></Field>;
  const numeric = { inputMode: "decimal" as const };

  return <div className="flex flex-col gap-6 pb-2">
    <Section title="Identità">
      {field("name", "Nome *", { placeholder: "Es. Goblin", autoFocus: !creature })}
      <div className="grid grid-cols-2 gap-2">
        {field("creatureType", "Tipo", { placeholder: "Es. Bestia" })}
        <Field label="Taglia"><select value={draft.size} onChange={(event) => set("size", event.target.value)} className="min-h-11 rounded-xl border border-line bg-surface px-2 text-base text-ink">
          {[...new Set([...creatureSizes, draft.size].filter(Boolean))].map((size) => <option key={size}>{size}</option>)}
        </select></Field>
      </div>
      {field("alignment", "Allineamento", { placeholder: "Es. senza allineamento" })}
      {field("description", "Descrizione breve")}
    </Section>

    <Section title="Difesa e movimento">
      <div className="grid grid-cols-3 gap-2">
        {field("armorClass", "CA", { ...numeric, placeholder: "10" })}
        {field("armorClassNote", "Nota CA", { placeholder: "armatura naturale" }, "col-span-2")}
        {field("hitPointsMax", "PF max *", { ...numeric, placeholder: "11" })}
        {field("hitPointsCurrent", "PF attuali", { ...numeric, placeholder: draft.hitPointsMax || "= max" })}
        {field("hitPointsFormula", "Formula PF", { placeholder: "2d10 + 6" })}
        {field("initiativeBonus", "Iniziativa", { placeholder: "+0" })}
        {field("speedMeters", "Velocità (m)", numeric)}
        {field("speedNote", "Altre velocità", { placeholder: "scalata 9 m" })}
        {field("challengeRating", "GS", { placeholder: "1/4" })}
        {field("experiencePoints", "PE", numeric)}
        {field("proficiencyBonus", "BC", { placeholder: "+2" })}
      </div>
    </Section>

    <Section title="Caratteristiche">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {draft.abilities.map((ability, index) => <div key={ability.abbr} className="flex flex-col gap-1 rounded-xl bg-surface/60 p-1.5">
          <span className="text-center text-xs font-bold text-ink-soft">{abilityName(creatureAbilityAbbrs[index])}</span>
          <TextInput inputMode="numeric" aria-label={`Punteggio ${abilityName(ability.abbr)}`} placeholder="10" value={ability.score} className="px-1 text-center" onChange={(event) => set("abilities", draft.abilities.map((item, i) => i === index ? { ...item, score: event.target.value } : item))} />
          <TextInput aria-label={`Tiro salvezza ${abilityName(ability.abbr)}`} placeholder="TS" value={ability.save} className="px-1 text-center text-sm" onChange={(event) => set("abilities", draft.abilities.map((item, i) => i === index ? { ...item, save: event.target.value } : item))} />
        </div>)}
      </div>
      <p className="text-xs text-ink-soft">TS vuoto = uguale al modificatore.</p>
      {field("skills", "Abilità", { placeholder: "Percezione +2, Furtività +4" })}
      {field("senses", "Sensi", { placeholder: "Percezione passiva 12, scurovisione 18 m" })}
      {field("languages", "Lingue", { placeholder: "nessuna" })}
    </Section>

    <Section title="Azioni e attacchi" action={<Button tone="ghost" onClick={() => set("actions", [...draft.actions, blankAction()])}>+ Aggiungi</Button>}>
      {draft.actions.length === 0 && <p className="text-sm text-ink-soft">Nessuna azione.</p>}
      {draft.actions.map((action, index) => {
        const attack = action.attackType.startsWith("Tiro per colpire");
        const save = action.attackType === "Tiro salvezza";
        const average = averageDamage(action.damageFormula);
        return <div key={index} className="flex flex-col gap-2 rounded-2xl border border-line/70 bg-surface/70 p-3">
          <div className="flex items-end gap-2">
            <Field label="Nome" className="flex-1"><TextInput value={action.name} placeholder="Es. Morso" onChange={(event) => setAction(index, { name: event.target.value })} /></Field>
            <button type="button" className="min-h-11 w-9 rounded-lg text-ink-soft active:bg-parchment disabled:opacity-30" disabled={index === 0} onClick={() => moveAction(index, -1)} aria-label="Sposta su">↑</button>
            <button type="button" className="min-h-11 w-9 rounded-lg text-ink-soft active:bg-parchment disabled:opacity-30" disabled={index === draft.actions.length - 1} onClick={() => moveAction(index, 1)} aria-label="Sposta giù">↓</button>
            <button type="button" className="min-h-11 w-9 rounded-lg text-danger-strong active:bg-danger/8" onClick={() => set("actions", draft.actions.filter((_, i) => i !== index))} aria-label={`Elimina ${action.name || "azione"}`}>✕</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Categoria"><select value={action.category} onChange={(event) => setAction(index, { category: event.target.value as CreatureActionCategory })} className="min-h-11 rounded-xl border border-line bg-surface px-2 text-base">
              {creatureActionCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
            </select></Field>
            <Field label="Tipo"><select value={action.attackType} onChange={(event) => setAction(index, { attackType: event.target.value })} className="min-h-11 rounded-xl border border-line bg-surface px-2 text-base">
              {[...new Set([...creatureAttackTypes, action.attackType])].map((type) => <option key={type} value={type}>{type.replace("Tiro per colpire ", "Attacco ")}</option>)}
            </select></Field>
          </div>
          {attack && <div className="grid grid-cols-3 gap-2">
            <Field label="Bonus colpire"><TextInput value={action.hitBonus} placeholder="+4" onChange={(event) => setAction(index, { hitBonus: event.target.value })} /></Field>
            <Field label="Portata (m)"><TextInput inputMode="decimal" value={action.reachMeters} placeholder="1,5" onChange={(event) => setAction(index, { reachMeters: event.target.value })} /></Field>
            <Field label="Gittata"><TextInput value={action.range} placeholder="24/96 m" onChange={(event) => setAction(index, { range: event.target.value })} /></Field>
          </div>}
          {save && <div className="grid grid-cols-3 gap-2">
            <Field label="CD"><TextInput inputMode="numeric" value={action.saveDc} placeholder="13" onChange={(event) => setAction(index, { saveDc: event.target.value })} /></Field>
            <Field label="Caratteristica"><select value={action.saveAbility} onChange={(event) => setAction(index, { saveAbility: event.target.value })} className="min-h-11 rounded-xl border border-line bg-surface px-2 text-base">
              <option value="">—</option>{["Forza", "Destrezza", "Costituzione", "Intelligenza", "Saggezza", "Carisma"].map((ability) => <option key={ability}>{ability}</option>)}
            </select></Field>
            <Field label="Area/gittata"><TextInput value={action.range} placeholder="cono 4,5 m" onChange={(event) => setAction(index, { range: event.target.value })} /></Field>
          </div>}
          <div className="grid grid-cols-3 gap-2">
            <Field label="Formula danni"><TextInput value={action.damageFormula} placeholder="1d6 + 3" onChange={(event) => setAction(index, { damageFormula: event.target.value })}
              className={cx(action.damageFormula && average === null && "border-danger/70")} /></Field>
            <Field label="Media"><TextInput inputMode="numeric" value={action.hitDamage} placeholder={average === null ? "" : String(average)} onChange={(event) => setAction(index, { hitDamage: event.target.value })} /></Field>
            <Field label="Tipo danni"><TextInput value={action.damageType} placeholder="taglienti" onChange={(event) => setAction(index, { damageType: event.target.value })} /></Field>
          </div>
          <Field label="Effetti aggiuntivi"><textarea value={action.description} rows={2} placeholder="Es. il bersaglio cade prono" onChange={(event) => setAction(index, { description: event.target.value })} className="rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink" /></Field>
        </div>;
      })}
      {draft.actions.length > 0 && <Button tone="ghost" onClick={() => set("actions", [...draft.actions, blankAction()])}>+ Aggiungi azione</Button>}
    </Section>

    <Section title="Tratti" action={<Button tone="ghost" onClick={() => set("traits", [...draft.traits, { name: "", description: "" }])}>+ Aggiungi</Button>}>
      {draft.traits.map((trait, index) => <div key={index} className="flex flex-col gap-2 rounded-2xl border border-line/70 bg-surface/70 p-3">
        <div className="flex items-end gap-2">
          <Field label="Nome" className="flex-1"><TextInput value={trait.name} onChange={(event) => set("traits", draft.traits.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /></Field>
          <button type="button" className="min-h-11 w-9 rounded-lg text-danger-strong active:bg-danger/8" onClick={() => set("traits", draft.traits.filter((_, i) => i !== index))} aria-label={`Elimina ${trait.name || "tratto"}`}>✕</button>
        </div>
        <textarea value={trait.description} rows={3} aria-label="Descrizione del tratto" onChange={(event) => set("traits", draft.traits.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} className="rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink" />
      </div>)}
    </Section>

    <Section title="Note del Master">
      <textarea value={draft.notes} rows={3} aria-label="Note del Master" onChange={(event) => set("notes", event.target.value)} className="rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink" />
    </Section>

    <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line/50 bg-card px-4 pb-1 pt-3">
      {creature && <Button tone="ghost" className="text-danger-strong" onClick={remove}>Elimina</Button>}
      <Button className="flex-1" onClick={onClose}>Annulla</Button>
      <Button tone="primary" className="flex-1" disabled={saving || !draft.name.trim() || !/^\d+$/.test(draft.hitPointsMax.trim()) || Number(draft.hitPointsMax) < 1} onClick={save}>{saving ? "Salvo…" : "Salva"}</Button>
    </div>
  </div>;
}
