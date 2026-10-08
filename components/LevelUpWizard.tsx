"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import type { FeatOption, LevelFeature, LevelUpChoices, LevelUpPlan, SpellOption, SummaryItem } from "@/lib/levelUp";
import { rollDie } from "@/lib/masterRules";
import type { Sheet as CharacterSheet } from "@/lib/sheet";
import { confirmLevelUp, prepareLevelUp, spellDescription } from "@/app/level-actions";
import { DiceText } from "./DiceText";
import { Button, Chip, Field, Sheet, TextInput, cx } from "./ui";

const ABILITIES: Record<string, string> = { FOR: "Forza", DES: "Destrezza", COS: "Costituzione", INT: "Intelligenza", SAG: "Saggezza", CAR: "Carisma" };
const pretty = (skill: string) => skill.charAt(0) + skill.slice(1).toLocaleLowerCase("it");

type Step = "inizio" | "pf" | "sottoclasse" | "talento" | "abilita" | "incantesimi" | "padronanze" | "privilegi" | "riepilogo";
const stepTitles: Record<Step, string> = {
  inizio: "Nuovo livello", pf: "Punti ferita", sottoclasse: "Sottoclasse", talento: "Talento", abilita: "Abilità e lingue",
  incantesimi: "Incantesimi", padronanze: "Padronanze d'armi", privilegi: "Nuovi privilegi", riepilogo: "Conferma",
};

export function LevelUpWizard({ characterId, open, onClose, onLeveled, onSaved, scores }: {
  characterId: string | null;
  open: boolean;
  onClose: () => void;
  onLeveled?: (level: number) => void;
  onSaved?: (sheet: CharacterSheet) => void;
  scores?: Record<string, number>;
}) {
  return <Sheet open={open && Boolean(characterId)} onClose={onClose} wide title="Passaggio di livello">
    {open && characterId && <WizardBody key={characterId} characterId={characterId} onClose={onClose} onLeveled={onLeveled} onSaved={onSaved} scores={scores} />}
  </Sheet>;
}

function WizardBody({ characterId, onClose, onLeveled, onSaved, scores }: { characterId: string; onClose: () => void; onLeveled?: (level: number) => void; onSaved?: (sheet: CharacterSheet) => void; scores?: Record<string, number> }) {
  const [plan, setPlan] = useState<LevelUpPlan | null>(null);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState(0);
  const [choices, setChoices] = useState<LevelUpChoices>({ hp: { method: "fisso" } });
  const [belowXp, setBelowXp] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ level: number; summary: SummaryItem[] } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    prepareLevelUp(characterId).then((response) => {
      if (!alive) return;
      if (response.ok) setPlan(response.plan); else setLoadError(response.error);
    }).catch(() => alive && setLoadError("Connessione non riuscita: riprova."));
    return () => { alive = false; };
  }, [characterId]);

  const steps = ((): Step[] => {
    if (!plan) return [];
    const list: Step[] = ["inizio", "pf"];
    if (plan.subclass.required) list.push("sottoclasse");
    if (plan.feat) list.push("talento");
    if (plan.expertise || plan.languages) list.push("abilita");
    const subclass = plan.subclass.required ? choices.subclass ?? "" : plan.subclass.current;
    const s = plan.spells;
    if (s && (s.cantrips.needed || s.prepared.needed || s.book || s.arcanum || s.cantrips.canReplace || s.prepared.canReplace || s.alwaysPrepared[subclass]?.length)) list.push("incantesimi");
    if (plan.mastery) list.push("padronanze");
    list.push("privilegi", "riepilogo");
    return list;
  })();

  if (loadError) return <div className="flex flex-col gap-3"><p className="rounded-xl bg-red-50 px-3 py-2 text-red-900">{loadError}</p><Button onClick={onClose}>Chiudi</Button></div>;
  if (!plan) return <p className="py-8 text-center text-ink-soft">Preparo il passaggio di livello…</p>;
  if (result) return <Done plan={plan} result={result} onClose={() => { onLeveled?.(result.level); onClose(); }} />;

  const current = steps[Math.min(step, steps.length - 1)];
  const subclass = plan.subclass.required ? choices.subclass ?? "" : plan.subclass.current;
  const set = (patch: Partial<LevelUpChoices>) => setChoices((value) => ({ ...value, ...patch }));
  const valid = stepValid(current, plan, choices, belowXp, scores);
  const last = step >= steps.length - 1;

  const submit = () => startTransition(async () => {
    setError("");
    const response = await confirmLevelUp({ characterId, fromLevel: plan.from, choices }).catch(() => ({ ok: false as const, error: "Connessione non riuscita: riprova." }));
    if (response.ok) {
      setResult({ level: response.level, summary: response.summary });
      onSaved?.(response.sheet);
    } else setError(response.error);
  });

  return <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-accent">{plan.characterName} · {plan.classe}</p>
        <h3 className="text-xl font-bold text-ink">Livello {plan.from} → {plan.to}</h3>
      </div>
      <span className="text-sm text-ink-soft">{step + 1}/{steps.length}</span>
    </div>
    <ol className="flex gap-1" aria-label="Avanzamento">
      {steps.map((item, index) => <li key={item} className={cx("h-1.5 flex-1 rounded-full", index <= step ? "bg-accent" : "bg-line/50")} title={stepTitles[item]} />)}
    </ol>
    <h4 className="text-lg font-bold text-ink">{stepTitles[current]}</h4>

    {current === "inizio" && <Intro plan={plan} belowXp={belowXp} setBelowXp={setBelowXp} />}
    {current === "pf" && <HitPoints plan={plan} choices={choices} set={set} />}
    {current === "sottoclasse" && <SubclassStep plan={plan} value={choices.subclass} onChange={(value) => set({ subclass: value })} />}
    {current === "talento" && <FeatStep plan={plan} choices={choices} set={set} scores={scores} />}
    {current === "abilita" && <SkillsStep plan={plan} choices={choices} set={set} />}
    {current === "incantesimi" && <SpellsStep plan={plan} subclass={subclass} choices={choices} set={set} />}
    {current === "padronanze" && plan.mastery && <Picker label={`Scegli ${Math.min(plan.mastery.needed, plan.mastery.options.length)}`} options={plan.mastery.options} max={plan.mastery.needed} value={choices.masteries ?? []} onChange={(value) => set({ masteries: value })} hint={plan.mastery.current.length ? `Già scelte: ${plan.mastery.current.join(", ")}` : undefined} />}
    {current === "privilegi" && <FeaturesStep plan={plan} subclass={subclass} choices={choices} set={set} />}
    {current === "riepilogo" && <Review plan={plan} subclass={subclass} choices={choices} />}

    {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">{error}</p>}
    <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line/50 bg-card px-4 pb-1 pt-3">
      {step > 0 ? <Button className="flex-1" onClick={() => setStep(step - 1)}>‹ Indietro</Button> : <Button className="flex-1" onClick={onClose}>Annulla</Button>}
      {last
        ? <Button tone="primary" className="flex-[2]" disabled={pending || !valid} onClick={submit}>{pending ? "Salvo…" : `Conferma livello ${plan.to}`}</Button>
        : <Button tone="primary" className="flex-[2]" disabled={!valid} onClick={() => { setStep(step + 1); setError(""); }}>Avanti ›</Button>}
    </div>
  </div>;
}

