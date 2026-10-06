"use client";

import {
  Fragment,
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
import regole from "@/lib/manuale-2024-domains.json";
import { spellDetails, canonicalSpellName } from "@/lib/spells";
import { spellEffects } from "@/lib/spellEffects";
import type { Sheet, Arma, Equip } from "@/lib/sheet";
import { abilityBonus, abilityModifier, initiativeBonus, passivePerception, proficiencyBonus, savingThrowBonus } from "@/lib/abilityBonus";
import { calculationExplanation, type CalculationTarget } from "@/lib/calculationExplanation";
import { helpFor, type FieldHelp } from "@/lib/fieldHelp";
import { languageDetails } from "@/lib/languageDetails";
import { weaponByName, weaponCatalog, weaponDetails } from "@/lib/weaponDetails";
import { weaponMasteryLimit } from "@/lib/weaponChoices";
import { isWeaponProficient } from "@/lib/weaponProficiencyRules";
import { weaponAttack } from "@/lib/weaponAttack";
import { armorCatalog, armorById } from "@/lib/armorCatalog";
import { gearCatalog, gearById, gearByName } from "@/lib/gearCatalog";
import { carryingCapacity, inventoryWeight } from "@/lib/inventoryWeight";
import { featGrants, grantedPrivileges } from "@/lib/characterGrants";
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

const lignaggi = regole.lignaggi as Record<string, string[]>;
const historyDayFormatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "full", timeZone: "Europe/Rome",
});
const historyTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
});

const card = "rounded-xl border border-line bg-card/70 p-3 shadow-sm";
const grid2 = "grid grid-cols-2 gap-2.5";
const sectionTitle =
  "mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft";

