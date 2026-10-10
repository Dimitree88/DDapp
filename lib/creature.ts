import type { CalculationExplanation } from "./calculationExplanation";
import type { CondizioneAttiva, ConcentrazioneAttiva } from "./sheet";
import { abilityName } from "./abilityNames";

export const creatureAbilityAbbrs = ["FOR", "DES", "COS", "INT", "SAG", "CAR"] as const;
export type CreatureAbilityAbbr = typeof creatureAbilityAbbrs[number];
export type CreatureAbility = { abbr: CreatureAbilityAbbr; score: number | null; save: number | null };

// Diciture della scheda delle statistiche, Manuale del Giocatore 2024, p. 346.
export const creatureAttackTypes = [
  "Tiro per colpire in mischia",
  "Tiro per colpire a distanza",
  "Tiro per colpire in mischia o a distanza",
  "Tiro salvezza",
  "Altro",
] as const;

export const creatureActionCategories = [
  { id: "azione", label: "Azioni" },
  { id: "bonus", label: "Azioni bonus" },
  { id: "reazione", label: "Reazioni" },
] as const;
export type CreatureActionCategory = typeof creatureActionCategories[number]["id"];

export type CreatureAction = {
  name: string;
  attackType: string;
  hitBonus: number;
  reachMeters: number | null;
  hitDamage: number;
  damageFormula: string;
  damageType: string;
  category?: CreatureActionCategory;
  range?: string;
  saveDc?: number | null;
  saveAbility?: string;
  description?: string;
};

export type CreatureData = {
  origin: "personalizzata";
  description: string;
  creatureType: string;
  size: string;
  alignment?: string;
  armorClass: number;
  armorClassNote: string;
  hitPointsMax: number;
  hitPointsCurrent: number;
  hitPointsFormula?: string;
  hitPointsTemp?: number;
  initiativeBonus?: number | null;
  speedMeters: number;
  speedNote?: string;
  abilities?: CreatureAbility[];
  skills?: string;
  senses?: string;
  languages?: string;
  challengeRating: string;
  experiencePoints: number;
  proficiencyBonus?: number | null;
  actions: CreatureAction[];
  traits: { name: string; description: string; adjudication: "master" }[];
  conditions?: CondizioneAttiva[];
  concentration?: ConcentrazioneAttiva;
  notes?: string;
  // Esemplare creato per un combattimento da un modello della libreria o al volo.
  esemplare?: boolean;
  modello?: string;
};

export const creatureSizes = ["Minuscola", "Piccola", "Media", "Grande", "Enorme", "Mastodontica"] as const;

export function emptyCreature(): CreatureData {
  return {
    origin: "personalizzata", description: "", creatureType: "", size: "Media", alignment: "",
    armorClass: 10, armorClassNote: "", hitPointsMax: 1, hitPointsCurrent: 1, hitPointsFormula: "", hitPointsTemp: 0,
    initiativeBonus: null, speedMeters: 9, speedNote: "",
    abilities: creatureAbilityAbbrs.map((abbr) => ({ abbr, score: null, save: null })),
    skills: "", senses: "", languages: "", challengeRating: "", experiencePoints: 0, proficiencyBonus: null,
    actions: [], traits: [], conditions: [], notes: "",
  };
}

const text = (value: unknown, max = 2000) => typeof value === "string" ? value.trim().slice(0, max) : "";
const integer = (value: unknown, fallback: number) => {
  const number = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? Math.trunc(number) : fallback;
};
const optionalInteger = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : null;
};
const decimal = (value: unknown, fallback: number) => {
  const number = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : fallback;
};