function stepValid(step: Step, plan: LevelUpPlan, choices: LevelUpChoices, belowXp: boolean, scores?: Record<string, number>): boolean {
  if (step === "inizio") return plan.xp !== null && plan.xp >= plan.xpNeeded || belowXp;
  if (step === "pf") return choices.hp.method === "fisso" || Number.isInteger(Number(choices.hp.roll)) && Number(choices.hp.roll) >= 1 && Number(choices.hp.roll) <= plan.hitDie;
  if (step === "sottoclasse") return Boolean(choices.subclass);
  if (step === "talento" && plan.feat) {
    if (choices.feat?.alternative) return (choices.feat.cantrips ?? []).length === 2;
    const option = plan.feat.options.find((item) => item.name === choices.feat?.name);
    if (!option) return false;
    const increases = Object.values(choices.feat?.increases ?? {}).filter((value) => value > 0);
    const total = increases.reduce((sum, value) => sum + value, 0);
    const capped = Object.entries(choices.feat?.increases ?? {}).every(([abbr, value]) => !value || (scores?.[abbr] ?? 0) + value <= option.increase.cap);
    if (option.increase.kind === "asi") return total === 2 && capped;
    if (option.increase.kind === "plus1" || option.increase.kind === "resiliente") return total === 1 && capped;
    return true;
  }
  if (step === "abilita") {
    const expertise = plan.expertise ? (choices.expertise ?? []).length === Math.min(plan.expertise.count, plan.expertise.options.length) : true;
    const languages = plan.languages ? (choices.languages ?? []).length === plan.languages.count : true;
    return expertise && languages;
  }
  if (step === "incantesimi" && plan.spells) {
    const s = plan.spells;
    const ok = (list: string[] | undefined, needed: number, available: number) => (list ?? []).length === Math.min(needed, available);
    const preparedAvailable = s.prepared.fromBook ? s.prepared.options.length + (choices.book ?? []).length : s.prepared.options.length;
    return ok(choices.cantrips, s.cantrips.needed, s.cantrips.options.length)
      && (!s.book || ok(choices.book, s.book.needed, s.book.options.length))
      && ok(choices.prepared, s.prepared.needed, preparedAvailable)
      && (!s.arcanum || Boolean(choices.arcanum))
      && (!choices.replaceCantrip || Boolean(choices.replaceCantrip.from && choices.replaceCantrip.to))
      && (!choices.replacePrepared || Boolean(choices.replacePrepared.from && choices.replacePrepared.to));
  }
  if (step === "padronanze" && plan.mastery) return (choices.masteries ?? []).length === Math.min(plan.mastery.needed, plan.mastery.options.length);
  return true;
}

