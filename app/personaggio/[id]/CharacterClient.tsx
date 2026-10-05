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
import {
  TextField,
  NumberUnitField,
  InlineInput,
  Toggle,
  EditProvider,
  EditContext,
  FieldInfoContext,
  InfoLabel,
  useDoubleTap,
} from "@/components/fields";
import { getCharacterHistory, saveSheet, type HistoryEntry } from "@/app/actions";
import { groupHistoryByDay } from "@/lib/history";
import { exportSheetPdf } from "@/lib/exportPdf";
import regole from "@/lib/regole-srd-2024.json";
import { spellNames, spellDetails, canonicalSpellName } from "@/lib/spells";
import { spellEffects } from "@/lib/spellEffects";
import type { Sheet, Caratteristica, Abilita, Arma, Equip, Incantesimo } from "@/lib/sheet";
import { abilityBonus, abilityModifier, initiativeBonus, passivePerception, proficiencyBonus, savingThrowBonus } from "@/lib/abilityBonus";
import { calculationExplanation, type CalculationTarget } from "@/lib/calculationExplanation";
import { speciesSizes } from "@/lib/creationRules";
import { helpFor, type FieldHelp } from "@/lib/fieldHelp";
import { languageDetails } from "@/lib/languageDetails";
import { weaponByName, weaponDetails, weaponNames } from "@/lib/weaponDetails";
import { displayedWeaponAttack, weaponAttack } from "@/lib/weaponAttack";
import { armorCatalog, armorById } from "@/lib/armorCatalog";
import { gearCatalog, gearById } from "@/lib/gearCatalog";
import { carryingCapacity, inventoryWeight } from "@/lib/inventoryWeight";
import { availableFeats } from "@/lib/featCatalog";
import { availableClassSpells, spellSlots, spellcastingStats } from "@/lib/spellcasting";
import { masteryEffects } from "@/lib/weaponMastery";
import { coinTotalGold } from "@/lib/coins";
import { grantCompetencies, setCheckboxCompetency } from "@/lib/competencySources";
import { grantClassProficiencies } from "@/lib/classSavingThrows";
import { subclassLevel } from "@/lib/classProgression";
import { valueDetails } from "@/lib/valueDetails";
import { equipmentDetails } from "@/lib/equipmentDetails";
import { recordedValueDetails } from "@/lib/recordedValueDetails";
import { calculatedArmorClass, displayedArmorClass } from "@/lib/armorClass";

const classi = Object.keys(regole.classi);
const sottoclassi = regole.classi as Record<string, string[]>;
const lignaggi = regole.lignaggi as Record<string, string[]>;
const lingue = [...regole.lingue.standard, ...regole.lingue.rare];
const nomiArmi = weaponNames;
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
  if (target.kind === "initiative") return "Si aggiorna cambiando Destrezza, Livello o il talento Allerta; questo valore non si modifica direttamente.";
  if (target.kind === "proficiency") return "Si aggiorna cambiando il Livello; il bonus non si modifica direttamente.";
  if (target.kind === "passive") return "Si aggiorna con Saggezza e con Competenza o Maestria in Percezione; il valore non si modifica direttamente.";
  if (target.kind === "modifier") return "Si aggiorna cambiando il punteggio della caratteristica; il modificatore non si modifica direttamente.";
  if (target.kind === "save") return "Si aggiorna cambiando il punteggio della caratteristica o il Livello. La competenza si può acquisire dalla spunta e resta fissa.";
  return "Si aggiorna cambiando il punteggio della caratteristica o il Livello. Competenza e Maestria si possono acquisire dalle rispettive spunte e restano fisse.";
}

function ComputedField({ label, value, explainLabel, onExplain }: {
  label: string;
  value: string;
  explainLabel?: string;
  onExplain: (button: HTMLButtonElement) => void;
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

// Lista puntata con voci modificabili (doppio tocco) e aggiungi/rimuovi.
function StringListEditor({
  items,
  onChange,
  addLabel,
  options,
  lockExisting = false,
  helpId,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  addLabel: string;
  options?: readonly string[];
  lockExisting?: boolean;
  helpId?: string;
}) {
  const { unlocked } = useContext(EditContext);
  return (
    <ul className="flex flex-col gap-1.5">
      {items.length === 0 && !unlocked && <li className="text-sm text-ink-faint">—</li>}
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="text-ink-faint" aria-hidden>
            •
          </span>
          <div className="min-w-0 flex-1">
            {options && lockExisting && it ?
              (helpId === "Lingue" && !languageDetails(it)) ?
                <span className="block w-full rounded-lg bg-card/40 px-3 py-1 text-[15px] text-ink">{it}</span> :
                <InfoLabel id={helpId === "Lingue" ? `lingua:${it}` : helpId === "Competenze armi" ? `arma:${it}` : helpId ?? it} title={it} className="w-full rounded-lg bg-card/40 px-3 py-1 text-[15px] text-ink" /> : options ?
              <TextField label="" helpId={helpId} value={it} options={options} onChange={(v) => onChange(items.map((x, idx) => (idx === i ? v : x)))} /> :
              <InlineInput value={it} onChange={(v) => onChange(items.map((x, idx) => (idx === i ? v : x)))} className="flex-1" placeholder="…" />}
          </div>
          {unlocked && !(lockExisting && it) && (
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label="Rimuovi"
              className="shrink-0 px-1 text-sm font-medium text-red-800"
            >
              ×
            </button>
          )}
        </li>
      ))}
      {unlocked && (
        <li>
          <button
            type="button"
            onClick={() => onChange([...items, ""])}
            className="rounded-lg border border-dashed border-line px-3 py-1.5 text-sm font-medium text-ink-soft active:bg-card/60"
          >
            + {addLabel}
          </button>
        </li>
      )}
    </ul>
  );
}

