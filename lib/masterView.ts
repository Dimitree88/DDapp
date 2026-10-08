import { abilityBonus, abilityModifier, initiativeBonus, passivePerception, savingThrowBonus } from "./abilityBonus";
import { normalizeCreature, type CreatureData } from "./creature";
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
};

export type CreatureView = { id: string; name: string; data: CreatureData };

const toInt = (value: string | undefined) => value !== undefined && /^\d+$/.test(value.trim()) ? Number(value) : null;

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