// --- Passi --------------------------------------------------------------

function Box({ title, children, tone }: { title?: string; children: ReactNode; tone?: "warn" | "info" }) {
  return <div className={cx("rounded-2xl p-3 text-sm", tone === "warn" ? "bg-amber-100 text-amber-950" : "bg-white/75 text-ink")}>
    {title && <p className="mb-1 font-bold">{title}</p>}{children}
  </div>;
}

function Intro({ plan, belowXp, setBelowXp }: { plan: LevelUpPlan; belowXp: boolean; setBelowXp: (value: boolean) => void }) {
  const enough = plan.xp !== null && plan.xp >= plan.xpNeeded;
  const features = plan.classFeatures.filter((item) => !/^sottoclasse d/i.test(item.name));
  return <div className="flex flex-col gap-3">
    <Box>
      <p>PE: <strong>{plan.xp ?? "da registrare"}</strong> · soglia del livello {plan.to}: <strong>{plan.xpNeeded.toLocaleString("it-IT")}</strong> (p. 41)</p>
      {plan.proficiency.before !== plan.proficiency.after && <p>Bonus di competenza: {plan.proficiency.before} → <strong>{plan.proficiency.after}</strong></p>}
      {plan.slots.after.join("/") !== plan.slots.before.join("/") && <p>Slot incantesimo: {plan.slots.before.join("/") || "—"} → <strong>{plan.slots.after.join("/")}</strong></p>}
      {plan.columns.map((column) => <p key={column.name}>{column.name}: {column.before || "—"} → <strong>{column.after}</strong></p>)}
    </Box>
    {!enough && <Box tone="warn" title="PE sotto la soglia">
      <label className="mt-1 flex items-start gap-2"><input type="checkbox" checked={belowXp} onChange={(event) => setBelowXp(event.target.checked)} className="mt-0.5 size-5 accent-accent" />
        <span>Procedi comunque: il gruppo ha deciso di salire di livello. I PE non vengono modificati.</span></label>
    </Box>}
    <Box title="Cosa ottieni">
      <ul className="list-inside list-disc">
        <li>Un Dado Vita (d{plan.hitDie}) e i relativi punti ferita</li>
        {plan.subclass.required && <li>La sottoclasse: da scegliere</li>}
        {features.map((item) => <li key={item.id}>{item.name}{item.detail ? ` (${item.detail})` : ""}</li>)}
        {plan.subclass.current && (plan.subclassFeatures[plan.subclass.current] ?? []).map((item) => <li key={item.id}>{item.name} ({plan.subclass.current})</li>)}
      </ul>
    </Box>
  </div>;
}

function HitPoints({ plan, choices, set }: { plan: LevelUpPlan; choices: LevelUpChoices; set: (patch: Partial<LevelUpChoices>) => void }) {
  const base = choices.hp.method === "fisso" ? plan.fixedGain : Number(choices.hp.roll || 0);
  const gain = Math.max(1, base + plan.conMod);
  const bonus = plan.hpBonus.reduce((sum, item) => sum + item.value, 0);
  return <div className="flex flex-col gap-3">
    <p className="text-sm text-ink-soft">Tira il Dado Vita e aggiungi il modificatore di Costituzione (minimo 1), oppure usa il valore fisso della classe (p. 42).</p>
    <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={() => set({ hp: { method: "fisso" } })} className={cx("flex min-h-24 flex-col items-center justify-center rounded-2xl border-2 p-2", choices.hp.method === "fisso" ? "border-accent bg-accent/10" : "border-line bg-white/70")}>
        <span className="text-sm font-semibold text-ink-soft">Valore fisso</span><span className="text-3xl font-bold text-ink">{plan.fixedGain}</span>
      </button>
      <button type="button" onClick={() => set({ hp: { method: "tiro", roll: choices.hp.method === "tiro" && choices.hp.roll ? choices.hp.roll : rollDie(plan.hitDie) } })} className={cx("flex min-h-24 flex-col items-center justify-center rounded-2xl border-2 p-2", choices.hp.method === "tiro" ? "border-accent bg-accent/10" : "border-line bg-white/70")}>
        <span className="text-sm font-semibold text-ink-soft">🎲 Tira d{plan.hitDie}</span><span className="text-3xl font-bold text-ink">{choices.hp.method === "tiro" ? choices.hp.roll : "?"}</span>
      </button>
    </div>
    {choices.hp.method === "tiro" && <div className="flex items-end gap-2">
      <Field label="Risultato del dado (anche tirato al tavolo)" className="flex-1"><TextInput inputMode="numeric" value={choices.hp.roll ? String(choices.hp.roll) : ""} onChange={(event) => set({ hp: { method: "tiro", roll: Number(event.target.value.replace(/\D/g, "")) || undefined } })} /></Field>
      <Button onClick={() => set({ hp: { method: "tiro", roll: rollDie(plan.hitDie) } })}>Ritira</Button>
    </div>}
    <Box>
      <p>{base || "?"} {plan.conMod >= 0 ? "+" : "−"} {Math.abs(plan.conMod)} COS = <strong>{gain}</strong> PF{bonus ? ` + ${bonus} (${plan.hpBonus.map((item) => item.source).join(", ")})` : ""}</p>
      {plan.hpMaxBefore !== null && <p>PF massimi: {plan.hpMaxBefore} → <strong>{plan.hpMaxBefore + gain + bonus}</strong>{plan.feat ? " (prima di eventuali aumenti di Costituzione)" : ""}</p>}
      <p className="text-ink-soft">I PF attuali non cambiano: salire di livello non cura (pp. 27, 42).</p>
    </Box>
  </div>;
}

