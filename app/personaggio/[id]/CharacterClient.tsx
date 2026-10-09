"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useRouter } from "next/navigation";
import {
  TextField,
  InlineInput,
  Toggle,
  EditProvider,
  EditContext,
  FieldInfoContext,
  InfoLabel,
} from "@/components/fields";
import { getCharacterHistory, saveSheet, type HistoryEntry } from "@/app/actions";
import { groupHistoryByDay } from "@/lib/history";
import { characterStory } from "@/lib/characterStory";
import regole from "@/lib/manuale-2024-domains.json";
import { spellDetails, canonicalSpellName } from "@/lib/spells";
import { bloccoIncantesimo, privilegioManuale, voceManuale } from "@/lib/manuale-2024/index";
import { spellEffects } from "@/lib/spellEffects";
import type { Sheet, Arma, Equip } from "@/lib/sheet";
import { abilityBonus, abilityModifier, initiativeBonus, passivePerception, proficiencyBonus, savingThrowBonus } from "@/lib/abilityBonus";
import { calculationExplanation, type CalculationTarget } from "@/lib/calculationExplanation";
import { labelHelp, type FieldHelp } from "@/lib/fieldHelp";
import { languageDetails } from "@/lib/languageDetails";
import { weaponByName, weaponCatalog, weaponDetails } from "@/lib/weaponDetails";
import { weaponMasteryLimit } from "@/lib/weaponChoices";
import { isWeaponProficient } from "@/lib/weaponProficiencyRules";
import { equipmentWarning, weaponWarning, type EquipmentWarning } from "@/lib/equipmentUsability";
import { displayedWeaponAttack, weaponAttack, weaponRange } from "@/lib/weaponAttack";
import { spellDamageNote } from "@/lib/spellDamageNotes";
import { CalculationContent } from "@/components/CalculationContent";
import { Badge, StatTile } from "@/components/StatTile";
import { armorCatalog, armorById } from "@/lib/armorCatalog";
import { gearCatalog, gearById, gearByName } from "@/lib/gearCatalog";
import { carryingCapacity, inventoryWeight } from "@/lib/inventoryWeight";
import { grantedPrivileges } from "@/lib/characterGrants";
import { operationalReminder } from "@/lib/operationalReminders";
import { displayedFeatGrants, featFunctionalDetails, grantFunctionalDetails } from "@/lib/functionalDetails";
import { spellSlots, spellcastingStats } from "@/lib/spellcasting";
import { masteryEffects } from "@/lib/weaponMastery";
import { coinTotals } from "@/lib/coins";
import { weaponCompetencyDetails } from "@/lib/weaponCompetencies";
import { toolCompetencyDetails } from "@/lib/toolCompetencies";
import { subclassLevel } from "@/lib/classProgression";
import { valueDetails } from "@/lib/valueDetails";
import { equipmentDetails } from "@/lib/equipmentDetails";
import { recordedValueDetails } from "@/lib/recordedValueDetails";
import { displayedArmorClass } from "@/lib/armorClass";
import { addCatalogEquipment, addOwnedArmor, armorForEquipment, isArmorEquipment, removeOwnedArmor, replaceOtherEquipment, selectHeldShield, selectWornArmor } from "@/lib/equipmentSelection";
import { compareOptionLabels } from "@/lib/sortOptions";
import { DiceText } from "@/components/DiceText";
import { LevelUpWizard } from "@/components/LevelUpWizard";
import { readyToLevel, xpThresholds } from "@/lib/masterRules";

const lignaggi = regole.lignaggi as Record<string, string[]>;
const historyDayFormatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "full", timeZone: "Europe/Rome",
});
const historyTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
});

const card = "rounded-xl border border-line bg-card/70 p-3 shadow-sm";
const grid2 = "grid grid-cols-2 gap-2.5";
const operationalNote = "mt-1 text-sm text-accent";

function FunctionalSummary({ name, sheet, details }: { name: string; sheet: Sheet; details: { summary: string | null; full: string | null } }) {
  if (!details.summary && !details.full) return null;
  return <>
    {details.summary && <p className={operationalReminder(name, sheet) ? operationalNote : "mt-1 whitespace-pre-wrap text-sm text-ink-soft"}>{details.summary}</p>}
    {details.full && details.full !== details.summary && <details className="mt-1 text-sm text-ink-soft">
      <summary className="cursor-pointer">Dettagli completi</summary>
      <p className="mt-1 whitespace-pre-wrap">{details.full}</p>
    </details>}
  </>;
}
const sectionTitle =
  "rule-tapered mb-1.5 font-display text-[11px] font-semibold uppercase tracking-wide text-heading";

function calculationEditGuide(target: CalculationTarget): string {
  if (target.kind === "armor") return "Scegli l'armatura indossata e lo scudo impugnato nella pagina Armi; poi la CA si aggiorna con Destrezza e competenza negli scudi. Questo valore non si modifica direttamente.";
  if (target.kind === "initiative") return "Si aggiorna cambiando Destrezza, Livello o il talento Allerta; questo valore non si modifica direttamente.";
  if (target.kind === "proficiency") return "Si aggiorna cambiando il Livello; il bonus non si modifica direttamente.";
  if (target.kind === "passive") return "Si aggiorna con Saggezza e con Competenza o Maestria in Percezione; il valore non si modifica direttamente.";
  if (target.kind === "modifier") return "Si aggiorna cambiando il punteggio della caratteristica; il modificatore non si modifica direttamente.";
  if (target.kind === "save") return "Si aggiorna quando cambiano il punteggio della caratteristica, il livello o una competenza concessa dalle regole.";
  if (target.kind === "speed") return "Il valore è registrato alla creazione del personaggio e dai flussi guidati; non si modifica direttamente da qui.";
  if (target.kind === "maxHp") return "Si aggiorna con «Sali di livello», scegliendo tiro del Dado Vita o valore fisso; non si modifica direttamente.";
  if (target.kind === "spellDc" || target.kind === "spellAttack") return "Si aggiorna cambiando il punteggio della caratteristica da incantatore o il livello.";
  if (target.kind === "weaponAttack") return "Dipende da caratteristica, livello e competenze. Per le armi Accurate scegli FOR o DES sotto l'arma, nella pagina Armi.";
  if (target.kind === "weaponDamage") return "Dipende dal modificatore di caratteristica e, per le armi Versatili, dall'uso a una o due mani: sceglilo sotto l'arma, nella pagina Armi.";
  if (target.kind === "weaponRange") return "Deriva dalle proprietà dell'arma. Per le armi da lancio scegli «Lancio» sotto l'arma per vedere la gittata.";
  return "Si aggiorna quando cambiano il punteggio della caratteristica, il livello o una competenza o Maestria concessa dalle regole.";
}

function ComputedField({ label, value, explainLabel, onExplain, competent }: {
  label: string;
  value: string;
  explainLabel?: string;
  onExplain: (button: HTMLButtonElement) => void;
  competent?: boolean;
}) {
  return <div>
    <button type="button" onClick={(event) => onExplain(event.currentTarget)}
      aria-label={`Spiega il calcolo: ${explainLabel ?? label}`}
      aria-haspopup="dialog"
      className="w-full touch-manipulation text-left active:text-accent">
      <span className="mb-0.5 flex items-center gap-1 font-sans text-[10px] font-medium uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      <span className="flex min-h-[2rem] items-center rounded-lg bg-card/40 px-3 py-1 text-[15px] text-ink">
        {competent !== undefined && <span aria-hidden className={`mr-1.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border text-[9px] ${competent
          ? "border-accent bg-accent text-parchment"
          : "border-ink-faint text-transparent"
        }`}>✓</span>}
        {value || "—"}
      </span>
    </button>
  </div>;
}

// Nome completo delle caratteristiche a partire dall'abbreviazione.
const CAR_FULL: Record<string, string> = {
  FOR: "FORZA",
  DES: "DESTREZZA",
  COS: "COSTITUZIONE",
  INT: "INTELLIGENZA",
  SAG: "SAGGEZZA",
  CAR: "CARISMA",
};

// Normalizza un campo lista che potrebbe essere ancora una vecchia stringa.
function toList(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  if (typeof v === "string" && v.trim())
    return v
      .split(/[;,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function WeaponCompetencyList({ sheet }: { sheet: Sheet }) {
  const items = toList(sheet.competenzeArmi);
  return <ul className="flex flex-wrap gap-2">
    {items.length === 0 && <li className="text-sm text-ink-faint">Nessuna</li>}
    {items.map((name) => <li key={name} className="rounded-full border border-accent bg-accent/12 px-2.5 py-1 text-xs font-medium text-accent">
      <InfoLabel id={`competenzaArma:${name}`} title={name} />
    </li>)}
  </ul>;
}

function ToolCompetencyList({ sheet }: { sheet: Sheet }) {
  const items = [...(sheet.competenzeStrumenti ?? [])].sort(compareOptionLabels);
  return <ul className="flex flex-col gap-1.5">
    {items.length === 0 && <li className="text-sm text-ink-faint">—</li>}
    {items.map((name) => <li key={name} className="flex items-center gap-2">
      <span className="text-ink-faint" aria-hidden>•</span>
      <InfoLabel id={`competenzaStrumento:${name}`} title={name} className="min-w-0 flex-1 rounded-lg bg-card/40 px-3 py-1 text-[15px] text-ink" />
    </li>)}
  </ul>;
}

function WeaponMasteryList({ sheet }: { sheet: Sheet }) {
  const selected = sheet.padronanzeArmi ?? [];
  return <ul className="flex flex-col gap-1.5">
    {selected.length === 0 && <li className="text-sm text-ink-faint">—</li>}
    {selected.map((name, index) => <li key={`${name}:${index}`} className="flex items-center gap-2">
      <span className="text-ink-faint" aria-hidden>•</span>
      <InfoLabel id={`padronanza:${name}`} title={name} className="min-w-0 flex-1 rounded-lg bg-card/40 px-3 py-1 text-[15px] text-ink" />
    </li>)}
  </ul>;
}

function AddWeaponSelect({ sheet, onAdd }: { sheet: Sheet; onAdd: (name: string) => void }) {
  const { unlocked } = useContext(EditContext);
  const choices = weaponCatalog.filter((weapon) => !sheet.armi.some((owned) => owned.nome === weapon.name));
  return unlocked && choices.length > 0 ? <select aria-label="Aggiungi arma" value="" onChange={(event) => onAdd(event.target.value)}
    className="max-w-full rounded-lg border border-dashed border-line bg-card/60 px-3 py-1.5 text-sm font-medium text-ink-soft focus:border-accent focus:outline-none">
    <option value="" disabled>+ Aggiungi arma</option>
    {[...choices].sort((a, b) => compareOptionLabels(a.name, b.name)).map((weapon) =>
      <option key={weapon.id} value={weapon.name}>{weapon.name}{isWeaponProficient(sheet, weapon) ? "" : " · senza competenza"}</option>)}
  </select> : null;
}

function WarningLabel({ id, name, warning }: { id: string; name: string; warning: EquipmentWarning | null }) {
  if (!warning) return null;
  return <InfoLabel id={id} title={warning.label} dialogTitle={`${name}: ${warning.label.toLocaleLowerCase("it")}`}
    className="inline-flex min-h-7 items-center rounded border border-danger/50 bg-danger/10 px-2 text-[10px] font-bold text-danger-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger" />;
}

const capitalized = (text: string) => text.charAt(0).toLocaleUpperCase("it") + text.slice(1);

// Proprietà della tabella Armi (p. 215), divise senza spezzare le parentesi.
const weaponProperties = (properties: string) => properties === "—" ? [] : properties.split(/,\s*(?![^(]*\))/).map(capitalized);

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (value: T) => void }) {
  return <div role="group" aria-label={label} className="flex rounded-lg border border-line/70 bg-parchment/60 p-0.5 text-xs font-semibold">
    {options.map(([option, text]) => <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)}
      className={`min-h-8 touch-manipulation rounded-md px-2.5 ${value === option ? "bg-card text-accent shadow-sm" : "text-ink-soft"}`}>{text}</button>)}
  </div>;
}

