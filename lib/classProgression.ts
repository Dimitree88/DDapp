import { abilityModifier } from "./abilityBonus";
import type { Sheet } from "./sheet";
import { abilityName } from "./abilityNames";

// Dadi Vita e accesso alla sottoclasse: Manuale del Giocatore 2024, pp. 50-175.
export const classHitDice: Record<string, 6 | 8 | 10 | 12> = {
  Barbaro: 12, Bardo: 8, Chierico: 8, Druido: 8, Guerriero: 10,
  Ladro: 8, Mago: 6, Monaco: 8, Paladino: 10, Ranger: 10,
  Stregone: 6, Warlock: 8,
};

export const subclassLevel = 3;

export function fixedHitPointGain(die: number): number {
  return Math.floor(die / 2) + 1;
}

export function calculatedMaxHp(sheet: Sheet): { value: number; formula: string } | null {
  if (sheet.puntiFeritaMaxModo !== "classe") return null;
  const die = classHitDice[sheet.classe];
  const level = Number(sheet.livello);
  const constitution = abilityModifier(sheet.caratteristiche.find((item) => item.abbr === "COS")?.valore ?? "");
  if (!die || !Number.isInteger(level) || level < 1 || level > 20 || !constitution) return null;
  const gains = sheet.incrementiPf ?? [];
  if (gains.length !== level - 1 || gains.some((gain) => !Number.isInteger(gain.value) || gain.value < 1 || gain.value > die || gain.method === "fisso" && gain.value !== fixedHitPointGain(die))) return null;
  const con = Number(constitution);
  const value = Math.max(1, die + con) + gains.reduce((sum, gain) => sum + Math.max(1, gain.value + con), 0);
  return { value, formula: `[${die}, ${gains.map((gain) => gain.value).join(", ")}] + ${abilityName("COS")} ${constitution} per livello (minimo 1 PF per livello) = ${value}` };
}

export function displayedMaxHp(sheet: Sheet): string {
  return sheet.puntiFeritaMaxModo === "classe" ? String(calculatedMaxHp(sheet)?.value ?? "") : sheet.puntiFeritaMax;
}