function FeatureCard({ feature, children }: { feature: LevelFeature; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div className="rounded-2xl border border-line/60 bg-white/80 p-3">
    <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-2 text-left">
      <span className="font-bold text-ink">{feature.name}{feature.detail ? ` (${feature.detail})` : ""}</span>
      <span className="shrink-0 text-xs text-ink-soft">{feature.page ? `p. ${feature.page}` : ""} {open ? "▲" : "▼"}</span>
    </button>
    {open && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{feature.text || "Testo non disponibile."}</p>}
    {children}
  </div>;
}

function SubclassStep({ plan, value, onChange }: { plan: LevelUpPlan; value?: string; onChange: (value: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return <div className="flex flex-col gap-2">
    {plan.subclass.options.map((option) => <div key={option.name} className={cx("rounded-2xl border-2 p-3", value === option.name ? "border-accent bg-accent/10" : "border-line/60 bg-white/80")}>
      <button type="button" onClick={() => onChange(option.name)} className="flex w-full items-center gap-3 text-left">
        <span className={cx("flex size-6 shrink-0 items-center justify-center rounded-full border-2", value === option.name ? "border-accent bg-accent text-white" : "border-line")}>{value === option.name ? "✓" : ""}</span>
        <span className="flex-1"><span className="block font-bold text-ink">{option.name}</span><span className="text-xs text-ink-soft">{option.features.map((item) => item.name).join(" · ")}{option.page ? ` · p. ${option.page}` : ""}</span></span>
      </button>
      <button type="button" onClick={() => setExpanded(expanded === option.name ? null : option.name)} className="mt-1 text-sm font-semibold text-accent">{expanded === option.name ? "Nascondi" : "Leggi"}</button>
      {expanded === option.name && <div className="mt-2 flex flex-col gap-2 text-sm text-ink">
        <p className="whitespace-pre-line">{option.summary}</p>
        {option.features.map((feature) => <FeatureCard key={feature.id} feature={feature} />)}
      </div>}
    </div>)}
  </div>;
}

function FeatStep({ plan, choices, set, scores }: { plan: LevelUpPlan; choices: LevelUpChoices; set: (patch: Partial<LevelUpChoices>) => void; scores?: Record<string, number> }) {
  const feat = plan.feat!;
  const [query, setQuery] = useState("");
  const selected = feat.options.find((item) => item.name === choices.feat?.name);
  const alternative = Boolean(choices.feat?.alternative);
  const fold = (text: string) => text.toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = feat.options.filter((item) => !query || fold(item.name).includes(fold(query)) || fold(item.text).includes(fold(query)));
  const choose = (option: FeatOption) => set({ feat: { name: option.name, increases: {}, notes: "" } });
  return <div className="flex flex-col gap-3">
    <p className="text-sm text-ink-soft">{feat.reason === "asi" ? "Aumento dei punteggi di caratteristica oppure un altro talento di cui hai i prerequisiti (p. 203)." : feat.reason === "epico" ? "Un Dono epico oppure un altro talento di cui hai i prerequisiti." : "Un talento Stile di Combattimento."}</p>
    {feat.alternative && <div className="grid grid-cols-2 gap-1 rounded-2xl bg-parchment/70 p-1">
      <button type="button" onClick={() => set({ feat: { name: choices.feat?.name, increases: choices.feat?.increases, alternative: false } })} className={cx("min-h-11 rounded-xl text-sm font-bold", !alternative ? "bg-accent text-white" : "text-ink")}>Talento</button>
      <button type="button" onClick={() => set({ feat: { alternative: true, cantrips: [] } })} className={cx("min-h-11 rounded-xl text-sm font-bold", alternative ? "bg-accent text-white" : "text-ink")}>{feat.alternative.name}</button>
    </div>}
    {alternative && feat.alternative ? <SpellPicker label={`Due trucchetti da ${feat.alternative.list} (caratteristica ${feat.alternative.ability})`} options={feat.alternative.options} max={2} value={choices.feat?.cantrips ?? []} onChange={(value) => set({ feat: { alternative: true, cantrips: value } })} /> : <>
      {selected ? <div className="rounded-2xl border-2 border-accent bg-accent/5 p-3">
        <div className="flex items-start justify-between gap-2"><div><p className="font-bold text-ink">{selected.name}</p><p className="text-xs text-ink-soft">{selected.category}{selected.page ? ` · p. ${selected.page}` : ""}</p></div><Button tone="ghost" className="min-h-9 px-2 text-sm" onClick={() => set({ feat: {} })}>Cambia</Button></div>
        <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-line text-sm text-ink">{selected.text}</p>
        <Increase option={selected} value={choices.feat?.increases ?? {}} scores={scores} onChange={(increases) => set({ feat: { ...choices.feat, increases } })} />
        {selected.increase.kind !== "asi" && <Field label="Altre scelte del talento (se previste)" className="mt-3"><TextInput value={choices.feat?.notes ?? ""} onChange={(event) => set({ feat: { ...choices.feat, notes: event.target.value } })} placeholder="Es. abilità, incantesimi, tipo di danno" /></Field>}
      </div> : <>
        <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca talento…" aria-label="Cerca talento" />
        <ul className="flex max-h-[45dvh] flex-col gap-1.5 overflow-y-auto">
          {filtered.map((option) => <li key={option.name}><button type="button" onClick={() => choose(option)} className="flex w-full flex-col rounded-xl bg-white/80 px-3 py-2 text-left active:bg-white">
            <span className="font-semibold text-ink">{option.name}</span>
            <span className="text-xs text-ink-soft">{option.category}{option.increase.kind === "asi" ? " · +2 o +1/+1" : option.increase.kind !== "none" ? ` · +1 ${option.increase.abilities.length === 6 ? "a scelta" : option.increase.abilities.join("/")}` : ""}</span>
          </button></li>)}
        </ul>
      </>}
    </>}
  </div>;
}

function Increase({ option, value, onChange, scores }: { option: FeatOption; value: Record<string, number>; onChange: (value: Record<string, number>) => void; scores?: Record<string, number> }) {
  if (option.increase.kind === "none") return null;
  const total = Object.values(value).reduce((sum, item) => sum + item, 0);
  const max = option.increase.kind === "asi" ? 2 : 1;
  return <div className="mt-3 flex flex-col gap-2">
    <p className="text-sm font-semibold text-ink">{option.increase.kind === "asi" ? "+2 a una caratteristica o +1 a due" : option.increase.kind === "resiliente" ? "+1 a una caratteristica senza competenza nel tiro salvezza (ottieni la competenza)" : "+1 a una caratteristica"} · massimo {option.increase.cap}</p>
    <div className="grid grid-cols-3 gap-1.5">
      {option.increase.abilities.map((abbr) => {
        const current = value[abbr] ?? 0;
        const score = scores?.[abbr];
        const blocked = score !== undefined && score + current + 1 > option.increase.cap;
        return <div key={abbr} className={cx("flex flex-col items-center rounded-xl border p-1.5", current ? "border-accent bg-accent/10" : "border-line bg-white/70")}>
          <span className="text-xs font-bold text-ink-soft">{abbr}</span>
          <span className="text-sm text-ink">{score ?? "—"}{current ? <strong className="text-accent"> → {(score ?? 0) + current}</strong> : null}</span>
          <div className="mt-1 flex gap-1">
            <button type="button" className="h-8 w-8 rounded-lg border border-line text-lg disabled:opacity-30" disabled={!current} onClick={() => onChange({ ...value, [abbr]: current - 1 })} aria-label={`Togli 1 a ${ABILITIES[abbr]}`}>−</button>
            <button type="button" className="h-8 w-8 rounded-lg border border-line text-lg disabled:opacity-30" disabled={total >= max || blocked || (option.increase.kind === "asi" && current >= 2)} onClick={() => onChange(option.increase.kind === "asi" ? { ...value, [abbr]: current + 1 } : { [abbr]: 1 })} aria-label={`Aggiungi 1 a ${ABILITIES[abbr]}`}>+</button>
          </div>
        </div>;
      })}
    </div>
  </div>;
}

function Picker({ label, options, max, value, onChange, hint, render }: { label: string; options: string[]; max: number; value: string[]; onChange: (value: string[]) => void; hint?: string; render?: (item: string) => string }) {
  return <div className="flex flex-col gap-2">
    <p className="text-sm font-semibold text-ink">{label} <span className="text-ink-soft">({value.length}/{Math.min(max, options.length)})</span></p>
    {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    <div className="flex flex-wrap gap-1.5">
      {options.map((item) => <Chip key={item} active={value.includes(item)} disabled={!value.includes(item) && value.length >= max} onClick={() => onChange(value.includes(item) ? value.filter((entry) => entry !== item) : [...value, item])}>{render ? render(item) : item}</Chip>)}
    </div>
    {!options.length && <p className="text-sm text-ink-soft">Nessuna opzione disponibile.</p>}
  </div>;
}

function SkillsStep({ plan, choices, set }: { plan: LevelUpPlan; choices: LevelUpChoices; set: (patch: Partial<LevelUpChoices>) => void }) {
  return <div className="flex flex-col gap-4">
    {plan.expertise && <Picker label={`${plan.expertise.source}: maestria in ${plan.expertise.count === 1 ? "un'abilità" : `${plan.expertise.count} abilità`} in cui hai competenza`} options={plan.expertise.options} max={plan.expertise.count} value={choices.expertise ?? []} onChange={(value) => set({ expertise: value })} render={pretty} />}
    {plan.languages && <Picker label={`${plan.languages.source}: ${plan.languages.count} lingue`} options={plan.languages.options} max={plan.languages.count} value={choices.languages ?? []} onChange={(value) => set({ languages: value })} />}
  </div>;
}

// Testi degli incantesimi già scaricati in questa pagina.
const descriptions = new Map<string, { text: string; page?: number } | null>();

function spellMeta(item: SpellOption) {
  return [item.level === 0 ? "Trucchetto" : `${item.level}° livello`, item.school, item.time && `Lancio: ${item.time}`, item.range && `Gittata: ${item.range}`, item.duration && `Durata: ${item.duration}`]
    .filter(Boolean).join(" · ");
}

function SpellDescription({ item }: { item: SpellOption }) {
  const [state, setState] = useState<{ text: string; page?: number } | null | "loading">(() => descriptions.has(item.name) ? descriptions.get(item.name)! : "loading");
  useEffect(() => {
    if (descriptions.has(item.name)) return;
    let alive = true;
    spellDescription(item.name).then((result) => { descriptions.set(item.name, result); if (alive) setState(result); }).catch(() => alive && setState(null));
    return () => { alive = false; };
  }, [item.name]);
  return <div className="mt-2 rounded-xl bg-parchment/60 p-3 text-sm leading-relaxed text-ink">
    {item.components && <p className="text-xs text-ink-soft">Componenti: {item.components}</p>}
    {(item.concentration || item.ritual) && <p className="text-xs font-semibold text-accent">{[item.concentration && "Concentrazione", item.ritual && "Rituale"].filter(Boolean).join(" · ")}</p>}
    {state === "loading" ? <p className="mt-1 text-ink-soft">Carico la descrizione…</p>
      : state ? <><p className="mt-1 whitespace-pre-line"><DiceText text={state.text} /></p>{state.page && <p className="mt-2 text-xs text-ink-soft">Manuale del Giocatore 2024, p. {state.page}</p>}</>
      : <p className="mt-1 text-ink-soft">Descrizione non disponibile.</p>}
  </div>;
}

function SpellRow({ item, selected, disabled, onToggle }: { item: SpellOption; selected: boolean; disabled: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  return <li className={cx("rounded-xl border p-2", selected ? "border-accent bg-accent/10" : "border-line/60 bg-white/80", disabled && !selected && "opacity-50")}>
    <div className="flex items-start gap-2">
      <button type="button" onClick={onToggle} disabled={disabled && !selected} aria-pressed={selected} aria-label={`${selected ? "Togli" : "Scegli"} ${item.name}`}
        className={cx("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-bold", selected ? "border-accent bg-accent text-white" : "border-line bg-white")}>{selected ? "✓" : ""}</button>
      <button type="button" onClick={() => setOpen(!open)} className="min-w-0 flex-1 text-left" aria-expanded={open}>
        <span className="block font-semibold text-ink">{item.name}{item.concentration && <span className="ml-1 text-xs text-accent">C</span>}{item.ritual && <span className="ml-1 text-xs text-accent">R</span>}</span>
        <span className="block text-xs text-ink-soft">{spellMeta(item)}</span>
      </button>
      <button type="button" onClick={() => setOpen(!open)} className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-accent active:bg-parchment" aria-label={`Descrizione di ${item.name}`}>{open ? "Chiudi" : "ⓘ Leggi"}</button>
    </div>
    {open && <SpellDescription item={item} />}
  </li>;
}

function SpellPicker({ label, options, max, value, onChange, exclude = [] }: { label: string; options: SpellOption[]; max: number; value: string[]; onChange: (value: string[]) => void; exclude?: string[] }) {
  const [query, setQuery] = useState("");
  const fold = (text: string) => text.toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const list = options.filter((item) => !exclude.includes(item.name) && (!query || fold(item.name).includes(fold(query)) || fold(item.school ?? "").includes(fold(query))));
  const levels = [...new Set(list.map((item) => item.level))];
  const limit = Math.min(max, options.length);
  const toggle = (name: string) => onChange(value.includes(name) ? value.filter((entry) => entry !== name) : [...value, name]);
  return <div className="flex flex-col gap-2 rounded-2xl bg-white/60 p-3">
    <p className="text-sm font-semibold text-ink">{label} <span className={cx(value.length === limit ? "text-emerald-700" : "text-ink-soft")}>({value.length}/{limit})</span></p>
    {value.length > 0 && <div className="flex flex-wrap gap-1.5">{value.map((name) => <Chip key={name} active onClick={() => toggle(name)}>{name} ✕</Chip>)}</div>}
    <p className="text-xs text-ink-soft">Tocca il nome per leggere cosa fa; tocca il quadrato per sceglierlo.</p>
    {options.length > 6 && <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca per nome o scuola…" aria-label="Cerca incantesimo" />}
    <div className="flex max-h-[45dvh] flex-col gap-2 overflow-y-auto">
      {levels.map((level) => <div key={level}>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-soft">{level === 0 ? "Trucchetti" : `${level}° livello`}</p>
        <ul className="flex flex-col gap-1.5">{list.filter((item) => item.level === level).map((item) => <SpellRow key={item.name} item={item} selected={value.includes(item.name)} disabled={value.length >= max} onToggle={() => toggle(item.name)} />)}</ul>
      </div>)}
      {!list.length && <p className="text-sm text-ink-soft">Nessun incantesimo disponibile.</p>}
    </div>
  </div>;
}

function Replace({ label, from, to, onChange }: { label: string; from: string[]; to: SpellOption[]; onChange: (value: { from: string; to: string } | null) => void }) {
  const [state, setState] = useState<{ from: string; to: string } | null>(null);
  const update = (next: { from: string; to: string } | null) => { setState(next); onChange(next); };
  const chosen = to.find((item) => item.name === state?.to);
  return <div className="flex flex-col gap-2 rounded-2xl bg-white/60 p-3">
    <label className="flex items-center gap-2 text-sm font-semibold text-ink"><input type="checkbox" checked={Boolean(state)} onChange={(event) => update(event.target.checked ? { from: "", to: "" } : null)} className="size-5 accent-accent" />{label} (facoltativo)</label>
    {state && <>
      <select value={state.from} onChange={(event) => update({ ...state, from: event.target.value })} className="min-h-11 rounded-xl border border-line bg-white px-2 text-base" aria-label="Da sostituire"><option value="">Togli…</option>{from.map((name) => <option key={name}>{name}</option>)}</select>
      <SpellPicker label="Con" options={to} max={1} value={state.to ? [state.to] : []} onChange={(value) => update({ ...state, to: value[0] ?? "" })} />
      {chosen && <p className="text-xs text-ink-soft">Scelto: {chosen.name} ({spellMeta(chosen)})</p>}
    </>}
  </div>;
}

function SpellsStep({ plan, subclass, choices, set }: { plan: LevelUpPlan; subclass: string; choices: LevelUpChoices; set: (patch: Partial<LevelUpChoices>) => void }) {
  const s = plan.spells!;
  const book = s.book ? (choices.book ?? []).flatMap((name) => s.book!.options.filter((item) => item.name === name)) : [];
  const preparedOptions = s.prepared.fromBook ? [...s.prepared.options, ...book] : s.prepared.options;
  const taken = [...(choices.cantrips ?? []), ...(choices.prepared ?? []), ...(choices.book ?? [])];
  return <div className="flex flex-col gap-3">
    <p className="text-sm text-ink-soft">Incantesimi fino al {s.maxLevel}° livello. Lista: {s.lists.join(", ")}.</p>
    {(s.alwaysPrepared[subclass] ?? []).length > 0 && <Box title={`Sempre preparati (${subclass})`}>{s.alwaysPrepared[subclass].join(", ")} — aggiunti automaticamente, non contano nei preparati.</Box>}
    {s.cantrips.needed > 0 && <SpellPicker label="Nuovi trucchetti" options={s.cantrips.options} max={s.cantrips.needed} value={choices.cantrips ?? []} onChange={(value) => set({ cantrips: value })} />}
    {s.book && <SpellPicker label="Due incantesimi da aggiungere al libro (p. 112)" options={s.book.options} max={s.book.needed} value={choices.book ?? []} onChange={(value) => set({ book: value, prepared: (choices.prepared ?? []).filter((name) => !(choices.book ?? []).includes(name) || value.includes(name)) })} />}
    {s.prepared.needed > 0 && <SpellPicker label={s.prepared.fromBook ? `Incantesimi da preparare dal libro (lista ${s.prepared.current} → ${s.prepared.target})` : `Nuovi incantesimi preparati (lista ${s.prepared.current} → ${s.prepared.target})`} options={preparedOptions} max={s.prepared.needed} value={choices.prepared ?? []} onChange={(value) => set({ prepared: value })} />}
    {s.arcanum && <SpellPicker label={`Arcanum mistico: un incantesimo di ${s.arcanum.level}° livello`} options={s.arcanum.options} max={1} value={choices.arcanum ? [choices.arcanum] : []} onChange={(value) => set({ arcanum: value[0] })} />}
    {s.cantrips.canReplace && <Replace label="Sostituisci un trucchetto" from={s.cantrips.known} to={s.cantrips.options.filter((item) => !taken.includes(item.name))} onChange={(value) => set({ replaceCantrip: value })} />}
    {s.prepared.canReplace && <Replace label="Sostituisci un incantesimo preparato" from={s.prepared.known} to={s.prepared.options.filter((item) => !taken.includes(item.name))} onChange={(value) => set({ replacePrepared: value })} />}
  </div>;
}

function FeaturesStep({ plan, subclass, choices, set }: { plan: LevelUpPlan; subclass: string; choices: LevelUpChoices; set: (patch: Partial<LevelUpChoices>) => void }) {
  const features = [...plan.classFeatures, ...(plan.subclassFeatures[subclass] ?? [])].filter((item) => !/^sottoclasse d|^aumento dei punteggi|^dono epico$/i.test(item.name));
  return <div className="flex flex-col gap-2">
    {!features.length && <p className="text-sm text-ink-soft">Nessun nuovo privilegio a questo livello oltre a quanto già scelto.</p>}
    {features.map((feature) => <FeatureCard key={feature.id} feature={feature}>
      <TextInput className="mt-2 w-full" value={choices.featureNotes?.[feature.name] ?? ""} onChange={(event) => set({ featureNotes: { ...choices.featureNotes, [feature.name]: event.target.value } })} placeholder="Scelte del privilegio, se previste (facoltativo)" aria-label={`Scelte per ${feature.name}`} />
    </FeatureCard>)}
    {[...plan.notes, ...((plan.subclass.required || features.some((item) => item.origin === "sottoclasse")) ? plan.subclassNotes[subclass] ?? [] : [])].map((note, index) => <Box key={index} tone="warn">{note}</Box>)}
  </div>;
}

function Review({ plan, subclass, choices }: { plan: LevelUpPlan; subclass: string; choices: LevelUpChoices }) {
  const base = choices.hp.method === "fisso" ? plan.fixedGain : Number(choices.hp.roll);
  const lines = [
    `PF: ${choices.hp.method === "fisso" ? "valore fisso" : `tiro d${plan.hitDie}`} ${base} + COS`,
    plan.subclass.required && `Sottoclasse: ${subclass}`,
    choices.feat?.alternative ? `${plan.feat?.alternative?.name}: ${(choices.feat.cantrips ?? []).join(", ")}` : choices.feat?.name && `Talento: ${choices.feat.name}${Object.entries(choices.feat.increases ?? {}).filter(([, v]) => v).map(([abbr, v]) => ` ${abbr} +${v}`).join(",")}`,
    choices.expertise?.length && `Maestria: ${choices.expertise.map(pretty).join(", ")}`,
    choices.languages?.length && `Lingue: ${choices.languages.join(", ")}`,
    choices.cantrips?.length && `Trucchetti: ${choices.cantrips.join(", ")}`,
    choices.book?.length && `Libro: ${choices.book.join(", ")}`,
    choices.prepared?.length && `Preparati: ${choices.prepared.join(", ")}`,
    choices.arcanum && `Arcanum: ${choices.arcanum}`,
    choices.replaceCantrip?.to && `Trucchetto: ${choices.replaceCantrip.from} → ${choices.replaceCantrip.to}`,
    choices.replacePrepared?.to && `Incantesimo: ${choices.replacePrepared.from} → ${choices.replacePrepared.to}`,
    choices.masteries?.length && `Padronanze: ${choices.masteries.join(", ")}`,
  ].filter(Boolean) as string[];
  return <div className="flex flex-col gap-2">
    <Box><ul className="list-inside list-disc">{lines.map((line, index) => <li key={index}>{line}</li>)}</ul></Box>
    <p className="text-sm text-ink-soft">La conferma salva tutto in un solo passaggio e lo registra nella Storia{plan.subclass.current || subclass ? "" : ""}. Annullare ora non cambia la scheda.</p>
  </div>;
}

function Done({ plan, result, onClose }: { plan: LevelUpPlan; result: { level: number; summary: SummaryItem[] }; onClose: () => void }) {
  const groups: { kind: SummaryItem["kind"]; title: string }[] = [
    { kind: "scelto", title: "Scelte" }, { kind: "applicato", title: "Aggiornato" },
    { kind: "in gioco", title: "Nuove capacità da usare in gioco" }, { kind: "da registrare", title: "Da gestire a mano" },
  ];
  return <div className="flex flex-col gap-3">
    <p className="text-center text-4xl" aria-hidden>🎉</p>
    <h3 className="text-center text-xl font-bold text-ink">Livello {result.level} raggiunto! Ecco le novità di {plan.characterName}:</h3>
    {groups.map((group) => {
      const items = result.summary.filter((item) => item.kind === group.kind);
      if (!items.length) return null;
      return <div key={group.kind} className="rounded-2xl bg-white/75 p-3">
        <p className="mb-1 text-sm font-bold uppercase tracking-wide text-ink-soft">{group.title}</p>
        <ul className="list-inside list-disc text-[15px] text-ink">{items.map((item, index) => <li key={index}>{item.text}{item.page ? <span className="text-ink-soft"> (p. {item.page})</span> : null}</li>)}</ul>
      </div>;
    })}
    <Button tone="primary" className="min-h-12" onClick={onClose}>Fatto</Button>
  </div>;
}