function OwnedWeaponList({ sheet, onChange, onExplain }: { sheet: Sheet; onChange: (items: Arma[]) => void; onExplain: (target: CalculationTarget, button: HTMLButtonElement) => void }) {
  const { unlocked } = useContext(EditContext);
  const update = (index: number, patch: Partial<Arma>) => onChange(sheet.armi.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  return <div className="flex flex-col gap-2">
    {sheet.armi.length === 0 && !unlocked && <p className="text-sm text-ink-faint">Niente da mostrare.</p>}
    {sheet.armi.map((weapon, index) => {
      const entry = weaponByName(weapon.nome);
      const calculation = weaponAttack(sheet, weapon);
      const range = weaponRange(weapon);
      const mastery = entry && (sheet.padronanzeArmi ?? []).includes(entry.name) ? entry.mastery : null;
      const modes: [NonNullable<Arma["modo"]>, string][] = entry?.kind === "mischia" && (entry.thrown || entry.versatileDie) ? [
        ["base", entry.versatileDie ? "Una mano" : "Mischia"],
        ...(entry.versatileDie ? [["dueMani", "Due mani"] as [NonNullable<Arma["modo"]>, string]] : []),
        ...(entry.thrown ? [["lancio", "Lancio"] as [NonNullable<Arma["modo"]>, string]] : []),
      ] : [];
      const name = weapon.nome || "Arma";
      return <div key={index} className={card}>
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <InfoLabel id={`armaPosseduta:${index}`} title={name} className="text-left text-[15px] font-semibold text-ink" />
            <WarningLabel id={`avvisoArma:${index}`} name={weapon.nome} warning={weaponWarning(sheet, weapon)} />
          </div>
          <span className="text-xs text-ink-faint" aria-hidden>×</span>
          <InlineInput value={weapon.quantita || "1"} onChange={(value) => update(index, { quantita: value || "1" })} numeric="unsigned" className="w-8 text-center" />
          {unlocked && <button type="button" aria-label={`Rimuovi ${weapon.nome}`} onClick={() => {
            if (window.confirm(`Eliminare ${weapon.nome}?`)) onChange(sheet.armi.filter((_, itemIndex) => itemIndex !== index));
          }} className="flex size-8 shrink-0 items-center justify-center text-base font-medium text-danger-strong">×</button>}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <StatTile icon="hit" label="Colpire" tone="accent" value={displayedWeaponAttack(sheet, weapon)}
            sub={calculation ? `${calculation.ability}${calculation.proficient ? " + comp." : " · senza comp."}` : undefined}
            ariaLabel={`Spiega il tiro per colpire: ${name}`} onClick={(button) => onExplain({ kind: "weaponAttack", index }, button)} />
          <StatTile icon="damage" label="Danni" tone="danger"
            value={calculation ? `${calculation.dice}${calculation.modifier}` : ""} sub={calculation?.damageType}
            ariaLabel={`Spiega i danni: ${name}`} onClick={(button) => onExplain({ kind: "weaponDamage", index }, button)} />
          <StatTile icon={range?.label === "Gittata" ? "range" : "reach"} label={range?.label ?? "Portata"} tone="temp" value={range?.value ?? ""}
            sub={range?.thrown ? `lancio ${range.thrown}` : range?.label === "Gittata" ? "normale/lunga" : undefined} size={range?.label === "Gittata" ? "sm" : "md"}
            ariaLabel={`Spiega ${range?.label === "Gittata" ? "la gittata" : "la portata"}: ${name}`} onClick={(button) => onExplain({ kind: "weaponRange", index }, button)} />
        </div>
        {(entry || mastery) && <div className="mt-2 flex flex-wrap gap-1">
          {entry && weaponProperties(entry.properties).map((property) => <Badge key={property}>{property}</Badge>)}
          {mastery && <InfoLabel id={`padronanza:${entry!.name}`} title={`Padronanza: ${mastery}`} className="inline-flex items-center rounded-full border border-magic/25 bg-magic/10 px-2 py-0.5 text-[11px] font-semibold text-magic-ink" />}
        </div>}
        {(modes.length > 0 || entry?.finesse) && <div className="mt-2 flex flex-wrap gap-1.5">
          {modes.length > 0 && <Segmented label={`Uso di ${name}`} value={weapon.modo ?? "base"} options={modes}
            onChange={(modo) => update(index, { modo: modo === "base" ? undefined : modo })} />}
          {entry?.finesse && <Segmented label={`Caratteristica per ${name}`} value={weapon.caratteristica ?? (entry.kind === "distanza" ? "DES" : "FOR")}
            options={[["FOR", "FOR"], ["DES", "DES"]]} onChange={(caratteristica) => update(index, { caratteristica })} />}
        </div>}
        {weapon.note && <p className="mt-1.5 whitespace-pre-wrap text-xs text-ink-soft">{weapon.note}</p>}
      </div>;
    })}
  </div>;
}

function ObjectListEditor({ sheet, items, indices, onChange, onBundleReceived }: { sheet: Sheet; items: Equip[]; indices: number[]; onChange: (items: Equip[]) => void; onBundleReceived: (name: string) => void }) {
  const { unlocked } = useContext(EditContext);
  const patchAt = (index: number, update: Partial<Equip>) => onChange(items.map((item, current) => current === index ? { ...item, ...update } : item));
  const entries = items.map((item, index) => ({ item, index }))
    .sort((a, b) => compareOptionLabels(a.item.nome, b.item.nome));
  const renderItem = ({ item, index }: { item: Equip; index: number }) =>
    <div key={index} className={`${card} flex items-center gap-2`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {item.nome || !unlocked ? <InfoLabel id={`oggetto:${indices[index]}`} title={item.nome || "Nuovo oggetto"} className="text-left text-sm font-semibold text-ink" />
            : <TextField label="" showInfo={false} value={item.nome} onChange={(value) => patchAt(index, { nome: value })} />}
          <WarningLabel id={`avvisoOggetto:${indices[index]}`} name={item.nome} warning={equipmentWarning(sheet, item)} />
        </div>
        {item.dettaglio && <p className="mt-0.5 whitespace-pre-wrap text-xs text-ink-soft">{item.dettaglio}</p>}
      </div>
      <span className="text-xs text-ink-faint">Quantità</span>
      <InlineInput value={item.quantita || "1"} onChange={(value) => patchAt(index, { quantita: value || "1" })} numeric="unsigned" className="w-8 text-center" />
      {unlocked && <button type="button" onClick={() => { if (window.confirm(`Eliminare ${item.nome || "questo oggetto"}?`)) onChange(items.filter((_, current) => current !== index)); }} aria-label={`Rimuovi ${item.nome || "oggetto"}`} className="shrink-0 px-1 text-sm font-medium text-danger-strong">×</button>}
    </div>;
  return <div className="flex flex-col gap-2">
    {items.length === 0 && !unlocked && <p className="text-sm text-ink-faint">Niente da mostrare.</p>}
    {entries.map(renderItem)}
    {unlocked && <select aria-label="Aggiungi oggetto" value="" onChange={(event) => {
      const gear = gearById(event.target.value);
      if (gear?.contents?.length) onBundleReceived(gear.name);
      onChange(event.target.value === "personalizzato"
        ? [...items, { nome: "", dettaglio: "", quantita: "1" }]
        : addCatalogEquipment(items, event.target.value));
    }} className="max-w-full self-start rounded-lg border border-dashed border-line bg-card/60 px-3 py-1.5 text-sm font-medium text-ink-soft focus:border-accent focus:outline-none">
      <option value="" disabled>+ Aggiungi oggetto</option>
      {gearCatalog.map((gear) => ({ id: gear.id, name: gear.name }))
        .sort((a, b) => compareOptionLabels(a.name, b.name))
        .map((gear) => <option key={gear.id} value={gear.id}>{gear.name}</option>)}
      <option value="personalizzato">OGGETTO PERSONALIZZATO</option>
    </select>}
  </div>;
}

function OwnedArmorEditor({ sheet, onChange }: { sheet: Sheet; onChange: (items: Equip[]) => void }) {
  const { unlocked } = useContext(EditContext);
  const owned = sheet.equipaggiamento.flatMap((item, index) => isArmorEquipment(item) ? [{ item, index }] : [])
    .sort((a, b) => compareOptionLabels(a.item.nome, b.item.nome));
  return <div className="flex flex-col gap-2">
    {owned.length === 0 && <p className="text-sm text-ink-soft">Nessuna armatura o scudo registrato.</p>}
    {owned.map(({ item, index }) => {
      const lastEquipped = Number(item.quantita ?? "1") <= 1 &&
        (item.indossato || item.impugnato || (sheet.scudo && armorForEquipment(item)?.category === "scudi"));
      return <div key={index} className="flex items-center gap-2 rounded-lg border border-line bg-card/70 px-3 py-2">
        <span className="min-w-0 flex flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-ink">
          <InfoLabel id={`armatura:${index}`} title={item.nome || "Armatura"} />
          <WarningLabel id={`avvisoOggetto:${index}`} name={item.nome} warning={equipmentWarning(sheet, item)} />
        </span>
        <span className="text-sm text-ink-soft">×{item.quantita ?? "1"}</span>
        {unlocked && <button type="button" disabled={lastEquipped} onClick={() => onChange(removeOwnedArmor(sheet.equipaggiamento, index))}
          aria-label={`Rimuovi una unità di ${item.nome}`}
          className="rounded px-2 py-1 text-sm font-semibold text-accent disabled:opacity-40">−</button>}
      </div>;
    })}
    {unlocked && <select aria-label="Registra armatura o scudo posseduto" value=""
      onChange={(event) => onChange(addOwnedArmor(sheet.equipaggiamento, event.target.value))}
      className="max-w-full self-start rounded-lg border border-dashed border-line bg-card/60 px-3 py-1.5 text-sm font-medium text-ink-soft focus:border-accent focus:outline-none">
      <option value="" disabled>+ Registra armatura o scudo</option>
      {[...armorCatalog].sort((a, b) => compareOptionLabels(a.name, b.name)).map((armor) => <option key={armor.id} value={armor.id}>{armor.name}</option>)}
    </select>}
  </div>;
}

function CompetenceDot({ checked, label }: { checked: boolean; label: string }) {
  return <span role="img" aria-label={`${label}: ${checked ? "sì" : "no"}`}
    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px] ${checked
      ? "border-accent bg-accent text-parchment"
      : "border-ink-faint text-transparent"
    }`}>✓</span>;
}

const COINS: [string, keyof Sheet["monete"], string][] = [
  ["Rame", "rame", "mr"],
  ["Argento", "argento", "ma"],
  ["Electrum", "electrum", "me"],
  ["Oro", "oro", "mo"],
  ["Platino", "platino", "mp"],
];

type SaveState = "idle" | "saving" | "saved" | "error";

export default function CharacterClient({
  id,
  name: initialName,
  sheet: initialSheet,
  hitPointGains,
}: {
  id: string;
  name: string;
  sheet: Sheet;
  hitPointGains?: Sheet["incrementiPf"];
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(initialSheet);
  const [localStoryEvents, setLocalStoryEvents] = useState(sheet.eventiStoria ?? []);
  const pendingBundleEvents = useRef<{ name: string }[]>([]);
  const [name] = useState(initialName);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true });
  const [selected, setSelected] = useState(0);
  const notesTouchStart = useRef({ x: 0, y: 0 });

  // All'ingresso mostriamo la "home" del personaggio con l'indice delle sezioni.
  const [showHub, setShowHub] = useState(true);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const firstRun = useRef(true);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const [showHistory, setShowHistory] = useState(false);
  const [showShieldNotice, setShowShieldNotice] = useState(false);
  const [calculationTarget, setCalculationTarget] = useState<CalculationTarget | null>(null);
  const [fieldInfo, setFieldInfo] = useState<{ id: string; title: string } | null>(null);
  const calculationTrigger = useRef<HTMLButtonElement | null>(null);
  const calculationClose = useRef<HTMLButtonElement | null>(null);
  const fieldInfoTrigger = useRef<HTMLButtonElement | null>(null);
  const fieldInfoClose = useRef<HTMLButtonElement | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [levelUpOpen, setLevelUpOpen] = useState(false);

  useEffect(() => {
    if (!showShieldNotice) return;
    const timer = window.setTimeout(() => setShowShieldNotice(false), 2500);
    return () => window.clearTimeout(timer);
  }, [showShieldNotice]);

  useEffect(() => {
    if (!calculationTarget) return;
    calculationClose.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCalculationTarget(null);
        calculationTrigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [calculationTarget]);

  const openCalculation = (target: CalculationTarget, button: HTMLButtonElement) => {
    calculationTrigger.current = button;
    setCalculationTarget(target);
  };
  const closeCalculation = () => {
    setCalculationTarget(null);
    calculationTrigger.current?.focus();
  };
  const calculation = calculationTarget ? calculationExplanation(sheet, calculationTarget) : null;
  const spellName = fieldInfo?.id.startsWith("incantesimo:") ? canonicalSpellName(fieldInfo.id.slice("incantesimo:".length)) : null;
  const spell = spellName ? spellDetails(spellName) : null;
  // Descrizione dell'incantesimo dal manuale (blocco del suo livello).
  const spellBlock = spellName && spell ? bloccoIncantesimo(spell.livello, spellName) : null;
  const spellManual = spellName && spellBlock ? voceManuale(`incantesimi/${spellBlock}`, spellName) : null;
  const language = fieldInfo?.id.startsWith("lingua:") ? languageDetails(fieldInfo.id.slice("lingua:".length)) : null;
  const weapon = fieldInfo?.id.startsWith("arma:") ? weaponDetails(fieldInfo.id.slice("arma:".length)) : null;
  const weaponCompetencyName = fieldInfo?.id.startsWith("competenzaArma:") ? fieldInfo.id.slice("competenzaArma:".length) : null;
  const weaponCompetencyInfo = weaponCompetencyName ? { meaning: weaponCompetencyDetails(sheet, weaponCompetencyName), rule: true, page: 215 } : null;
  const toolCompetencyName = fieldInfo?.id.startsWith("competenzaStrumento:") ? fieldInfo.id.slice("competenzaStrumento:".length) : null;
  const toolCompetencyInfo = toolCompetencyName ? { meaning: toolCompetencyDetails(sheet, toolCompetencyName), rule: true, page: gearByName(toolCompetencyName)?.sourcePage ?? 220 } : null;
  const masteryName = fieldInfo?.id.startsWith("padronanza:") ? fieldInfo.id.slice("padronanza:".length) : null;
  const masteryWeapon = masteryName ? weaponByName(masteryName) : null;
  const masteryInfo = masteryWeapon ? { meaning: `${weaponDetails(masteryWeapon.name)}\n\nPadronanza ${masteryWeapon.mastery}: ${masteryEffects[masteryWeapon.mastery] ?? ""}\n\nConcessa dalla classe ${sheet.classe}: ${weaponMasteryLimit(sheet)} scelte al livello ${sheet.livello}.`, rule: true, page: 214 } : null;
  const selectedArmor = sheet.equipaggiamento.find((item) => item.indossato && armorForEquipment(item)?.category !== "scudi");
  const selectedShield = sheet.equipaggiamento.find((item) => item.impugnato && armorForEquipment(item)?.category === "scudi");
  const carriedArmors = sheet.equipaggiamento.filter((item) => armorForEquipment(item)?.category !== "scudi" && isArmorEquipment(item) && !item.indossato);
  const carriedShields = sheet.equipaggiamento.filter((item) => armorForEquipment(item)?.category === "scudi" && !item.impugnato);
  const armorBaseInfo = selectedArmor ? equipmentDetails(selectedArmor.nome, selectedArmor.dettaglio) : null;
  const shieldBaseInfo = selectedShield ? equipmentDetails(selectedShield.nome, selectedShield.dettaglio) : null;
  const armorSelectionInfo = fieldInfo?.id === "armaturaSelezionata" ? { meaning: [armorBaseInfo?.meaning ?? "Nessuna armatura indossata.", ...carriedArmors.map((item) => `Trasportata: ${item.nome}. ${equipmentDetails(item.nome)?.meaning ?? ""}`)].filter(Boolean).join("\n\n"), rule: true, page: 219 } : null;
  const shieldSelectionInfo = fieldInfo?.id === "scudoSelezionato" ? { meaning: [shieldBaseInfo?.meaning ?? (sheet.scudo ? equipmentDetails("Scudo")?.meaning : "Nessuno scudo impugnato."), ...carriedShields.map((item) => `Trasportato: ${item.nome}. ${equipmentDetails(item.nome)?.meaning ?? ""}`)].filter(Boolean).join("\n\n"), rule: true, page: 219 } : null;
  const ownedWeaponIndex = fieldInfo?.id.startsWith("armaPosseduta:") ? Number(fieldInfo.id.slice("armaPosseduta:".length)) : -1;
  const warningWeaponIndex = fieldInfo?.id.startsWith("avvisoArma:") ? Number(fieldInfo.id.slice("avvisoArma:".length)) : -1;
  const warningObjectIndex = fieldInfo?.id.startsWith("avvisoOggetto:") ? Number(fieldInfo.id.slice("avvisoOggetto:".length)) : -1;
  const warning = warningWeaponIndex >= 0 ? sheet.armi[warningWeaponIndex] && weaponWarning(sheet, sheet.armi[warningWeaponIndex])
    : warningObjectIndex >= 0 ? sheet.equipaggiamento[warningObjectIndex] && equipmentWarning(sheet, sheet.equipaggiamento[warningObjectIndex]) : null;
  const warningInfo = warning ? { meaning: warning.reason, rule: true, page: warning.page } : null;
  const ownedWeapon = ownedWeaponIndex >= 0 ? sheet.armi[ownedWeaponIndex] : null;
  const ownedWeaponBase = ownedWeapon ? weaponDetails(ownedWeapon.nome) : null;
  const ownedWeaponCalculation = ownedWeapon ? weaponAttack(sheet, ownedWeapon) : null;
  const ownedMastery = ownedWeapon && (sheet.padronanzeArmi ?? []).includes(ownedWeapon.nome) ? weaponByName(ownedWeapon.nome)?.mastery : null;
  const ownedWeaponInfo = ownedWeaponBase || ownedWeapon?.note ? {
    meaning: [ownedWeaponBase, ownedWeapon?.modo && ownedWeapon.modo !== "base" && `Uso: ${ownedWeapon.modo === "lancio" ? "Lancio" : "Due mani"}.`, ownedWeapon?.caratteristica && `Caratteristica scelta: ${ownedWeapon.caratteristica}.`, ownedWeaponCalculation && `Attacco calcolato: ${ownedWeaponCalculation.formula}. Danno: ${ownedWeaponCalculation.damage || "punteggio da inserire"}.`, ...(ownedWeaponCalculation?.warnings ?? []), ownedMastery && `Padronanza scelta: ${ownedMastery}. ${masteryEffects[ownedMastery] ?? ""}`, ownedWeapon?.bonus && `Bonus al tiro per colpire manuale: ${ownedWeapon.bonus} (prevale sul calcolo).`, ownedWeapon?.note && `Dettaglio personale: ${ownedWeapon.note}`].filter(Boolean).join("\n\n"),
    rule: Boolean(ownedWeaponBase),
    page: ownedWeaponBase ? weaponByName(ownedWeapon?.nome ?? "")?.pages : undefined,
  } : null;
  const valueId = fieldInfo?.id.startsWith("valore:") ? fieldInfo.id.slice("valore:".length) : null;
  const valueKind = valueId?.slice(0, valueId.indexOf(":")) ?? "";
  const value = valueId?.slice(valueKind.length + 1) ?? "";
  const selectedValueBase = valueId ? valueDetails(valueKind, value) : null;
  const talentChoices = valueKind === "talento" ? sheet.talenti.find((item) => item.nome === value)?.scelte : "";
  const selectedValue = selectedValueBase && talentChoices ? {
    ...selectedValueBase,
    meaning: `${selectedValueBase.meaning}\n\nScelte personali: ${talentChoices}`,
  } : selectedValueBase;
  const recorded = fieldInfo?.id.startsWith("stato:") ? recordedValueDetails(sheet, fieldInfo.id.slice("stato:".length)) : null;
  const objectIndex = fieldInfo?.id.startsWith("oggetto:") ? Number(fieldInfo.id.slice("oggetto:".length)) : -1;
  const object = objectIndex >= 0 ? sheet.equipaggiamento[objectIndex] : null;
  const objectInfo = object ? equipmentDetails(object.nome, object.dettaglio) ?? { meaning: "Oggetto personalizzato.", rule: false } : null;
  const privilegeIndex = fieldInfo?.id.startsWith("privilegio:") ? Number(fieldInfo.id.slice("privilegio:".length)) : -1;
  const privilege = privilegeIndex >= 0 ? sheet.privilegi[privilegeIndex] : null;
  // Prima il testo del manuale per il privilegio, con il contesto di classe/sottoclasse/specie/lignaggio.
  const privilegeManual = privilege ? privilegioManuale(privilege.titolo, {
    classe: sheet.classe, sottoclasse: sheet.sottoclasse, specie: sheet.specie, lignaggio: sheet.lignaggio, livello: Number(sheet.livello),
  }) : null;
  const privilegeBase = privilegeManual?.descrizione
    ? { meaning: privilegeManual.descrizione, rule: true, page: privilegeManual.voce.pagina }
    : privilege ? valueDetails("privilegio", privilege.titolo) : null;
  const privilegeInfo = privilegeBase || privilege?.scelte ? {
    meaning: [privilegeBase?.meaning, privilege?.scelte && `Scelte personali: ${privilege.scelte}`].filter(Boolean).join("\n\n"),
    rule: privilegeBase?.rule,
    page: privilegeBase?.page,
  } : null;
  const armorItemIndex = fieldInfo?.id.startsWith("armatura:") ? Number(fieldInfo.id.slice("armatura:".length)) : -1;
  const armorItem = armorItemIndex >= 0 ? sheet.equipaggiamento[armorItemIndex] : null;
  const armorItemInfo = armorItem ? equipmentDetails(armorItem.nome, armorItem.dettaglio) ?? { meaning: "Armatura o scudo personalizzato.", rule: false } : null;
  // Privilegi e tratti concessi dalle regole ma non registrati nella scheda.
  const grantName = fieldInfo?.id.startsWith("concesso:") ? fieldInfo.id.slice("concesso:".length) : null;
  const grant = grantName ? grantedPrivileges(sheet).find((item) => item.name === grantName) ?? null : null;
  const grantManual = grant ? privilegioManuale(grant.name, {
    classe: sheet.classe, sottoclasse: sheet.sottoclasse, specie: sheet.specie, lignaggio: sheet.lignaggio, livello: Number(sheet.livello),
  }) : null;
  const grantFunctional = grant ? grantFunctionalDetails(grant, sheet) : null;
  const grantValue = grant?.source.startsWith("Sottoclasse") && grant.name === sheet.sottoclasse ? valueDetails("sottoclasse", grant.name) : null;
  const grantInfo = grant ? {
    meaning: grantManual?.descrizione ?? grantValue?.meaning ?? grantFunctional?.full ?? grantFunctional?.summary ?? `${grant.source}${grant.level ? `, livello ${grant.level}` : ""}.`,
    rule: true,
    page: grantManual?.voce.pagina ?? grantValue?.page ?? grant.page,
  } : null;
  const fieldHelp: FieldHelp | null = fieldInfo && !spellName ? language ? { meaning: language.meaning, rule: true, page: language.page } : warningInfo ?? weaponCompetencyInfo ?? toolCompetencyInfo ?? masteryInfo ?? armorSelectionInfo ?? shieldSelectionInfo ?? (weapon ? { meaning: weapon, rule: true, page: weaponByName(fieldInfo.id.slice("arma:".length))?.pages } : null) ?? ownedWeaponInfo ?? selectedValue ?? recorded ?? objectInfo ?? armorItemInfo ?? grantInfo ?? privilegeInfo ?? labelHelp(fieldInfo.id, fieldInfo.title) : null;

  useEffect(() => {
    if (!fieldInfo) return;
    fieldInfoClose.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFieldInfo(null);
        fieldInfoTrigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [fieldInfo]);
  const openFieldInfo = (id: string, title: string, trigger: HTMLButtonElement) => {
    fieldInfoTrigger.current = trigger;
    setFieldInfo({ id, title });
  };
  const closeFieldInfo = () => {
    setFieldInfo(null);
    fieldInfoTrigger.current?.focus();
  };

  // Storia per l'undo. Snapshot coalescenti (max 1 ogni 500 ms) per non dover
  // annullare carattere per carattere.
  const historyRef = useRef<Sheet[]>([]);
  const [histLen, setHistLen] = useState(0);
  const sheetRef = useRef(sheet);
  const lastSnapRef = useRef(0);
  useEffect(() => {
    sheetRef.current = sheet;
  }, [sheet]);
  const snapshot = useCallback(() => {
    const now = Date.now();
    if (now - lastSnapRef.current > 500) {
      historyRef.current = [...historyRef.current, sheetRef.current].slice(-100);
      setHistLen(historyRef.current.length);
    }
    lastSnapRef.current = now;
  }, []);
  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.length === 0) return;
    const prev = h[h.length - 1];
    historyRef.current = h.slice(0, -1);
    setHistLen(historyRef.current.length);
    lastSnapRef.current = 0;
    setSheet(prev);
  }, []);
  // Adotta una scheda già salvata da un flusso guidato (cambio di livello):
  // la cronologia di «Annulla» riparte da qui.
  const adoptSavedSheet = useCallback((saved: Sheet) => {
    historyRef.current = [];
    setHistLen(0);
    lastSnapRef.current = 0;
    setSheet(saved);
    setLocalStoryEvents(saved.eventiStoria ?? []);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const queueSave = useCallback((nextSheet: Sheet) => {
    const task = saveChainRef.current.then(async () => {
      const receipts = [...pendingBundleEvents.current];
      const result = await saveSheet(id, name, nextSheet, receipts);
      if (result.ok) pendingBundleEvents.current.splice(0, receipts.length);
      return result;
    });
    saveChainRef.current = task.then(() => undefined, () => undefined);
    return task;
  }, [id, name]);

  const noteBundleReceipt = (name: string) => {
    const gear = gearByName(name);
    if (!gear?.contents?.length) return;
    pendingBundleEvents.current.push({ name });
    setLocalStoryEvents((events) => [...events, {
      capitolo: "Dotazioni ricevute",
      titolo: `Dotazione ricevuta: ${gear.name}`,
      dettagli: gear.contents!.map(({ name: itemName, quantity }) => `${itemName}${quantity && quantity > 1 ? ` ×${quantity}` : ""}`),
      data: new Date().toISOString(),
    }]);
  };

  // Salvataggio automatico: a ogni modifica, con debounce. Le richieste restano in ordine.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        const res = await queueSave(sheet);
        if (res.ok) {
          setSaveState("saved");
        } else {
          setSaveState("error");
          window.alert(`Modifica non salvata.\n\n${res.error || "Errore sconosciuto nel salvataggio."}`);
        }
      } catch (error) {
        setSaveState("error");
        window.alert(`Modifica non salvata.\n\n${error instanceof Error ? error.message : String(error)}`);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [queueSave, sheet]);

  async function openHistory() {
    setShowHistory(true);
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const saved = await queueSave(sheet);
      if (!saved.ok) throw new Error(saved.error || "Salvataggio non riuscito");
      setHistoryEntries(await getCharacterHistory(id));
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Impossibile caricare lo storico");
    } finally {
      setHistoryLoading(false);
    }
  }

  const patch = (p: Partial<Sheet>) => {
    snapshot();
    setSheet((s) => ({ ...s, ...p }));
  };

  function goToPage(i: number) {
    emblaApi?.scrollTo(i, true);
    setShowHub(false);
  }

  function adjustCoin(key: keyof Sheet["monete"], delta: 1 | -1) {
    const current = Number(sheet.monete[key] || 0);
    if (!Number.isSafeInteger(current) || current < 0) return;
    const next = current + delta;
    if (next < 0 || !Number.isSafeInteger(next)) return;
    patch({ monete: { ...sheet.monete, [key]: String(next) } });
  }

  const [exporting, setExporting] = useState(false);
  async function handleExport() {
    setExporting(true);
    try {
      const { exportTemplatePdf } = await import("@/lib/exportTemplatePdf");
      await exportTemplatePdf(name, sheet);
    } catch (error) {
      console.error(error);
      window.alert("Esportazione PDF non riuscita. Riprova.");
    } finally {
      setExporting(false);
    }
  }

  const armorValue = displayedArmorClass(sheet);
  const coinValues = coinTotals(sheet.monete);
  const shieldInUse = sheet.scudo || sheet.equipaggiamento.some((item) => item.impugnato && armorById(item.catalogId ?? "")?.category === "scudi");
  const wornArmor = sheet.equipaggiamento.find((item) => item.indossato);
  const ownedArmorIds = new Set(sheet.equipaggiamento.filter((item) => Number(item.quantita ?? "1") > 0)
    .map((item) => armorForEquipment(item)?.id).filter((id): id is string => Boolean(id)));
  const armorChoices = armorCatalog.filter((armor) => armor.category !== "scudi" && ownedArmorIds.has(armor.id)).map((armor) => ({
    id: armor.id,
    label: `${armor.name}${sheet.competenzeArmatura[armor.category] ? "" : " · senza competenza"}`,
  }));
  const wornArmorId = wornArmor ? armorForEquipment(wornArmor)?.id ?? "" : "";
  const hasOwnedShield = ownedArmorIds.has("scudo");
  const otherEquipment = sheet.equipaggiamento.filter((item) => !isArmorEquipment(item));
  const otherEquipmentIndices = sheet.equipaggiamento.flatMap((item, index) => isArmorEquipment(item) ? [] : [index]);
  const grants = grantedPrivileges(sheet);
  const classGrants = grants.filter((grant) => grant.source.startsWith("Classe:") || grant.source.startsWith("Sottoclasse:"));
  const speciesGrants = grants.filter((grant) => grant.source.startsWith("Specie:") || grant.source.startsWith("Lignaggio:"));
  const otherGrants = grants.filter((grant) => !classGrants.includes(grant) && !speciesGrants.includes(grant));
  const recordedOtherPrivileges = sheet.privilegi.filter((item) => !grants.some((grant) =>
    item.titolo.localeCompare(grant.name, "it", { sensitivity: "base" }) === 0));
  const { granted: grantedFeatCards, remaining: recordedOtherFeats } = displayedFeatGrants(sheet);
  const renderGrant = (grant: (typeof grants)[number], index: number) => {
    const functional = grantFunctionalDetails(grant, sheet);
    const savedIndex = sheet.privilegi.findIndex((item) =>
      item.titolo.localeCompare(grant.name, "it", { sensitivity: "base" }) === 0);
    const saved = savedIndex >= 0 ? sheet.privilegi[savedIndex] : null;
    const resources = (sheet.risorse ?? []).filter((resource) =>
      resource.nome.toLocaleLowerCase("it").includes(grant.name.toLocaleLowerCase("it"))
      || resource.fonte.toLocaleLowerCase("it").includes(grant.name.toLocaleLowerCase("it")));
    return <div key={`${grant.source}:${grant.name}:${index}`} className={card}>
      <p className="text-sm font-semibold text-ink">{saved
        ? <InfoLabel id={`privilegio:${savedIndex}`} title={grant.name} />
        : <InfoLabel id={`concesso:${grant.name}`} title={grant.name} />}</p>
      <p className="text-xs text-ink-soft">{grant.source}{grant.level ? ` · livello ${grant.level}` : ""}{grant.page ? ` · Manuale p. ${grant.page}` : ""}</p>
      {saved?.scelte && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{saved.scelte}</p>}
      <FunctionalSummary name={grant.name} sheet={sheet} details={functional} />
      {resources.map((resource, resourceIndex) => <p key={resourceIndex} className="mt-1 text-xs text-ink-soft">{resource.nome}: {resource.massimo - resource.spesi}/{resource.massimo} disponibili</p>)}
    </div>;
  };
  // Incantesimi raggruppati per livello (trucchetti prima), in ordine alfabetico.
  const spellEntries = sheet.incantesimi.map((inc, index) => ({ inc, index, detail: inc.nome ? spellDetails(inc.nome) : null }))
    .sort((a, b) => compareOptionLabels(a.inc.nome, b.inc.nome));
  const spellGroups = [...new Set(spellEntries.map((entry) => entry.detail?.livello ?? -1))]
    .sort((a, b) => (a < 0 ? 99 : a) - (b < 0 ? 99 : b))
    .map((level) => ({ level, spells: spellEntries.filter((entry) => (entry.detail?.livello ?? -1) === level) }));
  const levelNumber = Number(sheet.livello);
  const canLevel = Number.isInteger(levelNumber) && levelNumber >= 1 && levelNumber < 20 && Boolean(sheet.classe);
  const levelReady = canLevel && readyToLevel(sheet.livello, sheet.puntiEsperienza);
  const levelBanner = canLevel && <button type="button" onClick={() => setLevelUpOpen(true)}
    className={`mb-2 flex min-h-12 w-full items-center justify-between gap-2 rounded-xl px-4 text-left ${levelReady ? "bg-accent text-on-accent shadow-md" : "border border-line bg-card/70 text-ink"}`}>
    <span className="text-sm font-semibold">{levelReady ? `⬆ Hai i PE per il livello ${levelNumber + 1}: sali di livello` : `↑ Passa al livello ${levelNumber + 1} (PE ${sheet.puntiEsperienza || 0}/${xpThresholds[levelNumber]})`}</span>
    <span aria-hidden>›</span>
  </button>;
  const pageDefs: { title: string; body: ReactNode }[] = [
    {
      title: "Stato & Identità",
      body: (
        <div className="flex flex-col gap-1.5">
          {levelBanner}
          <div className={grid2}>
            <TextField label="Specie" showInfo={false} value={sheet.specie} valueInfoId={`valore:specie:${sheet.specie}`} locked onChange={() => {}} />
            <TextField label="Classe" showInfo={false} value={sheet.classe} valueInfoId={`valore:classe:${sheet.classe}`} locked onChange={() => {}} />
          </div>
          <div className={grid2}>
            <TextField label="Background" showInfo={false} value={sheet.background} valueInfoId={`valore:background:${sheet.background}`} locked onChange={() => {}} multiline />
            <TextField label="Allineamento" showInfo={false} locked value={sheet.allineamento} valueInfoId={`valore:allineamento:${sheet.allineamento}`} onChange={() => {}} />
          </div>
          <div className="grid grid-cols-3 gap-2.5 [&>*]:min-w-0">
            {lignaggi[sheet.specie] && <TextField label="Lignaggio" showInfo={false} value={sheet.lignaggio} valueInfoId={`valore:lignaggio:${sheet.lignaggio}`} locked onChange={() => {}} />}
            <TextField label="Livello" showInfo={false} locked value={sheet.livello} valueInfoId={`valore:livello:${sheet.livello}`} onChange={() => {}} />
            {Number(sheet.livello) >= subclassLevel && <TextField label="Sottoclasse" showInfo={false} value={sheet.sottoclasse} valueInfoId={`valore:sottoclasse:${sheet.sottoclasse}`} locked onChange={() => {}} />}
            <TextField label="Taglia base" showInfo={false} value={sheet.taglia} valueInfoId={`valore:taglia:${sheet.taglia}`} locked onChange={() => {}} />
            <ComputedField label="Punti Ferita Massimi" value={sheet.puntiFeritaMax} onExplain={(button) => openCalculation({ kind: "maxHp" }, button)} />
            <TextField label="Ispirazione Eroica" showInfo={false} locked value={sheet.ispirazioneEroica ? "Sì" : "No"} valueInfoId="stato:ispirazione" valueInfoTitle={`Ispirazione Eroica: ${sheet.ispirazioneEroica ? "Sì" : "No"}`} onChange={() => {}} />
            <ComputedField label="Classe Armatura" value={armorValue} onExplain={(button) => openCalculation({ kind: "armor" }, button)} />
            <TextField label="Punti Esperienza" showInfo={false} locked value={sheet.puntiEsperienza} valueInfoId="stato:pe" valueInfoTitle={`Punti Esperienza: ${sheet.puntiEsperienza}`} onChange={() => {}} />
            <ComputedField label="Iniziativa" value={initiativeBonus(sheet)} onExplain={(button) => openCalculation({ kind: "initiative" }, button)} />
            <ComputedField label="Bonus Competenza" value={proficiencyBonus(sheet.livello)} onExplain={(button) => openCalculation({ kind: "proficiency" }, button)} />
            <ComputedField label="Percezione Passiva" value={passivePerception(sheet)} onExplain={(button) => openCalculation({ kind: "passive" }, button)} />
            <TextField label="Dadi Vita" showInfo={false} locked value={sheet.dadiVita} displayValue={<DiceText text={sheet.dadiVita} />} valueInfoId="stato:dadiVita" valueInfoTitle={`Dadi Vita: ${sheet.dadiVita}`} onChange={() => {}} />
            <ComputedField label="Velocità" value={sheet.velocita ? `${sheet.velocita.replace(".", ",")} m` : ""} onExplain={(button) => openCalculation({ kind: "speed" }, button)} />
          </div>
          <section className="mt-2 flex flex-col gap-2">
            <h3 className={sectionTitle}>Lingue</h3>
            <ul className="flex flex-col gap-1.5">
              {toList(sheet.lingue).map((language) => (
                <li key={language} className="flex items-center gap-2">
                  <span className="text-ink-faint" aria-hidden>•</span>
                  {languageDetails(language) ?
                    <InfoLabel id={`lingua:${language}`} title={language} className="min-w-0 flex-1 rounded-lg bg-card/40 px-3 py-1 text-[15px] text-ink" /> :
                    <span className="min-w-0 flex-1 rounded-lg bg-card/40 px-3 py-1 text-[15px] text-ink">{language}</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ),
    },
    {
      title: "Caratteristiche",
      body: (
        <div className="flex flex-col gap-1.5">
          {sheet.caratteristiche.map((c) => (
            <div key={c.abbr} className="rounded-xl border border-line bg-card/70 px-3 py-1.5 shadow-sm">
              <div className="mb-1 flex items-center">
                <InfoLabel id={`Valore.${c.abbr}`} title={c.nome} className="text-sm font-bold text-accent" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <InfoLabel id={`Valore.${c.abbr}`} title={c.valore || "—"}
                    dialogTitle={`Punteggio di ${c.nome}: ${c.valore || "non disponibile"}`}
                    className="block w-full py-1 text-center text-2xl font-bold text-ink" />
                </div>
                <ComputedField label="Modificatore" value={abilityModifier(c.valore)}
                  explainLabel={`modificatore di ${c.nome}`}
                  onExplain={(button) => openCalculation({ kind: "modifier", abbr: c.abbr }, button)} />
                <ComputedField label="Tiro Salvezza" value={savingThrowBonus(sheet, c)} competent={c.tsCompetente}
                  explainLabel={`tiro salvezza di ${c.nome}`}
                  onExplain={(button) => openCalculation({ kind: "save", abbr: c.abbr }, button)} />
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Abilità",
      body: (
        <div className="flex flex-col gap-4">
          {Object.entries(CAR_FULL).filter(([caratteristica]) =>
            sheet.abilita.some((a) => a.caratteristica === caratteristica),
          ).map(([caratteristica, titolo]) => (
            <section key={caratteristica}>
              <h3 className={sectionTitle}>{titolo}</h3>
              <div className="grid grid-cols-2 gap-1">
                {sheet.abilita.map((a) => a.caratteristica === caratteristica && (
                  <div key={a.nome} className="rounded-lg border border-line bg-card/70 px-2 py-1 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <CompetenceDot checked={a.competente} label={`Competenza in ${a.nome}`} />
                      <button type="button" aria-label={`Spiega il calcolo del bonus ${a.nome}`}
                        aria-haspopup="dialog"
                        onClick={(event) => openCalculation({ kind: "ability", name: a.nome }, event.currentTarget)}
                        className="min-w-0 flex-1 touch-manipulation text-left text-[11px] font-medium leading-tight [overflow-wrap:anywhere] active:text-accent">
                        {a.nome}
                      </button>
                      <button type="button" aria-label={`Spiega il calcolo del bonus ${a.nome}`}
                        aria-haspopup="dialog"
                        onClick={(event) => openCalculation({ kind: "ability", name: a.nome }, event.currentTarget)}
                        className="ml-1 flex w-10 shrink-0 touch-manipulation items-center justify-end text-sm font-bold text-ink active:text-accent">
                        {abilityBonus(sheet, a) || "—"}
                      </button>
                    </div>
                    {a.competente && <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                      <CompetenceDot checked={a.maestria} label={`Maestria in ${a.nome}`} />
                      <InfoLabel id="Maestria" title="Maestria" />
                    </div>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ),
    },
    {
      title: "Armi",
      body: (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className={sectionTitle}><InfoLabel id="Competenze armatura" title="Competenze armatura" /></h3>
            <div className="flex flex-wrap gap-2">
              {([
                ["Leggere", "leggere"], ["Medie", "medie"], ["Pesanti", "pesanti"], ["Scudi", "scudi"],
              ] as [string, keyof Sheet["competenzeArmatura"]][]).filter(([, key]) => sheet.competenzeArmatura[key]).map(([label]) =>
                <span key={label} className="rounded-full border border-accent bg-accent/12 px-2.5 py-1 text-xs font-medium text-accent"><InfoLabel id={`valore:armatura:${label}`} title={label} /></span>
              )}
              {!Object.values(sheet.competenzeArmatura).some(Boolean) && <span className="text-sm text-ink-faint">Nessuna</span>}
            </div>
          </div>
          <div>
            <h3 className={sectionTitle}><InfoLabel id="Competenze armi" title="Competenze armi" /></h3>
            <WeaponCompetencyList sheet={sheet} />
          </div>
          <div>
            <h3 className={sectionTitle}><InfoLabel id="Padronanze scelte" title="Padronanze scelte" /></h3>
            <WeaponMasteryList sheet={sheet} />
          </div>
          <div>
            <h3 className={sectionTitle}>Armature e scudi posseduti</h3>
            <OwnedArmorEditor sheet={sheet} onChange={(items) => patch({ equipaggiamento: items })} />
          </div>
          <div>
            <h3 className={sectionTitle}><InfoLabel id="armaturaSelezionata" title="Armatura indossata" className="font-display text-[11px] font-semibold uppercase tracking-wide text-heading" /></h3>
            <select aria-label="Armatura indossata" value={wornArmorId} onChange={(event) => patch({ equipaggiamento: selectWornArmor(sheet, event.target.value || null) })} className="max-w-full bg-transparent py-1 text-[15px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {[...armorChoices, { id: "", label: "Nessuna" }]
                .sort((a, b) => compareOptionLabels(a.label, b.label))
                .map((armor) => <option key={armor.id} value={armor.id}>{armor.label}</option>)}
            </select>
            <div className="mt-2"><Toggle label="Scudo" helpId="scudoSelezionato" checked={shieldInUse} onChange={(enabled) => {
              if (enabled && !hasOwnedShield) {
                setShowShieldNotice(true);
                return;
              }
              patch(selectHeldShield(sheet, enabled));
            }} /></div>
            {!armorChoices.length && !hasOwnedShield && <p className="mt-1 text-xs text-ink-soft">Registra prima un&apos;armatura o uno scudo nella sezione qui sopra.</p>}
          </div>
          <div>
            <h3 className={sectionTitle}>Armi</h3>
            <OwnedWeaponList sheet={sheet} onChange={(items) => patch({ armi: items })} onExplain={openCalculation} />
            <div className="mt-3"><AddWeaponSelect sheet={sheet} onAdd={(weaponName) => patch({ armi: [...sheet.armi, { nome: weaponName, quantita: "1", bonus: "", note: "" }] })} /></div>
          </div>
        </div>
      ),
    },
    {
      title: "Equipaggiamento",
      body: (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className={sectionTitle}><InfoLabel id="Competenze negli strumenti" title="Competenze negli strumenti" className="font-display text-[11px] font-semibold uppercase tracking-wide text-heading" /></h3>
            <ToolCompetencyList sheet={sheet} />
          </div>
          <div>
            <h3 className={sectionTitle}>Oggetti</h3>
            <p className="mb-2 text-sm text-ink-soft">Peso catalogato: {inventoryWeight(sheet).knownKg} kg{carryingCapacity(sheet) !== null ? ` / capacità ${carryingCapacity(sheet)} kg` : ""}{inventoryWeight(sheet).unknownItems.length ? `; peso non noto per ${inventoryWeight(sheet).unknownItems.length} voci` : ""}.</p>
            <ObjectListEditor sheet={sheet} items={otherEquipment} indices={otherEquipmentIndices} onChange={(items) => patch({ equipaggiamento: replaceOtherEquipment(sheet.equipaggiamento, items) })} onBundleReceived={noteBundleReceipt} />
          </div>
        </div>
      ),
    },
    {
      title: "Capacità",
      body: (
        <div className="flex flex-col gap-5">
          <section>
            <h3 className={sectionTitle}>Privilegi di classe</h3>
            <div className="flex flex-col gap-2">
              {classGrants.length === 0 && <p className="text-sm text-ink-faint">Nessun privilegio di classe.</p>}
              {classGrants.map(renderGrant)}
              {otherGrants.map(renderGrant)}
              {recordedOtherPrivileges.map((pr, index) => {
                const savedIndex = sheet.privilegi.indexOf(pr);
                return <div key={`${pr.titolo}:${index}`} className={card}>
                  <p className="text-sm font-semibold text-ink"><InfoLabel id={`privilegio:${savedIndex}`} title={pr.titolo || "Privilegio"} /></p>
                  {pr.scelte && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{pr.scelte}</p>}
                  <FunctionalSummary name={pr.titolo} sheet={sheet} details={{ summary: operationalReminder(pr.titolo, sheet)?.parts.map((part) => typeof part === "string" ? part : part.spell).join("") ?? null, full: null }} />
                </div>;
              })}
            </div>
          </section>
          <section>
            <h3 className={sectionTitle}>Tratti della specie</h3>
            <div className="flex flex-col gap-2">
              {speciesGrants.length === 0 && <p className="text-sm text-ink-faint">Nessun tratto della specie.</p>}
              {speciesGrants.map(renderGrant)}
            </div>
          </section>
          <section>
            <h3 className={sectionTitle}>Talenti</h3>
            <div className="flex flex-col gap-2">
              {grantedFeatCards.length === 0 && recordedOtherFeats.length === 0 && <p className="text-sm text-ink-faint">Nessun talento registrato.</p>}
              {grantedFeatCards.map(({ grant, saved }, index) =>
                <div key={`${grant.source}:${grant.name}:${index}`} className={card}>
                  <p className="text-sm font-semibold text-ink">{saved
                    ? <InfoLabel id={`valore:talento:${saved.nome}`} title={saved.nome} />
                    : <InfoLabel id={`valore:talento:${grant.name}`} title={grant.name} />}</p>
                  <p className="text-xs text-ink-soft">{grant.source}{grant.level ? ` · livello ${grant.level}` : ""}{grant.page ? ` · Manuale p. ${grant.page}` : ""}</p>
                  {grant.detail && <p className="text-xs text-ink-soft">{grant.detail}</p>}
                  {saved?.scelte && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{saved.scelte}</p>}
                  <FunctionalSummary name={saved?.nome ?? grant.name} sheet={sheet} details={featFunctionalDetails(saved?.nome ?? grant.name, sheet)} />
                  {(sheet.risorse ?? []).filter((resource) => resource.fonte.toLocaleLowerCase("it").includes(grant.name.toLocaleLowerCase("it")))
                    .map((resource, resourceIndex) => <p key={resourceIndex} className="mt-1 text-xs text-ink-soft">{resource.nome}: {resource.massimo - resource.spesi}/{resource.massimo} disponibili</p>)}
                </div>)}
              {recordedOtherFeats.map((talento, index) => <div key={`${talento.nome}:${index}`} className={card}>
                <p className="text-sm font-semibold text-ink"><InfoLabel id={`valore:talento:${talento.nome}`} title={talento.nome || "Talento"} /></p>
                {talento.scelte && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{talento.scelte}</p>}
                <FunctionalSummary name={talento.nome} sheet={sheet} details={featFunctionalDetails(talento.nome, sheet)} />
              </div>)}
            </div>
          </section>
        </div>
      ),
    },
    {
      title: "Incantesimi",
      body: (
        <div className="flex flex-col gap-3">
          {spellcastingStats(sheet) && <div className="grid grid-cols-2 gap-2">
            <StatTile icon="save" label="CD incantesimi" tone="accent" value={String(spellcastingStats(sheet)?.dc ?? "")}
              sub={`${spellcastingStats(sheet)?.ability} · tiro salvezza del bersaglio`}
              ariaLabel="Spiega la CD dei tiri salvezza degli incantesimi" onClick={(button) => openCalculation({ kind: "spellDc" }, button)} />
            <StatTile icon="hit" label="Attacco magico" tone="accent" value={spellcastingStats(sheet)?.attack}
              sub={`${spellcastingStats(sheet)?.ability} · tiro per colpire`}
              ariaLabel="Spiega il bonus di attacco con incantesimo" onClick={(button) => openCalculation({ kind: "spellAttack" }, button)} />
          </div>}
          {spellSlots(sheet).some((slot) => slot.maximum > 0) && <div className={card}>
            <h3 className={sectionTitle}>Slot incantesimo</h3>
            <div className="divide-y divide-line">
              {spellSlots(sheet).filter((slot) => slot.maximum > 0).map((slot) => <div key={slot.level} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-ink">Livello {slot.level}</p>
                  <p className="text-xs text-ink-soft">Totali: {slot.maximum} · Spesi: {slot.spent}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink">Disponibili: {slot.maximum - slot.spent}</p>
              </div>)}
            </div>
          </div>}
          {sheet.incantesimi.length === 0 && <><h3 className={sectionTitle}>Incantesimi</h3><p className="text-sm text-ink-faint">Niente da mostrare.</p></>}
          {spellGroups.map((group) => <section key={group.level} className="flex flex-col gap-2">
            <h3 className={`${sectionTitle} mb-0 mt-1`}>{group.level === 0 ? "Trucchetti" : group.level > 0 ? `${group.level}° livello` : "Altri incantesimi"}</h3>
            {group.spells.map(({ inc, index, detail }) => {
              const ritual = Boolean(detail?.tempo && /rituale/i.test(detail.tempo));
              const concentration = Boolean(detail?.durata && /concentrazione/i.test(detail.durata));
              const damage = inc.nome ? spellDamageNote(inc.nome) : undefined;
              const castingTime = detail?.tempo ? detail.tempo.replace(/\s+o rituale/i, "").split(",")[0] : "";
              const components = detail?.componenti ? detail.componenti.replace(/\s*\(.*$/, "") : "";
              const own = inc.fonte && inc.fonte !== "classe" && inc.caratteristica ? spellcastingStats(sheet, inc.caratteristica) : null;
              const openSpell = (button: HTMLButtonElement) => inc.nome && openFieldInfo(`incantesimo:${inc.nome}`, inc.nome, button);
              return <div key={index} className={card}>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  {inc.nome ? <InfoLabel id={`incantesimo:${inc.nome}`} title={inc.nome} className="text-[15px] font-semibold text-ink" />
                    : <p className="text-sm text-ink-faint">Incantesimo senza nome</p>}
                  {inc.stato && <Badge tone={inc.stato === "preparato" || inc.stato === "semprePreparato" ? "accent" : "neutral"}>{{ conosciuto: "Conosciuto", libro: "Nel libro", preparato: "Preparato", semprePreparato: "Sempre preparato", concesso: "Concesso" }[inc.stato]}</Badge>}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <StatTile icon="range" label="Gittata" tone="temp" value={detail?.gittata ? capitalized(detail.gittata) : ""} ariaLabel={`Dettagli di ${inc.nome}: gittata`} onClick={inc.nome ? openSpell : undefined} size="sm" />
                  <StatTile icon="damage" label="Danni" tone={damage ? "danger" : "neutral"} value={damage ?? ""} sub={damage ? undefined : "vedi descrizione"} ariaLabel={`Dettagli di ${inc.nome}: danni`} onClick={inc.nome ? openSpell : undefined} size="sm" />
                </div>
                {(castingTime || detail?.durata || components || ritual) && <div className="mt-2 flex flex-wrap gap-1">
                  {castingTime && <Badge icon="time">{capitalized(castingTime)}</Badge>}
                  {detail?.durata && <Badge icon="duration" tone={concentration ? "magic" : "neutral"}>{capitalized(detail.durata)}</Badge>}
                  {ritual && <Badge tone="accent">Rituale</Badge>}
                  {components && <Badge>{components}</Badge>}
                </div>}
                {own && <div className="mt-2 grid grid-cols-2 gap-1.5">
                  <StatTile icon="save" label={`CD (${inc.caratteristica})`} value={String(own.dc)} tone="accent" ariaLabel={`Spiega la CD di ${inc.nome}`} onClick={(button) => openCalculation({ kind: "spellDc", ability: inc.caratteristica }, button)} />
                  <StatTile icon="hit" label={`Attacco (${inc.caratteristica})`} value={own.attack} tone="accent" ariaLabel={`Spiega l'attacco di ${inc.nome}`} onClick={(button) => openCalculation({ kind: "spellAttack", ability: inc.caratteristica }, button)} />
                </div>}
                {inc.fonte && inc.fonte !== "classe" && <p className="mt-1.5 text-xs text-ink-soft">Fonte: {{ classe: "Classe", talento: "Talento", privilegio: "Privilegio", altro: "Altro" }[inc.fonte]}{inc.caratteristica ? ` · caratteristica di lancio ${inc.caratteristica}` : ""}</p>}
              </div>;
            })}
          </section>)}
        </div>
      ),
    },
    {
      title: "Monete",
      body: (
        <div className="flex flex-col gap-3">
          <h3 className={sectionTitle}>Monete</h3>
          <div className="flex flex-col gap-2">
            {COINS.map(([lab, key, unit]) => {
              const count = Number(sheet.monete[key] || 0);
              return <div key={key} className="flex items-center gap-1.5 rounded-xl border border-line bg-card/70 px-3 py-2 shadow-sm">
                <label htmlFor={`coin-${key}`} className="min-w-0 flex-1 text-sm font-semibold text-ink">{lab} <span className="text-xs font-normal text-ink-soft">({unit})</span></label>
                <input
                  id={`coin-${key}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={sheet.monete[key]}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (/^\d*$/.test(next)) patch({ monete: { ...sheet.monete, [key]: next } });
                  }}
                  className="min-w-0 w-16 rounded-lg border border-line bg-parchment/70 px-1 py-1.5 text-center text-lg font-semibold text-ink outline-none focus:border-accent"
                />
                <button type="button" aria-label={`Diminuisci ${lab.toLowerCase()}`} onClick={() => adjustCoin(key, -1)} disabled={!Number.isSafeInteger(count) || count <= 0} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-line bg-parchment/70 text-xl text-accent active:bg-card disabled:opacity-40">−</button>
                <button type="button" aria-label={`Aumenta ${lab.toLowerCase()}`} onClick={() => adjustCoin(key, 1)} disabled={!Number.isSafeInteger(count) || count < 0 || count >= Number.MAX_SAFE_INTEGER} className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-line bg-parchment/70 text-xl text-accent active:bg-card disabled:opacity-40">+</button>
              </div>;
            })}
          </div>
          <div className="mt-2 rounded-xl border border-line bg-card/70 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-heading">Valore equivalente totale</h4>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {COINS.map(([lab, key]) => (
                <div key={key} className="flex justify-between gap-2"><dt className="text-ink-soft">{lab}</dt><dd className="font-semibold text-ink">{coinValues?.[key] ?? "—"}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      ),
    },
    {
      title: "Appunti",
      body: (
        <textarea
          aria-label="Appunti"
          placeholder="Scrivi qui i tuoi appunti…"
          value={sheet.note}
          onChange={(event) => patch({ note: event.target.value })}
          onTouchStart={(event) => { notesTouchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches[0];
            const dx = touch.clientX - notesTouchStart.current.x;
            const dy = touch.clientY - notesTouchStart.current.y;
            if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.25) return;
            if (dx > 0) emblaApi?.scrollPrev();
            else emblaApi?.scrollNext();
          }}
          className="h-full min-h-full w-full touch-pan-y resize-none rounded-xl border border-line bg-card/70 p-4 text-base leading-relaxed text-ink shadow-sm outline-none placeholder:text-ink-faint focus:border-accent"
        />
      ),
    },
    {
      title: "Storia",
      body: (
        <ol className="flex flex-col gap-6 pb-4">
          {characterStory({ ...sheet, eventiStoria: localStoryEvents }, hitPointGains).map((chapter) => (
            <li key={chapter.trigger}>
              <h2 className="rule-tapered mb-2 pb-1 text-base font-bold uppercase tracking-wide text-heading">{chapter.trigger}</h2>
              <ol className="flex flex-col gap-2">
                {chapter.events.map((event, index) => (
                  <li key={`${index}-${event.title}`} className="rounded-xl border border-line bg-card/70 p-3 shadow-sm">
                    <h3 className="text-sm font-semibold text-heading">{event.title}</h3>
                    {event.details.length > 0 && <ul className="mt-1.5 list-disc list-fantasy space-y-1 pl-5 marker:text-accent">
                      {event.details.map((item, detailIndex) => <li key={detailIndex} className="break-words text-sm text-ink-soft">
                        {item.label}
                        {item.consequences && item.consequences.length > 0 && <ul className="mt-1 list-[circle] space-y-1 pl-5 marker:text-accent/70">
                          {item.consequences.map((consequence, consequenceIndex) => <li key={consequenceIndex} className="whitespace-pre-line">{consequence}</li>)}
                        </ul>}
                      </li>)}
                    </ul>}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      ),
    },
  ];

  const pageOrder = [
    "Stato & Identità",
    "Caratteristiche",
    "Abilità",
    "Armi",
    "Equipaggiamento",
    "Monete",
    "Incantesimi",
    "Capacità",
    "Appunti",
    "Storia",
  ];
  const pages = pageOrder.map((t) => pageDefs.find((p) => p.title === t)!);

  return (
    <EditProvider unlocked={true} requireUnlock={() => { }}>
      <FieldInfoContext.Provider value={openFieldInfo}>
        <div className="flex h-dvh flex-col">
          {showShieldNotice && <div role="status" className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-[60] w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-center text-sm font-medium text-parchment shadow-lg">Non possiedi alcuno scudo.</div>}
          <header className="shrink-0 border-b border-line bg-parchment/90 px-4 pb-2 pt-2 backdrop-blur">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex min-w-0 items-center justify-self-start">
                <button
                  type="button"
                  onClick={() => showHub ? router.push("/") : setShowHub(true)}
                  className="flex min-w-0 items-center gap-1.5 justify-self-start text-left"
                  aria-label={showHub ? "Torna alla home generale" : "Torna alla home del personaggio"}
                >
                  <span className="text-lg leading-none text-ink-soft" aria-hidden>
                    ⌂
                  </span>
                  <h1 className="truncate text-base font-bold text-heading">
                    {name || "Senza nome"}
                  </h1>
                </button>
              </div>
              <button
                type="button"
                onClick={undo}
                disabled={histLen === 0}
                className="justify-self-center touch-manipulation rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft transition-opacity disabled:opacity-30"
              >
                ↶ Annulla
              </button>
              <div className="flex shrink-0 items-center gap-2 justify-self-end">
                {!showHub && (
                  <span className="text-xs text-ink-faint">{pages[selected]?.title}</span>
                )}
                <SaveIndicator state={saveState} />
              </div>
            </div>
            {!showHub && (
              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                {pages.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={p.title}
                    onClick={() => emblaApi?.scrollTo(i)}
                    className={`h-1.5 rounded-full transition-all ${i === selected ? "w-5 bg-accent" : "w-1.5 bg-line"
                      }`}
                  />
                ))}
              </div>
            )}
          </header>

          <div className="relative flex-1 overflow-hidden">
            <div className="h-full overflow-hidden" ref={emblaRef}>
              <div className="flex h-full">
                {pages.map((p, i) => (
                  <div
                    key={i}
                    className="no-scrollbar h-full min-w-0 flex-[0_0_100%] overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
                  >
                    {p.body}
                  </div>
                ))}
              </div>
            </div>

            {showHub && (
              <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto bg-parchment/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
                {levelReady && levelBanner}
                <div className="grid grid-cols-2 gap-2.5">
                  {pages.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => goToPage(i)}
                      className="flex min-h-[62px] items-center justify-center rounded-xl border border-line bg-card/70 px-3 py-3 text-center text-sm font-semibold text-ink shadow-sm transition-colors active:bg-card"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="mt-4 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-parchment shadow-sm transition-opacity active:opacity-90 disabled:opacity-50"
                >
                  {exporting ? "Esportazione…" : "Esporta Scheda"}
                </button>
                <button
                  type="button"
                  onClick={openHistory}
                  className="mt-2 w-full rounded-xl border border-line bg-card/70 py-3 text-sm font-semibold text-ink shadow-sm active:bg-card"
                >
                  Storico modifiche
                </button>
              </div>
            )}

            {showHistory && (
              <div className="absolute inset-0 z-30 flex flex-col bg-parchment">
                <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
                  <button type="button" onClick={() => setShowHistory(false)} className="text-sm font-medium text-accent">
                    ← Scheda
                  </button>
                  <h2 className="text-base font-bold text-heading">Storico modifiche</h2>
                  <span className="w-14" />
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {historyLoading ? <p className="text-sm text-ink-soft">Caricamento…</p> :
                    historyError ? <p className="text-sm text-danger-strong">{historyError}</p> :
                      historyEntries.length === 0 ? <p className="text-sm text-ink-soft">Nessuna modifica manuale registrata.</p> :
                        <ol className="flex flex-col gap-3">
                          {groupHistoryByDay(historyEntries).map((day) => (
                            <li key={day.day} className="rounded-xl border border-line bg-card/70 p-3 shadow-sm">
                              <h3 className="text-sm font-semibold capitalize text-heading">
                                {historyDayFormatter.format(new Date(day.timeGroups[0].newest))}
                              </h3>
                              <ol className="mt-2 flex flex-col gap-3">
                                {day.timeGroups.map((group) => (
                                  <li key={group.newest} className="border-t border-line/60 pt-2 first:border-0 first:pt-0">
                                    <time className="text-xs font-semibold text-ink-soft" dateTime={group.newest}>
                                      {historyTimeFormatter.format(new Date(group.oldest))}
                                      {historyTimeFormatter.format(new Date(group.oldest)) !== historyTimeFormatter.format(new Date(group.newest)) && `–${historyTimeFormatter.format(new Date(group.newest))}`}
                                    </time>
                                    <ul className="mt-1 list-disc list-fantasy space-y-1 pl-5 marker:text-accent">
                                      {group.entries.flatMap((entry) => entry.changes.map((change, index) => (
                                        <li key={`${entry.id}-${index}`} className="break-words text-sm text-ink">
                                          <span className="font-semibold">{change.field}</span>{"  "}
                                          <span>{change.before} → {change.after}</span>
                                        </li>
                                      )))}
                                    </ul>
                                  </li>
                                ))}
                              </ol>
                            </li>
                          ))}
                        </ol>}
                </div>
              </div>
            )}

            {calculation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
                onClick={closeCalculation}>
                <div role="dialog" aria-modal="true" aria-labelledby="calculation-title"
                  onClick={(event) => event.stopPropagation()}
                  className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-gold bg-card p-5 text-ink shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <h2 id="calculation-title" className="text-lg font-bold text-heading">{calculation.title}</h2>
                    <button ref={calculationClose} type="button" onClick={closeCalculation}
                      aria-label="Chiudi spiegazione"
                      className="rounded-full border border-line px-2.5 py-1 text-sm text-ink-soft">✕</button>
                  </div>
                  <div className="mt-3"><CalculationContent calculation={calculation} guide={calculationTarget ? calculationEditGuide(calculationTarget) : undefined} /></div>
                </div>
              </div>
            )}
            {fieldInfo && (fieldHelp || spell) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={closeFieldInfo}>
                <div role="dialog" aria-modal="true" aria-labelledby="field-info-title"
                  onClick={(event) => event.stopPropagation()}
                  className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-gold bg-card p-5 text-ink shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <h2 id="field-info-title" className="text-lg font-bold text-heading">{fieldInfo.title}</h2>
                    <button ref={fieldInfoClose} type="button" onClick={closeFieldInfo} aria-label="Chiudi spiegazione"
                      className="rounded-full border border-line px-2.5 py-1 text-sm text-ink-soft">✕</button>
                  </div>
                  {fieldHelp && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed"><DiceText text={fieldHelp.meaning} /></p>}
                  {fieldHelp?.effect && <><h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-heading">Cosa cambia</h3><p className="mt-1 text-sm leading-relaxed"><DiceText text={fieldHelp.effect} /></p></>}
                  {fieldHelp?.page && <p className="mt-4 text-xs text-ink-soft">Manuale del Giocatore 2024, p. {fieldHelp.page}</p>}
                  {object && <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
                    <TextField label="Oggetto" showInfo={false} showEditIcon value={object.nome} onChange={(name) => patch({ equipaggiamento: sheet.equipaggiamento.map((item, index) => index === objectIndex ? { ...item, nome: name, catalogId: gearById(item.catalogId ?? "")?.name === name ? item.catalogId : undefined } : item) })} />
                    <TextField label="Dettaglio personale" showInfo={false} showEditIcon value={object.dettaglio} onChange={(dettaglio) => patch({ equipaggiamento: sheet.equipaggiamento.map((item, index) => index === objectIndex ? { ...item, dettaglio } : item) })} multiline />
                  </div>}
                  {spell && <>
                    <dl className="mt-4 space-y-2 text-sm">
                      {([
                        ["Livello", spell.livello === 0 ? "Trucchetto" : String(spell.livello)],
                        ["Scuola", spell.scuola],
                        ["Classi", spell.classi.join(", ")],
                        ["Tempo di lancio", spell.tempo],
                        ["Gittata", spell.gittata],
                        ["Componenti", spell.componenti],
                        ["Materiale", "materiale" in spell ? spell.materiale : ""],
                        ["Durata", spell.durata],
                      ] as [string, string][]).filter(([, value]) => value).map(([label, value]) =>
                        <div key={label} className="flex justify-between gap-4 border-b border-line/50 py-1"><dt>{label}</dt><dd className="text-right font-semibold">{value}</dd></div>,
                      )}
                    </dl>
                    {spellManual?.descrizione
                      ? <><p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed"><DiceText text={spellManual.descrizione} /></p>
                        <p className="mt-4 text-xs text-ink-soft">Manuale del Giocatore 2024, p. {spellManual.voce.pagina}</p></>
                      : spellName && spellEffects[spellName] && <p className="mt-4 text-sm leading-relaxed"><DiceText text={spellEffects[spellName]} /></p>}
                  </>}
                </div>
              </div>
            )}
          </div>
        </div>
        <LevelUpWizard characterId={id} open={levelUpOpen} onClose={() => setLevelUpOpen(false)} onSaved={adoptSavedSheet}
          scores={Object.fromEntries(sheet.caratteristiche.map((item) => [item.abbr, Number(item.valore) || 0]))} />
      </FieldInfoContext.Provider>
    </EditProvider>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const map = {
    saving: { dot: "bg-ink-faint", text: "salvo…", color: "text-ink-faint" },
    saved: { dot: "bg-heal", text: "salvato", color: "text-ink-faint" },
    error: { dot: "bg-danger", text: "errore", color: "text-danger-strong" },
  } as const;
  const s = map[state];
  return (
    <span className={`ml-2 flex shrink-0 items-center gap-1 text-[10px] ${s.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.text}
    </span>
  );
}