// Completa i campi facoltativi dei dati salvati prima dell'editor delle creature.
export function normalizeCreature(value: Partial<CreatureData> | null | undefined): CreatureData {
  const base = emptyCreature();
  const data = value ?? {};
  const abilities = creatureAbilityAbbrs.map((abbr) => {
    const found = Array.isArray(data.abilities) ? data.abilities.find((item) => item?.abbr === abbr) : undefined;
    return { abbr, score: optionalInteger(found?.score), save: optionalInteger(found?.save) };
  });
  const hitPointsMax = Math.max(0, integer(data.hitPointsMax, base.hitPointsMax));
  return {
    ...base,
    description: text(data.description),
    creatureType: text(data.creatureType, 120),
    size: text(data.size, 40) || base.size,
    alignment: text(data.alignment, 120),
    armorClass: Math.max(0, integer(data.armorClass, base.armorClass)),
    armorClassNote: text(data.armorClassNote, 200),
    hitPointsMax,
    hitPointsCurrent: Math.min(hitPointsMax, Math.max(0, integer(data.hitPointsCurrent, hitPointsMax))),
    hitPointsFormula: text(data.hitPointsFormula, 60),
    hitPointsTemp: Math.max(0, integer(data.hitPointsTemp, 0)),
    initiativeBonus: optionalInteger(data.initiativeBonus),
    speedMeters: Math.max(0, decimal(data.speedMeters, base.speedMeters)),
    speedNote: text(data.speedNote, 200),
    abilities,
    skills: text(data.skills, 500),
    senses: text(data.senses, 500),
    languages: text(data.languages, 500),
    challengeRating: text(data.challengeRating, 20),
    experiencePoints: Math.max(0, integer(data.experiencePoints, 0)),
    proficiencyBonus: optionalInteger(data.proficiencyBonus),
    actions: (Array.isArray(data.actions) ? data.actions : []).filter((action) => action && text(action.name, 120)).map((action) => ({
      name: text(action.name, 120),
      attackType: text(action.attackType, 80) || creatureAttackTypes[0],
      hitBonus: integer(action.hitBonus, 0),
      reachMeters: action.reachMeters === null || action.reachMeters === undefined || String(action.reachMeters) === "" ? null : Math.max(0, decimal(action.reachMeters, 1.5)),
      hitDamage: Math.max(0, integer(action.hitDamage, 0)),
      damageFormula: text(action.damageFormula, 80),
      damageType: text(action.damageType, 80),
      category: action.category === "bonus" || action.category === "reazione" ? action.category : "azione",
      range: text(action.range, 80),
      saveDc: optionalInteger(action.saveDc),
      saveAbility: text(action.saveAbility, 20),
      description: text(action.description),
    })),
    traits: (Array.isArray(data.traits) ? data.traits : []).filter((trait) => trait && text(trait.name, 120)).map((trait) => ({
      name: text(trait.name, 120), description: text(trait.description), adjudication: "master" as const,
    })),
    conditions: (Array.isArray(data.conditions) ? data.conditions : []).filter((item) => item && text(item.nome, 60)).map((item) => ({
      nome: text(item.nome, 60), fonte: text(item.fonte, 200), durata: text(item.durata, 200), nota: text(item.nota, 500),
    })),
    ...(data.concentration && text(data.concentration.effetto, 200) ? { concentration: {
      effetto: text(data.concentration.effetto, 200), fonte: text(data.concentration.fonte, 200), durata: text(data.concentration.durata, 200),
    } } : {}),
    notes: text(data.notes, 4000),
    ...(data.esemplare ? { esemplare: true } : {}),
    ...(data.modello ? { modello: text(data.modello, 80) } : {}),
  };
}

export function abilityModifierValue(score: number | null): number | null {
  return score === null || !Number.isFinite(score) ? null : Math.floor((score - 10) / 2);
}

export const signedNumber = (value: number) => value >= 0 ? `+${value}` : String(value);

// Valore medio di una formula come "2d6 + 3", arrotondato per difetto (p. 8).
export function averageDamage(formula: string): number | null {
  const clean = formula.replace(/\s+/g, "").replace(/−/g, "-").toLowerCase();
  if (!clean || !/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(clean)) return null;
  let total = 0;
  for (const term of clean.match(/[+-]?(\d*d\d+|\d+)/g) ?? []) {
    const sign = term.startsWith("-") ? -1 : 1;
    const dice = /^(\d*)d(\d+)$/.exec(term.replace(/^[+-]/, ""));
    total += sign * (dice ? Number(dice[1] || 1) * (Number(dice[2]) + 1) / 2 : Number(term.replace(/^[+-]/, "")));
  }
  return Math.max(0, Math.floor(total));
}

