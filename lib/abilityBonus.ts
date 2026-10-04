import type { Abilita, Sheet } from "./sheet";

// Il modificatore è quello indicato sulla scheda; la competenza si applica
// una volta, o due se l'abilità competente ha Maestria (SRD 5.2.1).
export function abilityBonus(sheet: Sheet, ability: Abilita): string {
  const modifier = sheet.caratteristiche.find((item) => item.abbr === ability.caratteristica)?.modificatore;
  const proficiency = sheet.bonusCompetenza;
  if (!modifier || !/^[+-]?\d+$/.test(modifier.trim())) return "";
  if (ability.competente && (!proficiency || !/^[+-]?\d+$/.test(proficiency.trim()))) return "";
  const total = Number(modifier) + (ability.competente ? Number(proficiency) * (ability.maestria ? 2 : 1) : 0);
  return total > 0 ? `+${total}` : String(total);
}
