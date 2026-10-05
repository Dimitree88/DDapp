import type { Sheet } from "./sheet";
import { weaponCatalog } from "./weaponDetails";
import { isWeaponProficient } from "./weaponProficiencyRules";

export function proficientWeaponNames(sheet: Sheet): string[] {
  return weaponCatalog.filter((weapon) => isWeaponProficient(sheet, weapon)).map((weapon) => weapon.name);
}

export function weaponMasteryLimit(sheet: Sheet): number {
  const level = Number(sheet.livello);
  if (!Number.isInteger(level) || level < 1) return 0;
  if (sheet.classe === "Barbaro") return level >= 10 ? 4 : level >= 4 ? 3 : 2;
  if (sheet.classe === "Guerriero") return level >= 16 ? 6 : level >= 10 ? 5 : level >= 4 ? 4 : 3;
  if (["Paladino", "Ranger", "Ladro"].includes(sheet.classe)) return 2;
  return 0;
}

export function availableWeaponMasteries(sheet: Sheet): string[] {
  return weaponCatalog.filter((weapon) =>
    isWeaponProficient(sheet, weapon) && (sheet.classe !== "Barbaro" || weapon.kind === "mischia"),
  ).map((weapon) => weapon.name);
}
