import { abilityBonus, abilityModifier, initiativeBonus, passivePerception, savingThrowBonus } from "./abilityBonus";
import { calculationExplanation, type CalculationExplanation, type CalculationTarget } from "./calculationExplanation";
import { normalizeCreature, type CreatureData } from "./creature";
import { weaponAttack, weaponRange } from "./weaponAttack";
import { weaponByName } from "./weaponDetails";
import { hitDieSize, hitDiceTotal } from "./masterRest";
import { readyToLevel, type HpState } from "./masterRules";
import { normalizeSheet, type CondizioneAttiva, type ConcentrazioneAttiva, type Risorsa, type Sheet } from "./sheet";
import { displayedSpeed } from "./speed";
import { spellcastingStats, spellSlots } from "./spellcasting";

// Dati essenziali di un personaggio per la vista Master: evita di inviare al
// browser l'intera scheda (equipaggiamento, storia, incantesimi...).
export type CharacterView = {
  id: string;
  name: string;
  classe: string;
  sottoclasse: string;
  livello: string;
  specie: string;
  hp: number | null;
  hpMax: number | null;
  temp: number;
  ac: number | null;
  initiative: string;
  passivePerception: string;
  speed: string;
  abilities: { abbr: string; score: string; mod: string; save: string; proficient: boolean }[];
  skills: { nome: string; bonus: string; maestria: boolean }[];
  languages: string[];
  conditions: CondizioneAttiva[];
  exhaustion: number;
  concentration: ConcentrazioneAttiva | null;
  inspiration: boolean;
  xp: string;
  levelReady: boolean;
  saves: { successi: number; fallimenti: number };
  death: "tiri" | "stabile" | "morto" | null;
  resources: Risorsa[];
  slots: { level: number; maximum: number; spent: number }[];
  hitDie: number | null;
  hitDiceTotal: number | null;
  hitDiceSpent: number | null;
  conMod: number;
  spell: { dc: number; attack: string; ability: string } | null;
  human: boolean;
  // Spiegazioni dei valori calcolati, con lo stesso schema della scheda del personaggio.
  calc: Record<string, CalculationExplanation>;
  attacks: CharacterAttack[];
};

export type CharacterAttack = {
  index: number;
  name: string;
  attack: string;
  damage: string;
  damageType: string;
  range: { label: "Portata" | "Gittata"; value: string; thrown?: string } | null;
  mastery: string | null;
  warnings: string[];
};

export type CreatureView = { id: string; name: string; data: CreatureData };

const toInt = (value: string | undefined) => value !== undefined && /^\d+$/.test(value.trim()) ? Number(value) : null;

function characterCalculations(sheet: Sheet): Record<string, CalculationExplanation> {
  const targets: [string, CalculationTarget][] = [
    ["armor", { kind: "armor" }], ["initiative", { kind: "initiative" }], ["passive", { kind: "passive" }],
    ["proficiency", { kind: "proficiency" }], ["speed", { kind: "speed" }], ["maxHp", { kind: "maxHp" }],
    ["spellDc", { kind: "spellDc" }], ["spellAttack", { kind: "spellAttack" }],
    ...sheet.caratteristiche.map((item): [string, CalculationTarget] => [`save:${item.abbr}`, { kind: "save", abbr: item.abbr }]),
    ...sheet.abilita.filter((item) => item.competente).map((item): [string, CalculationTarget] => [`skill:${item.nome}`, { kind: "ability", name: item.nome }]),
    ...sheet.armi.flatMap((_, index): [string, CalculationTarget][] => [
      [`weapon:${index}:attack`, { kind: "weaponAttack", index }],
      [`weapon:${index}:damage`, { kind: "weaponDamage", index }],
      [`weapon:${index}:range`, { kind: "weaponRange", index }],
    ]),
  ];
  const calc = Object.fromEntries(targets.flatMap(([key, target]) => {
    const explanation = calculationExplanation(sheet, target);
    return explanation ? [[key, explanation]] : [];
  }));
  // La vista Master usa la CA registrata: se differisce dal calcolo, lo dichiara.
  const recorded = sheet.classeArmatura === null ? "" : String(sheet.classeArmatura);
  if (calc.armor && recorded && calc.armor.result !== recorded) {
    calc.armor = {
      ...calc.armor, result: recorded,
      details: [...calc.armor.details, { label: "CA registrata nella scheda", value: recorded }],
      formula: `${calc.armor.formula}; il Master usa la CA registrata (${recorded})`,
    };
  }
  return calc;
}

function characterAttacks(sheet: Sheet): CharacterAttack[] {
  return sheet.armi.map((weapon, index) => {
    const calculation = weaponAttack(sheet, weapon);
    const range = weaponRange(weapon);
    const entry = weaponByName(weapon.nome);
    return {
      index, name: weapon.nome || "Arma",
      attack: weapon.bonus || calculation?.attack || "",
      damage: calculation ? `${calculation.dice}${calculation.modifier}` : "",
      damageType: calculation?.damageType ?? "",
      range: range ? { label: range.label, value: range.value, ...(range.thrown ? { thrown: range.thrown } : {}) } : null,
      mastery: entry && (sheet.padronanzeArmi ?? []).includes(entry.name) ? entry.mastery : null,
      warnings: calculation?.warnings ?? [],
    };
  });
}

