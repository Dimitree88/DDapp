import type { Abilita, Caratteristica, Sheet } from "./sheet";

const signed = (value: number) => value > 0 ? `+${value}` : String(value);

export function abilityModifier(score: string): string {
  if (!/^\d+$/.test(score) || Number(score) < 1 || Number(score) > 30) return "";
  return signed(Math.floor((Number(score) - 10) / 2));
}

export function proficiencyBonus(level: string): string {
  if (!/^\d+$/.test(level) || Number(level) < 1 || Number(level) > 20) return "";
  return `+${2 + Math.floor((Number(level) - 1) / 4)}`;
}

export function savingThrowBonus(sheet: Sheet, characteristic: Caratteristica): string {
  const modifier = abilityModifier(characteristic.valore);
  const proficiency = proficiencyBonus(sheet.livello);
  if (!modifier || (characteristic.tsCompetente && !proficiency)) return "";
  return signed(Number(modifier) + (characteristic.tsCompetente ? Number(proficiency) : 0));
}

// La competenza si applica una volta, o due con Maestria (SRD 5.2.1).
export function abilityBonus(sheet: Sheet, ability: Abilita): string {
  const score = sheet.caratteristiche.find((item) => item.abbr === ability.caratteristica)?.valore ?? "";
  const modifier = abilityModifier(score);
  const proficiency = proficiencyBonus(sheet.livello);
  if (!modifier || (ability.competente && !proficiency)) return "";
  const total = Number(modifier) + (ability.competente ? Number(proficiency) * (ability.maestria ? 2 : 1) : 0);
  return signed(total);
}

export function passivePerception(sheet: Sheet): string {
  const perception = sheet.abilita.find((item) => item.nome === "PERCEZIONE");
  if (!perception) return "";
  const bonus = abilityBonus(sheet, perception);
  return bonus ? String(10 + Number(bonus)) : "";
}