function calculationEditGuide(target: CalculationTarget): string {
  if (target.kind === "armor") return "Scegli l'armatura indossata e lo scudo impugnato nella pagina Armi; poi la CA si aggiorna con Destrezza e competenza negli scudi. Questo valore non si modifica direttamente.";
  if (target.kind === "initiative") return "Si aggiorna cambiando Destrezza, Livello o il talento Allerta; questo valore non si modifica direttamente.";
  if (target.kind === "proficiency") return "Si aggiorna cambiando il Livello; il bonus non si modifica direttamente.";
  if (target.kind === "passive") return "Si aggiorna con Saggezza e con Competenza o Maestria in Percezione; il valore non si modifica direttamente.";
  if (target.kind === "modifier") return "Si aggiorna cambiando il punteggio della caratteristica; il modificatore non si modifica direttamente.";
  if (target.kind === "save") return "Si aggiorna quando cambiano il punteggio della caratteristica, il livello o una competenza concessa dalle regole.";
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
      <span className="mb-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-ink-soft">
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
  const items = sheet.competenzeStrumenti ?? [];
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

function OwnedWeaponList({ sheet, onChange }: { sheet: Sheet; onChange: (items: Arma[]) => void }) {
  const { unlocked } = useContext(EditContext);
  return <div className="flex flex-col gap-2">
    {sheet.armi.length === 0 && !unlocked && <p className="text-sm text-ink-faint">Niente da mostrare.</p>}
    {sheet.armi.map((weapon, index) => <div key={index} className={`${card} flex items-center gap-2`}>
      <div className="min-w-0 flex-1">
        <InfoLabel id={`armaPosseduta:${index}`} title={weapon.nome || "Arma"} className="text-left text-sm font-semibold text-ink" />
        {weapon.note && <p className="mt-0.5 whitespace-pre-wrap text-xs text-ink-soft">{weapon.note}</p>}
      </div>
      <span className="text-xs text-ink-faint">Quantità</span>
      <InlineInput value={weapon.quantita || "1"} onChange={(value) => onChange(sheet.armi.map((item, itemIndex) => itemIndex === index ? { ...item, quantita: value || "1" } : item))} numeric="unsigned" className="w-8 text-center" />
      {unlocked && <button type="button" aria-label={`Rimuovi ${weapon.nome}`} onClick={() => {
        if (window.confirm(`Eliminare ${weapon.nome}?`)) onChange(sheet.armi.filter((_, itemIndex) => itemIndex !== index));
      }} className="shrink-0 px-1 text-sm font-medium text-red-800">×</button>}
    </div>)}
  </div>;
}

function ObjectListEditor({ items, indices, onChange }: { items: Equip[]; indices: number[]; onChange: (items: Equip[]) => void }) {
  const { unlocked } = useContext(EditContext);
  const patchAt = (index: number, update: Partial<Equip>) => onChange(items.map((item, current) => current === index ? { ...item, ...update } : item));
  const entries = items.map((item, index) => ({ item, index }))
    .sort((a, b) => compareOptionLabels(a.item.nome, b.item.nome));
  const renderItem = ({ item, index }: { item: Equip; index: number }) =>
    <div key={index} className={`${card} flex items-center gap-2`}>
      <div className="min-w-0 flex-1">
        {item.nome || !unlocked ? <InfoLabel id={`oggetto:${indices[index]}`} title={item.nome || "Nuovo oggetto"} className="text-left text-sm font-semibold text-ink" />
          : <TextField label="" showInfo={false} value={item.nome} onChange={(value) => patchAt(index, { nome: value })} />}
        {item.dettaglio && <p className="mt-0.5 whitespace-pre-wrap text-xs text-ink-soft">{item.dettaglio}</p>}
      </div>
      <span className="text-xs text-ink-faint">Quantità</span>
      <InlineInput value={item.quantita || "1"} onChange={(value) => patchAt(index, { quantita: value || "1" })} numeric="unsigned" className="w-8 text-center" />
      {unlocked && <button type="button" onClick={() => { if (window.confirm(`Eliminare ${item.nome || "questo oggetto"}?`)) onChange(items.filter((_, current) => current !== index)); }} aria-label={`Rimuovi ${item.nome || "oggetto"}`} className="shrink-0 px-1 text-sm font-medium text-red-800">×</button>}
    </div>;
  return <div className="flex flex-col gap-2">
    {items.length === 0 && !unlocked && <p className="text-sm text-ink-faint">Niente da mostrare.</p>}
    {entries.map(renderItem)}
    {unlocked && <select aria-label="Aggiungi oggetto" value="" onChange={(event) => {
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
        <span className="min-w-0 flex-1 text-sm font-medium text-ink">{item.nome}</span>
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
}: {
  id: string;
  name: string;
  sheet: Sheet;
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(initialSheet);
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
  const privilegeBase = privilege ? valueDetails("privilegio", privilege.titolo) : null;
  const privilegeInfo = privilegeBase || privilege?.scelte ? {
    meaning: [privilegeBase?.meaning, privilege?.scelte && `Scelte personali: ${privilege.scelte}`].filter(Boolean).join("\n\n"),
    rule: privilegeBase?.rule,
    page: privilegeBase?.page,
  } : null;
  const fieldHelp: FieldHelp | null = fieldInfo && !spellName ? language ? { meaning: language.meaning, rule: true, page: language.page } : weaponCompetencyInfo ?? toolCompetencyInfo ?? masteryInfo ?? armorSelectionInfo ?? shieldSelectionInfo ?? (weapon ? { meaning: weapon, rule: true, page: weaponByName(fieldInfo.id.slice("arma:".length))?.pages } : null) ?? ownedWeaponInfo ?? selectedValue ?? recorded ?? objectInfo ?? privilegeInfo ?? helpFor(fieldInfo.id) : null;

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
    const task = saveChainRef.current.then(() => saveSheet(id, name, nextSheet));
    saveChainRef.current = task.then(() => undefined, () => undefined);
    return task;
  }, [id, name]);

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
  const grantedFeats = featGrants(sheet);
  const recordedOtherFeats = [...sheet.talenti];
  const grantedFeatCards = grantedFeats.map((grant) => {
    const savedIndex = recordedOtherFeats.findIndex((item) => item.nome === grant.name);
    const saved = savedIndex >= 0 ? recordedOtherFeats.splice(savedIndex, 1)[0] : null;
    return { grant, saved };
  });
  const renderGrant = (grant: (typeof grants)[number], index: number) => {
    const savedIndex = sheet.privilegi.findIndex((item) =>
      item.titolo.localeCompare(grant.name, "it", { sensitivity: "base" }) === 0);
    const saved = savedIndex >= 0 ? sheet.privilegi[savedIndex] : null;
    const resources = (sheet.risorse ?? []).filter((resource) =>
      resource.nome.toLocaleLowerCase("it").includes(grant.name.toLocaleLowerCase("it"))
      || resource.fonte.toLocaleLowerCase("it").includes(grant.name.toLocaleLowerCase("it")));
    return <div key={`${grant.source}:${grant.name}:${index}`} className={card}>
      <p className="text-sm font-semibold text-ink">{saved
        ? <InfoLabel id={`privilegio:${savedIndex}`} title={grant.name} />
        : grant.name}</p>
      <p className="text-xs text-ink-soft">{grant.source}{grant.level ? ` · livello ${grant.level}` : ""}{grant.page ? ` · Manuale p. ${grant.page}` : ""}</p>
      {saved?.scelte && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{saved.scelte}</p>}
      {grant.name === "Compagno Selvatico" && <p className="mt-1 text-sm text-ink-soft">
        Lancia <InfoLabel id="incantesimo:Trova famiglio" title="Trova famiglio" className="font-semibold text-accent underline underline-offset-2" /> spendendo uno slot incantesimo o un uso di Forma Selvatica, senza componenti materiali.
      </p>}
      {resources.map((resource, resourceIndex) => <p key={resourceIndex} className="mt-1 text-xs text-ink-soft">{resource.nome}: {resource.massimo - resource.spesi}/{resource.massimo} disponibili</p>)}
    </div>;
  };
  const pageDefs: { title: string; body: ReactNode }[] = [
    {
      title: "Stato & Identità",
      body: (
        <div className="flex flex-col gap-1.5">
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
            <TextField label="Punti Ferita Massimi" showInfo={false} locked value={sheet.puntiFeritaMax} valueInfoId="stato:pfMassimi" valueInfoTitle={`Punti Ferita Massimi: ${sheet.puntiFeritaMax}`} onChange={() => {}} />
            <TextField label="Ispirazione Eroica" showInfo={false} locked value={sheet.ispirazioneEroica ? "Sì" : "No"} valueInfoId="stato:ispirazione" valueInfoTitle={`Ispirazione Eroica: ${sheet.ispirazioneEroica ? "Sì" : "No"}`} onChange={() => {}} />
            <ComputedField label="Classe Armatura" value={armorValue} onExplain={(button) => openCalculation({ kind: "armor" }, button)} />
            <TextField label="Punti Esperienza" showInfo={false} locked value={sheet.puntiEsperienza} valueInfoId="stato:pe" valueInfoTitle={`Punti Esperienza: ${sheet.puntiEsperienza}`} onChange={() => {}} />
            <ComputedField label="Iniziativa" value={initiativeBonus(sheet)} onExplain={(button) => openCalculation({ kind: "initiative" }, button)} />
            <ComputedField label="Bonus Competenza" value={proficiencyBonus(sheet.livello)} onExplain={(button) => openCalculation({ kind: "proficiency" }, button)} />
            <ComputedField label="Percezione Passiva" value={passivePerception(sheet)} onExplain={(button) => openCalculation({ kind: "passive" }, button)} />
            <TextField label="Dadi Vita" showInfo={false} locked value={sheet.dadiVita} displayValue={<DiceText text={sheet.dadiVita} />} valueInfoId="stato:dadiVita" valueInfoTitle={`Dadi Vita: ${sheet.dadiVita}`} onChange={() => {}} />
            <TextField label="Velocità" showInfo={false} locked value={sheet.velocita ? `${sheet.velocita} m` : ""} valueInfoId="stato:velocita" valueInfoTitle={`Velocità: ${sheet.velocita} m`} onChange={() => {}} />
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
            <TextField label="Note lingue" showInfo={false} showEditIcon value={sheet.noteLingue} onChange={(v) => patch({ noteLingue: v })} multiline />
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
            <h3 className={sectionTitle}><InfoLabel id="armaturaSelezionata" title="Armatura indossata" className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft" /></h3>
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
            <OwnedWeaponList sheet={sheet} onChange={(items) => patch({ armi: items })} />
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
            <h3 className={sectionTitle}><InfoLabel id="Competenze negli strumenti" title="Competenze negli strumenti" className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft" /></h3>
            <ToolCompetencyList sheet={sheet} />
          </div>
          <div>
            <h3 className={sectionTitle}>Oggetti</h3>
            <p className="mb-2 text-sm text-ink-soft">Peso catalogato: {inventoryWeight(sheet).knownKg} kg{carryingCapacity(sheet) !== null ? ` / capacità ${carryingCapacity(sheet)} kg` : ""}{inventoryWeight(sheet).unknownItems.length ? `; peso non noto per ${inventoryWeight(sheet).unknownItems.length} voci` : ""}.</p>
            <ObjectListEditor items={otherEquipment} indices={otherEquipmentIndices} onChange={(items) => patch({ equipaggiamento: replaceOtherEquipment(sheet.equipaggiamento, items) })} />
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
              {grantedFeats.length === 0 && recordedOtherFeats.length === 0 && <p className="text-sm text-ink-faint">Nessun talento registrato.</p>}
              {grantedFeatCards.map(({ grant, saved }, index) =>
                <div key={`${grant.source}:${grant.name}:${index}`} className={card}>
                  <p className="text-sm font-semibold text-ink">{saved
                    ? <InfoLabel id={`valore:talento:${saved.nome}`} title={saved.nome} />
                    : grant.name}</p>
                  <p className="text-xs text-ink-soft">{grant.source}{grant.level ? ` · livello ${grant.level}` : ""}{grant.page ? ` · Manuale p. ${grant.page}` : ""}</p>
                  {grant.detail && <p className="text-xs text-ink-soft">{grant.detail}</p>}
                  {saved?.scelte && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{saved.scelte}</p>}
                  {(sheet.risorse ?? []).filter((resource) => resource.fonte.toLocaleLowerCase("it").includes(grant.name.toLocaleLowerCase("it")))
                    .map((resource, resourceIndex) => <p key={resourceIndex} className="mt-1 text-xs text-ink-soft">{resource.nome}: {resource.massimo - resource.spesi}/{resource.massimo} disponibili</p>)}
                </div>)}
              {recordedOtherFeats.map((talento, index) => <div key={`${talento.nome}:${index}`} className={card}>
                <p className="text-sm font-semibold text-ink"><InfoLabel id={`valore:talento:${talento.nome}`} title={talento.nome || "Talento"} /></p>
                {talento.scelte && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{talento.scelte}</p>}
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
          {spellcastingStats(sheet) && <div className="space-y-1">
            <p>CD incantesimi: {spellcastingStats(sheet)?.dc}</p>
            <p>Attacco magico: {spellcastingStats(sheet)?.attack}</p>
            <p className="text-sm text-ink-soft">Calcolo CD: {spellcastingStats(sheet)?.formula}</p>
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
          <h3 className={sectionTitle}>Incantesimi</h3>
          {sheet.incantesimi.length === 0 && <p className="text-sm text-ink-faint">Niente da mostrare.</p>}
          <div className="flex flex-col gap-2">
            {sheet.incantesimi.map((inc, index) => {
              const detail = inc.nome ? spellDetails(inc.nome) : null;
              const ritual = Boolean(detail?.tempo && /rituale/i.test(detail.tempo));
              const concentration = Boolean(detail?.durata && /concentrazione/i.test(detail.durata));
              const summary = [
                detail && (detail.livello === 0 ? "Trucchetto" : `${detail.livello}° livello`),
                detail?.tempo && `Lancio: ${detail.tempo.replace(/\s+o rituale/i, "")}`,
                detail?.gittata && `Gittata: ${detail.gittata}`,
              ].filter(Boolean).join(" · ");
              return <div key={index} className={card}>
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  {inc.nome ? <InfoLabel id={`incantesimo:${inc.nome}`} title={inc.nome} className="text-sm font-semibold text-ink" />
                    : <p className="text-sm text-ink-faint">Incantesimo senza nome</p>}
                  {inc.stato && <span className="text-xs font-medium text-ink-soft">{{ conosciuto: "Conosciuto", libro: "Nel libro", preparato: "Preparato", semprePreparato: "Sempre preparato", concesso: "Concesso" }[inc.stato]}</span>}
                </div>
                {summary && <p className="mt-1 text-xs text-ink-soft">{summary}</p>}
                {(concentration || ritual) && <p className="mt-1 flex flex-wrap gap-x-2 text-xs font-medium text-accent">
                  {concentration && <span>Concentrazione</span>}
                  {ritual && <span>Rituale</span>}
                </p>}
                {inc.fonte && <p className="mt-1 text-xs text-ink-soft">Fonte registrata: {{ classe: "Classe", talento: "Talento", privilegio: "Privilegio", altro: "Altro" }[inc.fonte]}</p>}
                {inc.fonte && inc.fonte !== "classe" && inc.caratteristica && <p className="mt-1 text-xs text-ink-soft">Caratteristica di lancio: {inc.caratteristica}</p>}
              </div>;
            })}
          </div>
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
            <h4 className="text-sm font-semibold text-ink">Valore equivalente totale</h4>
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
  ];

  const pageOrder = [
    "Stato & Identità",
    "Caratteristiche",
    "Abilità",
    "Incantesimi",
    "Armi",
    "Equipaggiamento",
    "Monete",
    "Capacità",
    "Appunti",
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
                  <h1 className="truncate text-base font-bold text-ink">
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
                  <h2 className="text-base font-bold text-ink">Storico modifiche</h2>
                  <span className="w-14" />
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {historyLoading ? <p className="text-sm text-ink-soft">Caricamento…</p> :
                    historyError ? <p className="text-sm text-red-800">{historyError}</p> :
                      historyEntries.length === 0 ? <p className="text-sm text-ink-soft">Nessuna modifica registrata. Lo storico parte da oggi; le modifiche precedenti non erano tracciate.</p> :
                        <ol className="flex flex-col gap-3">
                          {groupHistoryByDay(historyEntries).map((day) => (
                            <li key={day.day} className="rounded-xl border border-line bg-card/70 p-3 shadow-sm">
                              <h3 className="text-sm font-semibold capitalize text-accent">
                                {historyDayFormatter.format(new Date(day.timeGroups[0].newest))}
                              </h3>
                              <ol className="mt-2 flex flex-col gap-3">
                                {day.timeGroups.map((group) => (
                                  <li key={group.newest} className="border-t border-line/60 pt-2 first:border-0 first:pt-0">
                                    <time className="text-xs font-semibold text-ink-soft" dateTime={group.newest}>
                                      {historyTimeFormatter.format(new Date(group.oldest))}
                                      {historyTimeFormatter.format(new Date(group.oldest)) !== historyTimeFormatter.format(new Date(group.newest)) && `–${historyTimeFormatter.format(new Date(group.newest))}`}
                                    </time>
                                    <ul className="mt-1 list-disc space-y-1 pl-5 marker:text-accent">
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
                  className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-parchment p-5 text-ink shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <h2 id="calculation-title" className="text-lg font-bold text-accent">{calculation.title}</h2>
                    <button ref={calculationClose} type="button" onClick={closeCalculation}
                      aria-label="Chiudi spiegazione"
                      className="rounded-full border border-line px-2.5 py-1 text-sm text-ink-soft">✕</button>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed">{calculation.rule}</p>
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
                    <div className="mt-2 text-lg font-bold text-accent">Risultato: {calculation.result || "—"}</div>
                  </div>
                  {calculationTarget && <div className="mt-4 text-sm"><h3 className="font-semibold text-accent">Come si modifica</h3><p className="mt-1">{calculationEditGuide(calculationTarget)}</p></div>}
                </div>
              </div>
            )}
            {fieldInfo && (fieldHelp || spell) && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={closeFieldInfo}>
                <div role="dialog" aria-modal="true" aria-labelledby="field-info-title"
                  onClick={(event) => event.stopPropagation()}
                  className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-parchment p-5 text-ink shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <h2 id="field-info-title" className="text-lg font-bold text-accent">{fieldInfo.title}</h2>
                    <button ref={fieldInfoClose} type="button" onClick={closeFieldInfo} aria-label="Chiudi spiegazione"
                      className="rounded-full border border-line px-2.5 py-1 text-sm text-ink-soft">✕</button>
                  </div>
                  {fieldHelp && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed"><DiceText text={fieldHelp.meaning} /></p>}
                  {fieldHelp?.effect && <><h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Cosa cambia</h3><p className="mt-1 text-sm leading-relaxed"><DiceText text={fieldHelp.effect} /></p></>}
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
                    {spellName && spellEffects[spellName] && <p className="mt-4 text-sm leading-relaxed"><DiceText text={spellEffects[spellName]} /></p>}
                  </>}
                </div>
              </div>
            )}
          </div>
        </div>
      </FieldInfoContext.Provider>
    </EditProvider>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const map = {
    saving: { dot: "bg-ink-faint", text: "salvo…", color: "text-ink-faint" },
    saved: { dot: "bg-green-700", text: "salvato", color: "text-ink-faint" },
    error: { dot: "bg-red-700", text: "errore", color: "text-red-800" },
  } as const;
  const s = map[state];
  return (
    <span className={`ml-2 flex shrink-0 items-center gap-1 text-[10px] ${s.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.text}
    </span>
  );
}
