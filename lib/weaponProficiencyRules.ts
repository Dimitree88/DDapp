import type { Sheet } from "./sheet";
import type { WeaponCatalogEntry } from "./weaponDetails";

export const WEAPON_PROFICIENCIES = [
  "Armi semplici",
  "Armi da guerra",
  "Armi da guerra leggere",
  "Armi da guerra accurate o leggere",
] as const;

export function isWeaponProficient(sheet: Sheet, weapon: WeaponCatalogEntry): boolean {
  const known = sheet.competenzeArmi;
  if (known.includes(weapon.name)) return true; // Compatibilità con competenze individuali già salvate.
  if (weapon.category === "semplici") return known.includes("Armi semplici");
  return known.includes("Armi da guerra")
    || (known.includes("Armi da guerra leggere") && /\bleggera\b/i.test(weapon.properties))
    || (known.includes("Armi da guerra accurate o leggere") && (weapon.finesse || /\bleggera\b/i.test(weapon.properties)));
}