// Riga di attacco nello stesso ordine della scheda delle statistiche (p. 346).
export function creatureActionSummary(action: CreatureAction): string {
  const extra = action.description ? ` ${action.description}` : "";
  const damage = action.damageFormula || action.hitDamage
    ? `${action.hitDamage || ""}${action.damageFormula ? ` (${action.damageFormula})` : ""} danni ${action.damageType}`.trim()
    : "";
  if (action.attackType === "Tiro salvezza") {
    return `Tiro salvezza${action.saveAbility ? ` su ${action.saveAbility}` : ""}${action.saveDc ? `: CD ${action.saveDc}` : ""}${action.range ? `, ${action.range}` : ""}.${damage ? ` Fallimento: ${damage}.` : ""}${extra}`;
  }
  if (action.attackType === "Altro") return `${damage ? `${damage}.` : ""}${extra}`.trim();
  const reach = action.reachMeters === null ? "" : `portata ${String(action.reachMeters).replace(".", ",")} m`;
  const distance = [reach, action.range ? `gittata ${action.range}` : ""].filter(Boolean).join(" o ");
  return `${action.attackType}: ${signedNumber(action.hitBonus)}${distance ? `, ${distance}` : ""}.${damage ? ` Colpito: ${damage}.` : ""}${extra}`;
}

// Valori di un'azione separati per la lettura rapida in combattimento.
export type CreatureActionStats = {
  hit: string | null;
  save: { ability: string; dc: number | null } | null;
  reach: string | null;
  range: string | null;
  damage: { average: number | null; formula: string; type: string } | null;
};

export function creatureActionStats(action: CreatureAction): CreatureActionStats {
  const isAttack = action.attackType.startsWith("Tiro per colpire");
  const isSave = action.attackType === "Tiro salvezza";
  return {
    hit: isAttack ? signedNumber(action.hitBonus) : null,
    save: isSave ? { ability: action.saveAbility ?? "", dc: action.saveDc ?? null } : null,
    reach: isAttack && action.reachMeters !== null ? `${String(action.reachMeters).replace(".", ",")} m` : null,
    range: action.attackType === "Altro" ? null : action.range || null,
    damage: action.damageFormula || action.hitDamage
      ? { average: action.hitDamage || averageDamage(action.damageFormula), formula: action.damageFormula, type: action.damageType }
      : null,
  };
}

// Colonne MOD e SALV della scheda delle statistiche (p. 346); modificatore a p. 10.
export function creatureAbilityExplanation(ability: CreatureAbility): CalculationExplanation {
  const modifier = abilityModifierValue(ability.score);
  const save = ability.save ?? modifier;
  return {
    title: `${abilityName(ability.abbr)}: modificatore e tiro salvezza`,
    result: save === null ? "" : `MOD ${modifier === null ? "—" : signedNumber(modifier)} · SALV ${signedNumber(save)}`,
    page: 346,
    rule: "Il modificatore di caratteristica deriva dal punteggio: si sottrae 10, si divide per 2 e si arrotonda per difetto (p. 10). Nella scheda delle statistiche la colonna MOD riporta il modificatore e la colonna SALV il bonus al tiro salvezza (p. 346). Se il tiro salvezza non è registrato, l'app usa il modificatore.",
    details: [
      { label: "Punteggio", value: ability.score === null ? "da inserire" : String(ability.score) },
      { label: "Modificatore (MOD)", value: modifier === null ? "—" : signedNumber(modifier) },
      { label: "Tiro salvezza (SALV)", value: ability.save !== null ? `${signedNumber(ability.save)} (registrato)` : modifier === null ? "—" : `${signedNumber(modifier)} (uguale al modificatore)` },
    ],
    formula: modifier === null ? "Inserisci il punteggio della caratteristica." : `⌊(${ability.score} − 10) ÷ 2⌋ = ${signedNumber(modifier)}${ability.save !== null && ability.save !== modifier ? `; SALV registrato ${signedNumber(ability.save)}` : ""}`,
  };
}
