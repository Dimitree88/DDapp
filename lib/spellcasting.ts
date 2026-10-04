import { abilityModifier, proficiencyBonus } from "./abilityBonus";
import { spellDetails, spellNames } from "./spells";
import type { Sheet } from "./sheet";

export const spellcastingAbility: Record<string, "INT" | "SAG" | "CAR"> = {
  Bardo: "CAR", Chierico: "SAG", Druido: "SAG", Mago: "INT",
  Paladino: "CAR", Ranger: "SAG", Stregone: "CAR", Warlock: "CAR",
};

// SRD 5.2.1, tabella degli slot per incantatore, p. 28.
const fullSlots = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2],
  [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
] as const;

export type SlotPool = { level: number; maximum: number; spent: number }[];

export function spellSlots(sheet: Sheet): SlotPool {
  const level = Number(sheet.livello);
  if (!Number.isInteger(level) || level < 1 || level > 20) return [];
  let maxima: readonly number[] = [];
  if (sheet.classe === "Warlock") {
    const count = level === 1 ? 1 : level < 11 ? 2 : level < 17 ? 3 : 4;
    maxima = Array(Math.min(Math.ceil(level / 2), 5)).fill(0);
    maxima = maxima.map((_, index) => index === maxima.length - 1 ? count : 0);
  } else if (sheet.classe === "Paladino" || sheet.classe === "Ranger") {
    maxima = fullSlots[Math.ceil(level / 2) - 1];
  } else if (spellcastingAbility[sheet.classe]) {
    maxima = fullSlots[level - 1];
  }
  return maxima.map((maximum, index) => ({ level: index + 1, maximum, spent: Number(sheet.slotSpesi?.[String(index + 1)] ?? 0) }));
}

export function availableClassSpells(sheet: Sheet): string[] {
  const available = spellSlots(sheet);
  const maxLevel = available.reduce((max, slot) => slot.maximum ? slot.level : max, 0);
  return spellNames.filter((name) => {
    const detail = spellDetails(name);
    return detail?.classi.includes(sheet.classe.toLocaleLowerCase("it")) && (detail.livello === 0 || detail.livello <= maxLevel);
  });
}

export function spellcastingStats(sheet: Sheet, ability = spellcastingAbility[sheet.classe]) {
  if (!ability) return null;
  const modifier = abilityModifier(sheet.caratteristiche.find((item) => item.abbr === ability)?.valore ?? "");
  const proficiency = proficiencyBonus(sheet.livello);
  if (!modifier || !proficiency) return null;
  const total = Number(modifier) + Number(proficiency);
  return { ability, modifier, proficiency, attack: total > 0 ? `+${total}` : String(total), dc: 8 + total, formula: `8 + ${ability} ${modifier} + competenza ${proficiency} = ${8 + total}` };
}