export function characterView(id: string, name: string, raw: Sheet): CharacterView {
  const sheet = normalizeSheet(raw);
  const spell = spellcastingStats(sheet);
  return {
    id, name,
    classe: sheet.classe, sottoclasse: sheet.sottoclasse, livello: sheet.livello, specie: sheet.specie,
    hp: toInt(sheet.puntiFerita), hpMax: toInt(sheet.puntiFeritaMax), temp: toInt(sheet.puntiFeritaTemporanei) ?? 0,
    ac: sheet.classeArmatura,
    initiative: initiativeBonus(sheet), passivePerception: passivePerception(sheet), speed: displayedSpeed(sheet),
    abilities: sheet.caratteristiche.map((item) => ({ abbr: item.abbr, score: item.valore, mod: abilityModifier(item.valore), save: savingThrowBonus(sheet, item), proficient: item.tsCompetente })),
    skills: sheet.abilita.filter((item) => item.competente).map((item) => ({ nome: item.nome, bonus: abilityBonus(sheet, item), maestria: item.maestria })),
    languages: sheet.lingue,
    conditions: sheet.condizioni ?? [],
    exhaustion: sheet.indebolimento ?? 0,
    concentration: sheet.concentrazione ?? null,
    inspiration: sheet.ispirazioneEroica,
    xp: sheet.puntiEsperienza,
    levelReady: readyToLevel(sheet.livello, sheet.puntiEsperienza),
    saves: sheet.tiriMorte ?? { successi: 0, fallimenti: 0 },
    death: sheet.statoMorte ?? null,
    resources: sheet.risorse ?? [],
    slots: spellSlots(sheet).filter((slot) => slot.maximum > 0),
    hitDie: hitDieSize(sheet), hitDiceTotal: hitDiceTotal(sheet), hitDiceSpent: toInt(sheet.dadiVitaSpesi),
    conMod: Number(abilityModifier(sheet.caratteristiche.find((item) => item.abbr === "COS")?.valore ?? "") || 0),
    spell: spell ? { dc: spell.dc, attack: spell.attack, ability: spell.ability } : null,
    human: sheet.specie === "Umano",
    calc: characterCalculations(sheet),
    attacks: characterAttacks(sheet),
  };
}

export function creatureView(id: string, name: string, data: CreatureData): CreatureView {
  return { id, name, data: normalizeCreature(data) };
}

// --- Stato PF condiviso con le regole ---------------------------------

export function sheetHpState(sheet: Sheet): HpState {
  const current = toInt(sheet.puntiFerita);
  const max = toInt(sheet.puntiFeritaMax);
  if (current === null || max === null || max < 1 || current > max) throw new Error("PF attuali o massimi mancanti/non validi: registrali prima.");
  return {
    current, max,
    temp: toInt(sheet.puntiFeritaTemporanei) ?? 0,
    saves: sheet.tiriMorte ?? { successi: 0, fallimenti: 0 },
    death: sheet.statoMorte,
    conditions: sheet.condizioni ?? [],
    concentration: sheet.concentrazione,
  };
}

export function applyHpState(sheet: Sheet, state: HpState): Sheet {
  const next: Sheet = {
    ...sheet,
    puntiFerita: String(state.current),
    puntiFeritaTemporanei: String(state.temp),
    tiriMorte: state.saves,
    condizioni: state.conditions,
  };
  if (state.death) next.statoMorte = state.death; else delete next.statoMorte;
  if (state.concentration) next.concentrazione = state.concentration; else delete next.concentrazione;
  return next;
}

export function creatureHpState(data: CreatureData): HpState {
  return {
    current: data.hitPointsCurrent, max: data.hitPointsMax, temp: data.hitPointsTemp ?? 0,
    saves: { successi: 0, fallimenti: 0 }, death: undefined,
    conditions: data.conditions ?? [], concentration: data.concentration,
  };
}

export function applyCreatureHpState(data: CreatureData, state: HpState): CreatureData {
  const next: CreatureData = { ...data, hitPointsCurrent: state.current, hitPointsTemp: state.temp, conditions: state.conditions };
  if (state.concentration) next.concentration = state.concentration; else delete next.concentration;
  return next;
}

// --- Annullamento ------------------------------------------------------

// Campi della scheda modificati dai comandi Master: l'annullamento ripristina
// solo questi, lasciando intatto il resto della scheda.
export const masterSheetFields = [
  "puntiFerita", "puntiFeritaTemporanei", "tiriMorte", "statoMorte", "condizioni", "indebolimento",
  "concentrazione", "ispirazioneEroica", "puntiEsperienza", "risorse", "slotSpesi", "dadiVitaSpesi",
] as const;

export type SheetPatch = Record<string, unknown>;

export function sheetPatch(sheet: Sheet): SheetPatch {
  return Object.fromEntries(masterSheetFields.map((field) => [field, sheet[field] ?? null]));
}

export function applySheetPatch(sheet: Sheet, patch: SheetPatch): Sheet {
  const next = { ...sheet } as Record<string, unknown>;
  for (const field of masterSheetFields) {
    if (!(field in patch)) continue;
    if (patch[field] === null) delete next[field]; else next[field] = patch[field];
  }
  return next as Sheet;
}

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).filter((key) => (value as Record<string, unknown>)[key] !== undefined).sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}