// Pallino di competenza per la pagina Abilità: doppio tocco per cambiarlo
// (o per richiedere lo sblocco se la scheda è bloccata).
function CompetenceDot({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const { unlocked, requireUnlock } = useContext(EditContext);
  const onTap = useDoubleTap(() =>
    unlocked ? onChange(!checked) : requireUnlock(),
  );
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label="Competente"
      className={`grid h-4 w-4 shrink-0 touch-manipulation place-items-center rounded-full border text-[9px] transition-colors ${
        checked
          ? "border-accent bg-accent text-parchment"
          : "border-ink-faint text-transparent"
      }`}
    >
      ✓
    </button>
  );
}

function ArrayEditor<T>({
  items,
  onChange,
  makeNew,
  addLabel,
  renderItem,
  collapsible = false,
  titleOf,
  onTitleClick,
  subtitleOf,
  headerAccessory,
  maxItems,
  lockItem,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  makeNew: () => T;
  addLabel: string;
  renderItem: (item: T, patch: (p: Partial<T>) => void, index: number, locked: boolean) => ReactNode;
  collapsible?: boolean;
  titleOf?: (item: T, index: number) => string;
  onTitleClick?: (item: T, index: number, button: HTMLButtonElement) => boolean;
  subtitleOf?: (item: T, index: number) => string;
  headerAccessory?: (item: T, patch: (p: Partial<T>) => void, index: number) => ReactNode;
  maxItems?: number;
  lockItem?: (item: T) => boolean;
}) {
  const { unlocked } = useContext(EditContext);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const patchAt = (i: number, p: Partial<T>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...p } : it)));
  const removeAt = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i));
    setExpanded((prev) =>
      new Set([...prev].filter((x) => x !== i).map((x) => (x > i ? x - 1 : x))),
    );
  };
  const add = () => {
    const newIndex = items.length;
    onChange([...items, makeNew()]);
    setExpanded((prev) => new Set(prev).add(newIndex));
  };
  const toggle = (i: number) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  const addButton = unlocked && (maxItems === undefined || items.length < maxItems) && (
    <button
      type="button"
      onClick={add}
      className="rounded-lg border border-dashed border-line px-4 py-3 text-sm font-medium text-ink-soft active:bg-card/60"
    >
      + {addLabel}
    </button>
  );

  if (collapsible) {
    return (
      <div className="flex flex-col gap-2">
        {items.length === 0 && !unlocked && (
          <p className="text-sm text-ink-faint">Niente da mostrare.</p>
        )}
        {items.map((item, i) => {
          const open = expanded.has(i);
          const sub = subtitleOf?.(item, i);
          return (
            <div key={i} className="overflow-hidden rounded-xl border border-line bg-card/70 shadow-sm">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={(event) => { if (!onTitleClick?.(item, i, event.currentTarget)) toggle(i); }}
                  className="flex min-w-0 flex-1 items-center text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {titleOf?.(item, i) || `Elemento ${i + 1}`}
                    </span>
                    {sub && <span className="block truncate text-xs text-ink-faint">{sub}</span>}
                  </span>
                </button>
                {headerAccessory && (
                  <div className="shrink-0">{headerAccessory(item, (p) => patchAt(i, p), i)}</div>
                )}
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-label={open ? "Comprimi" : "Espandi"}
                  className={`shrink-0 text-lg leading-none text-ink-soft transition-transform ${
                    open ? "rotate-90" : ""
                  }`}
                >
                  ›
                </button>
              </div>
              {open && (
                <div className="border-t border-line/70 px-3 py-3">
                  {renderItem(item, (p) => patchAt(i, p), i, lockItem?.(item) ?? false)}
                  {unlocked && !lockItem?.(item) && (
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      className="mt-3 text-xs font-medium text-red-800"
                    >
                      Rimuovi
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {addButton}
        {unlocked && maxItems !== undefined && items.length >= maxItems && (
          <p className="text-xs text-ink-faint">Massimo {maxItems} elementi.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {items.length === 0 && !unlocked && (
        <p className="text-sm text-ink-faint">Niente da mostrare.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className={card}>
          {renderItem(item, (p) => patchAt(i, p), i, lockItem?.(item) ?? false)}
          {unlocked && !lockItem?.(item) && (
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="mt-3 text-xs font-medium text-red-800"
            >
              Rimuovi
            </button>
          )}
        </div>
      ))}
      {addButton}
      {unlocked && maxItems !== undefined && items.length >= maxItems && (
        <p className="text-xs text-ink-faint">Massimo {maxItems} elementi.</p>
      )}
    </div>
  );
}

const COINS: [string, keyof Sheet["monete"]][] = [
  ["Rame", "rame"],
  ["Argento", "argento"],
  ["Electrum", "electrum"],
  ["Oro", "oro"],
  ["Platino", "platino"],
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
  const [sheet, setSheet] = useState<Sheet>(initialSheet);
  const [name] = useState(initialName);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true });
  const [selected, setSelected] = useState(0);

  // All'ingresso mostriamo la "home" del personaggio con l'indice delle sezioni.
  const [showHub, setShowHub] = useState(true);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const firstRun = useRef(true);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const [showHistory, setShowHistory] = useState(false);
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
  const ownedWeaponIndex = fieldInfo?.id.startsWith("armaPosseduta:") ? Number(fieldInfo.id.slice("armaPosseduta:".length)) : -1;
  const ownedWeapon = ownedWeaponIndex >= 0 ? sheet.armi[ownedWeaponIndex] : null;
  const ownedWeaponBase = ownedWeapon ? weaponDetails(ownedWeapon.nome) : null;
  const ownedWeaponCalculation = ownedWeapon ? weaponAttack(sheet, ownedWeapon) : null;
  const ownedMastery = ownedWeapon && (sheet.padronanzeArmi ?? []).includes(ownedWeapon.nome) ? weaponByName(ownedWeapon.nome)?.mastery : null;
  const ownedWeaponInfo = ownedWeaponBase || ownedWeapon?.note ? {
    meaning: [ownedWeaponBase, ownedWeaponCalculation && `Attacco: ${ownedWeaponCalculation.formula}. Danno: ${ownedWeaponCalculation.damage || "punteggio da inserire"}.`, ownedMastery && `Padronanza scelta: ${ownedMastery}. ${masteryEffects[ownedMastery] ?? ""}`, ownedWeapon?.bonus && `Bonus al tiro per colpire manuale: ${ownedWeapon.bonus} (prevale sul calcolo).`, ownedWeapon?.note && `Dettaglio personale: ${ownedWeapon.note}`].filter(Boolean).join("\n\n"),
    rule: Boolean(ownedWeaponBase),
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
  const objectInfo = object ? equipmentDetails(object.nome, object.dettaglio) : null;
  const privilegeIndex = fieldInfo?.id.startsWith("privilegio:") ? Number(fieldInfo.id.slice("privilegio:".length)) : -1;
  const privilege = privilegeIndex >= 0 ? sheet.privilegi[privilegeIndex] : null;
  const privilegeBase = privilege ? valueDetails("privilegio", privilege.titolo) : null;
  const privilegeInfo = privilegeBase || privilege?.scelte ? {
    meaning: [privilegeBase?.meaning, privilege?.scelte && `Scelte personali: ${privilege.scelte}`].filter(Boolean).join("\n\n"),
    rule: privilegeBase?.rule,
  } : null;
  const fieldHelp: FieldHelp | null = fieldInfo && !spellName ? language ? { meaning: language.meaning, rule: true } : weapon ? { meaning: weapon, rule: true } : ownedWeaponInfo ?? selectedValue ?? recorded ?? objectInfo ?? privilegeInfo ?? helpFor(fieldInfo.id) : null;
  const sourcePage = spell?.pagina ?? language?.page ?? selectedValue?.page ?? objectInfo?.page ?? (weapon || ownedWeaponBase ? 103 : undefined);

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
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
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
  const updateCar = (i: number, p: Partial<Caratteristica>) => {
    snapshot();
    setSheet((s) => ({
      ...s,
      caratteristiche: s.caratteristiche.map((c, idx) => (idx === i ? { ...c, ...p } : c)),
    }));
  };
  const updateAbi = (i: number, p: Partial<Abilita>) => {
    snapshot();
    setSheet((s) => ({
      ...s,
      abilita: s.abilita.map((a, idx) => (idx === i ? { ...a, ...p } : a)),
    }));
  };

  function goToPage(i: number) {
    emblaApi?.scrollTo(i, true);
    setShowHub(false);
  }

  const [exporting, setExporting] = useState<"current" | "template" | null>(null);
  async function handleExport(kind: "current" | "template") {
    setExporting(kind);
    try {
      if (kind === "current") await exportSheetPdf(name, sheet);
      else {
        const { exportTemplatePdf } = await import("@/lib/exportTemplatePdf");
        await exportTemplatePdf(name, sheet);
      }
    } catch (error) {
      console.error(error);
      window.alert("Esportazione PDF non riuscita. Riprova.");
    } finally {
      setExporting(null);
    }
  }

  const armorCalculation = calculatedArmorClass(sheet);
  const armorValue = displayedArmorClass(sheet);
  const shieldInUse = sheet.scudo || sheet.equipaggiamento.some((item) => item.impugnato && armorById(item.catalogId ?? "")?.category === "scudi");
  const pageDefs: { title: string; body: ReactNode }[] = [
    {
      title: "Stato & Identità",
      body: (
        <div className="flex flex-col gap-1.5">
          <div className={grid2}>
            <TextField label="Livello" showInfo={false} showEditIcon value={sheet.livello} valueInfoId={`valore:livello:${sheet.livello}`} options={regole.livelliPersonaggio} allowEmpty={false} onChange={(v) => patch({ livello: v })} />
            <TextField label="Classe" showInfo={false} showEditIcon value={sheet.classe} valueInfoId={`valore:classe:${sheet.classe}`} options={classi} locked={Boolean(sheet.classe)} onChange={(v) => patch(grantClassProficiencies({ ...sheet, classe: v, sottoclasse: v === sheet.classe ? sheet.sottoclasse : "" }))} />
          </div>
          {Number(sheet.livello) >= subclassLevel && <TextField label="Sottoclasse" showInfo={false} showEditIcon value={sheet.sottoclasse} valueInfoId={`valore:sottoclasse:${sheet.sottoclasse}`} options={sottoclassi[sheet.classe] ?? []} locked={Boolean(sheet.sottoclasse)} onChange={(v) => patch({ sottoclasse: v })} />}
          <div className={grid2}>
            <TextField label="Punti Ferita" showInfo={false} showEditIcon value={sheet.puntiFerita} valueInfoId="stato:pf" valueInfoTitle={`Punti Ferita: ${sheet.puntiFerita}`} numeric="unsigned" onChange={(v) => patch({ puntiFerita: v })} />
            <TextField label="Punti Ferita Massimi" showInfo={false} showEditIcon value={sheet.puntiFeritaMax} valueInfoId="stato:pfMassimi" valueInfoTitle={`Punti Ferita Massimi: ${sheet.puntiFeritaMax}`} numeric="unsigned" onChange={(v) => patch({ puntiFeritaMax: v })} />
          </div>
          <div className={grid2}>
            <div>
              <TextField label="Classe Armatura" showInfo={false} showEditIcon numeric="unsigned" value={armorValue} valueInfoId="stato:ca" valueInfoTitle={`Classe Armatura: ${armorValue || "—"}`} onChange={(v) => patch({ classeArmaturaOverride: v ? Number(v) : null })} />
              <p className="mt-0.5 text-[10px] text-ink-soft">{sheet.classeArmaturaOverride != null ? `Valore manuale · calcolo ${armorCalculation?.value ?? "non disponibile"}` : armorCalculation ? `Calcolata: ${armorCalculation.formula}` : "Inserisci Destrezza per il calcolo automatico"}</p>
            </div>
            <TextField label="Scudo" showInfo={false} showEditIcon value={shieldInUse ? "Sì" : "No"} valueInfoId="stato:scudo" valueInfoTitle={`Scudo: ${shieldInUse ? "Sì" : "No"}`} options={["Sì", "No"]} onChange={(v) => patch(v === "Sì" ? { scudo: true } : { scudo: false, equipaggiamento: sheet.equipaggiamento.map((item) => item.impugnato && armorById(item.catalogId ?? "")?.category === "scudi" ? { ...item, impugnato: false } : item) })} />
          </div>
          <div className={grid2}>
            <ComputedField label="Iniziativa" value={initiativeBonus(sheet)} onExplain={(button) => openCalculation({ kind: "initiative" }, button)} />
          </div>
          <div className={grid2}>
            <ComputedField label="Bonus Competenza" value={proficiencyBonus(sheet.livello)}
              onExplain={(button) => openCalculation({ kind: "proficiency" }, button)} />
            <ComputedField label="Percezione Passiva" value={passivePerception(sheet)}
              onExplain={(button) => openCalculation({ kind: "passive" }, button)} />
          </div>
          <div className={grid2}>
            <TextField label="Dadi Vita" showInfo={false} showEditIcon value={sheet.dadiVita} valueInfoId="stato:dadiVita" valueInfoTitle={`Dadi Vita: ${sheet.dadiVita}`} numeric="dice" onChange={(v) => patch({ dadiVita: v })} />
            <TextField label="Punti Esperienza" showInfo={false} showEditIcon value={sheet.puntiEsperienza} valueInfoId="stato:pe" valueInfoTitle={`Punti Esperienza: ${sheet.puntiEsperienza}`} numeric="unsigned" onChange={(v) => patch({ puntiEsperienza: v })} />
          </div>
          <div className={grid2}>
            <TextField label="Ispirazione Eroica" showInfo={false} showEditIcon value={sheet.ispirazioneEroica ? "Sì" : "No"} valueInfoId="stato:ispirazione" valueInfoTitle={`Ispirazione Eroica: ${sheet.ispirazioneEroica ? "Sì" : "No"}`} options={["Sì", "No"]} onChange={(v) => patch({ ispirazioneEroica: v === "Sì" })} />
            <NumberUnitField label="Velocità" value={sheet.velocita} valueInfoId="stato:velocita" unit="m" showEditIcon onChange={(v) => patch({ velocita: v })} />
          </div>
          <div className={grid2}>
            <TextField label="Allineamento" showInfo={false} showEditIcon value={sheet.allineamento} valueInfoId={`valore:allineamento:${sheet.allineamento}`} options={regole.allineamenti} onChange={(v) => patch({ allineamento: v })} />
            <TextField label="Taglia base" showInfo={false} showEditIcon value={sheet.taglia} valueInfoId={`valore:taglia:${sheet.taglia}`} options={speciesSizes[sheet.specie] ?? regole.taglie} locked={Boolean(sheet.taglia)} onChange={(v) => patch({ taglia: v })} />
          </div>
          <div className={grid2}>
            <TextField label="Specie" showInfo={false} showEditIcon value={sheet.specie} valueInfoId={`valore:specie:${sheet.specie}`} options={regole.specie} locked={Boolean(sheet.specie)} onChange={(v) => patch({ specie: v, lignaggio: v === sheet.specie ? sheet.lignaggio : "", taglia: v === sheet.specie ? sheet.taglia : speciesSizes[v]?.[0] ?? "" })} />
            <TextField label="Background" showInfo={false} showEditIcon value={sheet.background} valueInfoId={`valore:background:${sheet.background}`} options={regole.background} locked={Boolean(sheet.background)} onChange={(v) => patch({ background: v })} multiline />
          </div>
          {lignaggi[sheet.specie] && <TextField label="Lignaggio" showInfo={false} showEditIcon value={sheet.lignaggio} valueInfoId={`valore:lignaggio:${sheet.lignaggio}`} options={lignaggi[sheet.specie]} locked={Boolean(sheet.lignaggio)} onChange={(v) => patch({ lignaggio: v })} />}
        </div>
      ),
    },
    {
      title: "Lingue",
      body: (
        <div className="flex flex-col gap-2">
        <h3 className={sectionTitle}>Lingue</h3>
        <StringListEditor
          items={toList(sheet.lingue)}
          onChange={(v) => patch({ lingue: v })}
          addLabel="Aggiungi lingua"
          options={lingue}
          lockExisting
          helpId="Lingue"
        />
        <TextField label="Note lingue" showInfo={false} value={sheet.noteLingue} onChange={(v) => patch({ noteLingue: v })} multiline />
        </div>
      ),
    },
    {
      title: "Caratteristiche",
      body: (
        <div className="flex flex-col gap-1.5">
          {sheet.caratteristiche.map((c, i) => (
            <div key={c.abbr} className="rounded-xl border border-line bg-card/70 px-3 py-1.5 shadow-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-bold text-accent">{c.nome}</span>
                <Toggle
                  label="Tiro Salvezza"
                  checked={c.tsCompetente}
                  onExplain={(button) => openCalculation({ kind: "save", abbr: c.abbr }, button)}
                  onChange={(v) => patch(setCheckboxCompetency(sheet, "tiroSalvezza", c.abbr, v))}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <InlineInput value={c.valore} onChange={(v) => updateCar(i, { valore: v })}
                    numeric="unsigned" large className="w-full text-center font-bold" />
                </div>
                <ComputedField label="Modificatore" value={abilityModifier(c.valore)}
                  explainLabel={`modificatore di ${c.nome}`}
                  onExplain={(button) => openCalculation({ kind: "modifier", abbr: c.abbr }, button)} />
                <ComputedField label="Tiro Salvezza" value={savingThrowBonus(sheet, c)}
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
                {sheet.abilita.map((a, i) => a.caratteristica === caratteristica && (
                  <div key={a.nome} className="rounded-lg border border-line bg-card/70 px-2 py-1 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <CompetenceDot checked={a.competente}
                        onChange={(v) => patch(setCheckboxCompetency(sheet, "abilita", a.nome, v))} />
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
                    {a.competente && <div className="mt-1"><Toggle label="Maestria" checked={a.maestria} onExplain={(button) => openCalculation({ kind: "ability", name: a.nome }, button)} onChange={(v) => updateAbi(i, { maestria: v })} /></div>}
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
            <h3 className={sectionTitle}>Competenze armi</h3>
            <StringListEditor
              items={toList(sheet.competenzeArmi)}
              onChange={(v) => patch({ competenzeArmi: v })}
              addLabel="Aggiungi competenza"
              options={[...regole.competenzeArmi, ...nomiArmi]}
              lockExisting
              helpId="Competenze armi"
            />
          </div>
          <div>
            <h3 className={sectionTitle}>Padronanze scelte</h3>
            <StringListEditor items={sheet.padronanzeArmi ?? []} onChange={(items) => patch({ padronanzeArmi: items })} addLabel="Aggiungi padronanza" options={nomiArmi} helpId="Competenze armi" />
          </div>
          <div>
            <h3 className={sectionTitle}>Armi</h3>
            <ArrayEditor
              items={sheet.armi}
              onChange={(items) => patch({ armi: items })}
              makeNew={(): Arma => ({ nome: "", quantita: "", bonus: "", note: "" })}
              addLabel="Aggiungi arma"
              collapsible
              titleOf={(a) => a.nome || "Nuova arma"}
              onTitleClick={(a, index, button) => { if (!a.nome) return false; openFieldInfo(`armaPosseduta:${index}`, a.nome, button); return true; }}
              subtitleOf={(a) => displayedWeaponAttack(sheet, a)}
              headerAccessory={(a, p) => (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-ink-faint">Quantità</span>
                  <InlineInput
                    value={a.quantita}
                    onChange={(v) => p({ quantita: v })}
                    numeric="unsigned"
                    className="w-10 text-center"
                    placeholder="—"
                  />
                </div>
              )}
              renderItem={(a, p, index) => (
                <div className="flex flex-col gap-2">
                  <TextField label="Nome" showInfo={false} value={a.nome} valueInfoId={a.nome ? `armaPosseduta:${index}` : undefined} options={nomiArmi} onChange={(v) => p({ nome: v, modo: "base", caratteristica: undefined })} />
                  {weaponByName(a.nome)?.kind === "mischia" && (weaponByName(a.nome)?.thrown || weaponByName(a.nome)?.versatileDie) && (
                    <TextField label="Uso" showInfo={false} value={a.modo === "lancio" ? "Lancio" : a.modo === "dueMani" ? "Due mani" : "Mischia"} options={["Mischia", ...(weaponByName(a.nome)?.thrown ? ["Lancio"] : []), ...(weaponByName(a.nome)?.versatileDie ? ["Due mani"] : [])]} onChange={(v) => p({ modo: v === "Lancio" ? "lancio" : v === "Due mani" ? "dueMani" : "base" })} />
                  )}
                  {weaponByName(a.nome)?.finesse && (
                    <TextField label="Caratteristica" showInfo={false} value={a.caratteristica ?? (weaponByName(a.nome)?.kind === "distanza" ? "DES" : "FOR")} options={["FOR", "DES"]} onChange={(v) => p({ caratteristica: v as "FOR" | "DES" })} />
                  )}
                  {weaponAttack(sheet, a) && <p className="text-sm text-ink-soft">Attacco calcolato: {weaponAttack(sheet, a)?.attack || "—"} · Danno: {weaponAttack(sheet, a)?.damage || "—"}</p>}
                  <TextField label="Arma magica SRD" showInfo={false} value={a.bonusMagico ? `+${a.bonusMagico}` : "Nessuna"} options={["Nessuna", "+1", "+2", "+3"]} onChange={(v) => p({ bonusMagico: v === "Nessuna" ? undefined : Number(v.slice(1)) as 1 | 2 | 3 })} />
                  <TextField label="Bonus attacco manuale" showInfo={false} value={a.bonus} valueInfoId={a.nome ? `armaPosseduta:${index}` : undefined} valueInfoTitle={a.nome} numeric="signed" onChange={(v) => p({ bonus: v })} />
                  <TextField label="Dettaglio personale" showInfo={false} value={a.note} valueInfoId={a.nome ? `armaPosseduta:${index}` : undefined} valueInfoTitle={a.nome} onChange={(v) => p({ note: v })} multiline />
                </div>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Equipaggiamento",
      body: (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className={sectionTitle}>Competenze armatura</h3>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["Leggere", "leggere"],
                  ["Medie", "medie"],
                  ["Pesanti", "pesanti"],
                  ["Scudi", "scudi"],
                ] as [string, keyof Sheet["competenzeArmatura"]][]
              ).map(([lab, key]) => (
                <Toggle
                  key={key}
                  label={lab}
                  helpId={`valore:armatura:${lab}`}
                  checked={sheet.competenzeArmatura[key]}
                  onChange={(v) => patch(setCheckboxCompetency(sheet, "armatura", key, v))}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className={sectionTitle}>Competenze negli strumenti</h3>
            <StringListEditor items={sheet.competenzeStrumenti ?? []} onChange={(items) => patch({ competenzeStrumenti: items })} addLabel="Aggiungi competenza" options={gearCatalog.filter((item) => item.tool).map((item) => item.name)} />
          </div>
          <div>
            <h3 className={sectionTitle}>Oggetti</h3>
            <p className="mb-2 text-sm text-ink-soft">Peso catalogato: {inventoryWeight(sheet).knownKg} kg{carryingCapacity(sheet) !== null ? ` / capacità ${carryingCapacity(sheet)} kg` : ""}{inventoryWeight(sheet).unknownItems.length ? `; peso non noto per ${inventoryWeight(sheet).unknownItems.length} voci` : ""}. Le monete e il contenuto dei contenitori non sono inclusi.</p>
            <ArrayEditor
              items={sheet.equipaggiamento}
              onChange={(items) => patch({ equipaggiamento: items })}
              makeNew={(): Equip => ({ nome: "", dettaglio: "" })}
              addLabel="Aggiungi oggetto"
              collapsible
              titleOf={(e) => e.nome || "Nuovo oggetto"}
              onTitleClick={(e, index, button) => { if (!equipmentDetails(e.nome, e.dettaglio)) return false; openFieldInfo(`oggetto:${index}`, e.nome, button); return true; }}
              subtitleOf={(e) => [e.catalogId ? "SRD" : "Personalizzato/non collegato", e.quantita && `×${e.quantita}`, e.indossato && "Indossata", e.impugnato && "Impugnato", e.dettaglio].filter(Boolean).join(" · ")}
              renderItem={(e, p, index) => (
                <div className="flex flex-col gap-2">
                  <TextField label="Oggetto" showInfo={false} value={e.nome} valueInfoId={equipmentDetails(e.nome, e.dettaglio) ? `oggetto:${index}` : undefined} onChange={(v) => p({ nome: v })} />
                  <TextField label="Armatura o scudo SRD" showInfo={false} value={armorById(e.catalogId ?? "")?.name ?? ""} options={armorCatalog.map((armor) => armor.name)} onChange={(v) => { const armor = armorCatalog.find((item) => item.name === v); p({ catalogId: armor?.id, nome: armor?.name ?? e.nome, indossato: false, impugnato: false, bonusMagico: undefined }); }} />
                  <TextField label="Equipaggiamento SRD" showInfo={false} value={gearById(e.catalogId ?? "")?.name ?? ""} options={gearCatalog.map((item) => item.name)} onChange={(v) => { const gear = gearCatalog.find((item) => item.name === v); p({ catalogId: gear?.id, nome: gear?.name ?? e.nome, indossato: false, impugnato: false, bonusMagico: undefined }); }} />
                  <div className={grid2}>
                    <TextField label="Quantità" showInfo={false} value={e.quantita ?? ""} numeric="unsigned" onChange={(v) => p({ quantita: v })} />
                    <TextField label="Unità" showInfo={false} value={e.unita ?? ""} onChange={(v) => p({ unita: v })} />
                  </div>
                  <TextField label="Contenitore" showInfo={false} value={e.contenitore ?? ""} onChange={(v) => p({ contenitore: v })} />
                  {armorById(e.catalogId ?? "") && <TextField label="Variante magica SRD" showInfo={false} value={e.bonusMagico ? `+${e.bonusMagico}` : "Nessuna"} options={["Nessuna", "+1", "+2", "+3"]} onChange={(v) => p({ bonusMagico: v === "Nessuna" ? undefined : Number(v.slice(1)) as 1 | 2 | 3 })} />}
                  {armorById(e.catalogId ?? "")?.category === "scudi" ? <Toggle label="Scudo impugnato" checked={Boolean(e.impugnato)} onChange={(v) => p({ impugnato: v })} /> : armorById(e.catalogId ?? "") && <Toggle label="Armatura indossata" checked={Boolean(e.indossato)} onChange={(v) => p({ indossato: v })} />}
                  <TextField label="Dettaglio personale" showInfo={false} value={e.dettaglio} valueInfoId={equipmentDetails(e.nome, e.dettaglio) ? `oggetto:${index}` : undefined} valueInfoTitle={e.nome} onChange={(v) => p({ dettaglio: v })} multiline />
                </div>
              )}
            />
          </div>
        </div>
      ),
    },
    {
      title: "Privilegi",
      body: (
        <div>
        <h3 className={sectionTitle}>Privilegi</h3>
        <ArrayEditor
          items={sheet.privilegi}
          onChange={(items) => patch({ privilegi: items })}
          makeNew={() => ({ titolo: "", scelte: "" })}
          addLabel="Aggiungi privilegio"
          renderItem={(pr, p, index) => (
            <div className="flex flex-col gap-2">
              <TextField label="Titolo" showInfo={false} value={pr.titolo} valueInfoId={pr.titolo && (valueDetails("privilegio", pr.titolo) || pr.scelte) ? `privilegio:${index}` : undefined} onChange={(v) => p({ titolo: v })} />
              <TextField label="Scelte personali" showInfo={false} value={pr.scelte} valueInfoId={pr.titolo ? `privilegio:${index}` : undefined} valueInfoTitle={pr.titolo} onChange={(v) => p({ scelte: v })} multiline />
            </div>
          )}
        />
        <h3 className={`${sectionTitle} mt-4`}>Risorse dei privilegi</h3>
        <ArrayEditor
          items={sheet.risorse ?? []}
          onChange={(items) => patch({ risorse: items })}
          makeNew={(): NonNullable<Sheet["risorse"]>[number] => ({ nome: "", fonte: "", massimo: 1, spesi: 0, ricarica: "manuale" })}
          addLabel="Aggiungi risorsa"
          titleOf={(resource) => resource.nome || "Nuova risorsa"}
          subtitleOf={(resource) => `${resource.massimo - resource.spesi}/${resource.massimo} disponibili`}
          renderItem={(resource, p) => <div className="flex flex-col gap-2">
            <TextField label="Nome" showInfo={false} value={resource.nome} onChange={(v) => p({ nome: v })} />
            <TextField label="Fonte" showInfo={false} value={resource.fonte} onChange={(v) => p({ fonte: v })} />
            <div className={grid2}>
              <TextField label="Usi massimi" showInfo={false} numeric="unsigned" value={String(resource.massimo)} onChange={(v) => p({ massimo: Number(v || 0) })} />
              <TextField label="Usi spesi" showInfo={false} numeric="unsigned" value={String(resource.spesi)} onChange={(v) => p({ spesi: Number(v || 0) })} />
            </div>
            <TextField label="Ricarica" showInfo={false} value={resource.ricarica === "breve" ? "Riposo breve" : resource.ricarica === "lungo" ? "Riposo lungo" : "Manuale"} options={["Manuale", "Riposo breve", "Riposo lungo"]} onChange={(v) => p({ ricarica: v === "Riposo breve" ? "breve" : v === "Riposo lungo" ? "lungo" : "manuale" })} />
          </div>}
        />
        <h3 className={`${sectionTitle} mt-4`}>Fonti delle competenze</h3>
        <ArrayEditor
          items={sheet.fontiCompetenze ?? []}
          onChange={(items) => patch(grantCompetencies(sheet, items))}
          makeNew={(): NonNullable<Sheet["fontiCompetenze"]>[number] => ({ tipo: "abilita", valore: "", fonte: "" })}
          addLabel="Aggiungi fonte"
          titleOf={(record) => record.valore || "Nuova fonte"}
          subtitleOf={(record) => record.fonte}
          renderItem={(record, p) => <div className="flex flex-col gap-2">
            <TextField label="Tipo" showInfo={false} value={record.tipo} options={["abilita", "tiroSalvezza", "arma", "armatura", "strumento", "lingua"]} onChange={(v) => p({ tipo: v as typeof record.tipo, valore: "" })} />
            <TextField label="Competenza" showInfo={false} value={record.valore} options={record.tipo === "abilita" ? sheet.abilita.map((item) => item.nome) : record.tipo === "tiroSalvezza" ? sheet.caratteristiche.map((item) => item.abbr) : record.tipo === "arma" ? [...regole.competenzeArmi, ...nomiArmi] : record.tipo === "armatura" ? Object.keys(sheet.competenzeArmatura) : record.tipo === "strumento" ? gearCatalog.filter((item) => item.tool).map((item) => item.name) : lingue} onChange={(v) => p({ valore: v })} />
            <TextField label="Fonte" showInfo={false} value={record.fonte} onChange={(v) => p({ fonte: v })} />
          </div>}
        />
        </div>
      ),
    },
    {
      title: "Talenti",
      body: (
        <div>
        <h3 className={sectionTitle}>Talenti</h3>
        <ArrayEditor
          items={sheet.talenti}
          onChange={(items) => patch({ talenti: items })}
          makeNew={() => ({ nome: "", scelte: "" })}
          addLabel="Aggiungi talento"
          lockItem={(t) => Boolean(t.nome)}
          renderItem={(t, p, _index, locked) => (
            <div className="flex flex-col gap-2">
              <TextField label="Nome" showInfo={false} value={t.nome} valueInfoId={t.nome ? `valore:talento:${t.nome}` : undefined} options={availableFeats(Number(sheet.livello))} locked={locked} onChange={(v) => p({ nome: v })} />
              <TextField label="Scelte personali" showInfo={false} value={t.scelte} valueInfoId={t.nome ? `valore:talento:${t.nome}` : undefined} valueInfoTitle={t.nome} onChange={(v) => p({ scelte: v })} multiline />
            </div>
          )}
        />
        </div>
      ),
    },
    {
      title: "Incantesimi",
      body: (
        <div className="flex flex-col gap-3">
        {spellcastingStats(sheet) && <div className={card}><p>CD incantesimi: {spellcastingStats(sheet)?.dc} · Attacco magico: {spellcastingStats(sheet)?.attack}</p><p className="text-sm text-ink-soft">{spellcastingStats(sheet)?.formula}</p></div>}
        {spellSlots(sheet).some((slot) => slot.maximum > 0) && <div className={card}><h3 className={sectionTitle}>Slot incantesimo spesi</h3><div className="grid grid-cols-3 gap-2">{spellSlots(sheet).filter((slot) => slot.maximum > 0).map((slot) => <TextField key={slot.level} label={`Livello ${slot.level} / ${slot.maximum}`} showInfo={false} numeric="unsigned" value={String(sheet.slotSpesi?.[String(slot.level)] ?? 0)} onChange={(v) => patch({ slotSpesi: { ...sheet.slotSpesi, [String(slot.level)]: Number(v || 0) } })} />)}</div></div>}
        <h3 className={sectionTitle}>Incantesimi</h3>
        <ArrayEditor
          items={sheet.incantesimi}
          onChange={(items) => patch({ incantesimi: items })}
          makeNew={(): Incantesimo => ({ nome: "" })}
          addLabel="Aggiungi incantesimo"
          collapsible
          titleOf={(inc) => inc.nome || "Nuovo incantesimo"}
          onTitleClick={(inc, _index, button) => { if (!inc.nome) return false; openFieldInfo(`incantesimo:${inc.nome}`, inc.nome, button); return true; }}
          renderItem={(inc, p) => (
            <div className="flex flex-col gap-2">
              <TextField label="Fonte" showInfo={false} value={inc.fonte === "classe" ? "Classe" : inc.fonte === "talento" ? "Talento" : inc.fonte === "privilegio" ? "Privilegio" : inc.fonte === "altro" ? "Altro" : "Non specificata"} options={["Non specificata", "Classe", "Talento", "Privilegio", "Altro"]} onChange={(v) => p({ fonte: v === "Classe" ? "classe" : v === "Talento" ? "talento" : v === "Privilegio" ? "privilegio" : v === "Altro" ? "altro" : undefined })} />
              <TextField label="Nome" showInfo={false} value={inc.nome} valueInfoId={inc.nome ? `incantesimo:${inc.nome}` : undefined} options={inc.fonte === "classe" ? availableClassSpells(sheet) : spellNames} onChange={(v) => p({ nome: v })} />
              <TextField label="Stato" showInfo={false} value={inc.stato === "semprePreparato" ? "Sempre preparato" : inc.stato === "conosciuto" ? "Conosciuto" : inc.stato === "libro" ? "Nel libro" : inc.stato === "preparato" ? "Preparato" : inc.stato === "concesso" ? "Concesso" : "Non specificato"} options={["Non specificato", "Conosciuto", "Nel libro", "Preparato", "Sempre preparato", "Concesso"]} onChange={(v) => p({ stato: v === "Conosciuto" ? "conosciuto" : v === "Nel libro" ? "libro" : v === "Preparato" ? "preparato" : v === "Sempre preparato" ? "semprePreparato" : v === "Concesso" ? "concesso" : undefined })} />
              {inc.fonte && inc.fonte !== "classe" && <TextField label="Caratteristica di lancio" showInfo={false} value={inc.caratteristica ?? ""} options={["INT", "SAG", "CAR"]} onChange={(v) => p({ caratteristica: v as "INT" | "SAG" | "CAR" })} />}
            </div>
          )}
        />
        </div>
      ),
    },
    {
      title: "Monete",
      body: (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className={sectionTitle}>Monete</h3>
            <p className="mb-2 text-sm text-ink-soft">Valore equivalente: {coinTotalGold(sheet.monete) ?? "—"} mo</p>
            <div className="flex flex-col gap-2">
              {COINS.map(([lab, key]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-line bg-card/70 px-3 py-2 shadow-sm"
                >
                  <span className="text-sm text-ink-soft">{lab}</span>
                  <InlineInput
                    value={sheet.monete[key]}
                    onChange={(v) => patch({ monete: { ...sheet.monete, [key]: v } })}
                    numeric="unsigned"
                    className="w-24 text-right"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
  ];

  const pageOrder = [
    "Stato & Identità",
    "Lingue",
    "Caratteristiche",
    "Abilità",
    "Incantesimi",
    "Armi",
    "Equipaggiamento",
    "Monete",
    "Privilegi",
    "Talenti",
  ];
  const pages = pageOrder.map((t) => pageDefs.find((p) => p.title === t)!);

  return (
    <EditProvider unlocked={true} requireUnlock={() => {}}>
      <FieldInfoContext.Provider value={openFieldInfo}>
      <div className="flex h-dvh flex-col">
        <header className="shrink-0 border-b border-line bg-parchment/90 px-4 pb-2 pt-2 backdrop-blur">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex min-w-0 items-center justify-self-start">
            <button
              type="button"
              onClick={() => setShowHub(true)}
              className="flex min-w-0 items-center gap-1.5 justify-self-start text-left"
              aria-label="Torna alla home del personaggio"
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
                  className={`h-1.5 rounded-full transition-all ${
                    i === selected ? "w-5 bg-accent" : "w-1.5 bg-line"
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
                onClick={() => handleExport("template")}
                disabled={exporting !== null}
                className="mt-4 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-parchment shadow-sm transition-opacity active:opacity-90 disabled:opacity-50"
              >
                {exporting === "template" ? "Esportazione…" : "Esporta PDF scheda"}
              </button>
              <button
                type="button"
                onClick={() => handleExport("current")}
                disabled={exporting !== null}
                className="mt-2 w-full rounded-xl border border-accent py-3 text-sm font-semibold text-accent transition-opacity active:opacity-90 disabled:opacity-50"
              >
                {exporting === "current" ? "Esportazione…" : "Esporta PDF app"}
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
                <a href="https://media.dndbeyond.com/compendium-images/srd/5.2/IT_SRD_CC_v5.2.1.pdf"
                  target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-medium text-accent underline">
                  Fonte: SRD 5.2.1 (regole 2024)
                </a>
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
                {fieldHelp && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{fieldHelp.meaning}</p>}
                {fieldHelp?.effect && <><h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Cosa cambia</h3><p className="mt-1 text-sm leading-relaxed">{fieldHelp.effect}</p></>}
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
                  {spellName && spellEffects[spellName] && <p className="mt-4 text-sm leading-relaxed">{spellEffects[spellName]}</p>}
                </>}
                {(fieldHelp?.rule || spell) && <a href={`https://media.dndbeyond.com/compendium-images/srd/5.2/IT_SRD_CC_v5.2.1.pdf${sourcePage ? `#page=${sourcePage}` : ""}`}
                  target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-medium text-accent underline">
                  Fonte: SRD 5.2.1 (regole 2024)
                </a>}
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
