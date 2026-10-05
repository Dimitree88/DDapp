import type { Sheet } from "./sheet";
import { weaponCatalog } from "./weaponDetails";

// D&D Basic Rules 2024, Core Class Traits:
// https://www.dndbeyond.com/sources/dnd/br-2024/character-classes
export const classSavingThrows: Record<string, readonly [string, string]> = {
  Barbaro: ["FOR", "COS"], Bardo: ["DES", "CAR"],
  Chierico: ["SAG", "CAR"], Druido: ["INT", "SAG"],
  Guerriero: ["FOR", "COS"], Ladro: ["DES", "INT"],
  Mago: ["INT", "SAG"], Monaco: ["FOR", "DES"],
  Paladino: ["SAG", "CAR"], Ranger: ["FOR", "DES"],
  Stregone: ["COS", "CAR"], Warlock: ["SAG", "CAR"],
};

const martialLight = weaponCatalog.filter((weapon) => weapon.category === "daGuerra" && /\bleggera\b/i.test(weapon.properties)).map((weapon) => weapon.name);
const martialFinesseOrLight = weaponCatalog.filter((weapon) => weapon.category === "daGuerra" && (weapon.finesse || /\bleggera\b/i.test(weapon.properties))).map((weapon) => weapon.name);
const classWeapons: Record<string, string[]> = {
  Barbaro: ["Armi semplici", "Armi da guerra"], Bardo: ["Armi semplici"],
  Chierico: ["Armi semplici"], Druido: ["Armi semplici"],
  Guerriero: ["Armi semplici", "Armi da guerra"], Ladro: ["Armi semplici", ...martialFinesseOrLight],
  Mago: ["Armi semplici"], Monaco: ["Armi semplici", ...martialLight],
  Paladino: ["Armi semplici", "Armi da guerra"], Ranger: ["Armi semplici", "Armi da guerra"],
  Stregone: ["Armi semplici"], Warlock: ["Armi semplici"],
};
export const classWeaponProficiencies = (className: string): readonly string[] => classWeapons[className] ?? [];
const classArmor: Record<string, (keyof Sheet["competenzeArmatura"])[]> = {
  Barbaro: ["leggere", "medie", "scudi"], Bardo: ["leggere"],
  Chierico: ["leggere", "medie", "scudi"], Druido: ["leggere", "scudi"],
  Guerriero: ["leggere", "medie", "pesanti", "scudi"], Ladro: ["leggere"],
  Mago: [], Monaco: [], Paladino: ["leggere", "medie", "pesanti", "scudi"],
  Ranger: ["leggere", "medie", "scudi"], Stregone: [], Warlock: ["leggere"],
};
const classTools: Record<string, string[]> = {
  Druido: ["Borsa da erborista"], Ladro: ["Arnesi da scasso"],
};

export function grantClassProficiencies(sheet: Sheet): Sheet {
  const saves = classSavingThrows[sheet.classe];
  if (!saves) return sheet;
  const source = `Classe: ${sheet.classe}`;
  const existing = sheet.fontiCompetenze ?? [];
  const grants = [
    ...saves.map((value) => ({ tipo: "tiroSalvezza" as const, valore: value, fonte: source })),
    ...(classWeapons[sheet.classe] ?? []).map((value) => ({ tipo: "arma" as const, valore: value, fonte: source })),
    ...(classArmor[sheet.classe] ?? []).map((value) => ({ tipo: "armatura" as const, valore: value, fonte: source })),
    ...(classTools[sheet.classe] ?? []).map((value) => ({ tipo: "strumento" as const, valore: value, fonte: source })),
  ];
  const added = grants.filter((grant) => !existing.some((record) =>
    record.tipo === grant.tipo && record.valore === grant.valore && record.fonte === source,
  ));
  return {
    ...sheet,
    classProficienciesApplied: true,
    caratteristiche: sheet.caratteristiche.map((item) => saves.includes(item.abbr) ? { ...item, tsCompetente: true } : item),
    competenzeArmi: [...new Set([...sheet.competenzeArmi, ...(classWeapons[sheet.classe] ?? [])])],
    competenzeArmatura: Object.fromEntries(Object.entries(sheet.competenzeArmatura).map(([kind, known]) => [kind, Boolean(known || classArmor[sheet.classe]?.includes(kind as keyof Sheet["competenzeArmatura"]))])) as Sheet["competenzeArmatura"],
    competenzeStrumenti: [...new Set([...(sheet.competenzeStrumenti ?? []), ...(classTools[sheet.classe] ?? [])])],
    fontiCompetenze: [...existing, ...added],
  };
}
