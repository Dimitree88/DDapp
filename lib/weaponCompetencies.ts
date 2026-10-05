import { classWeaponProficiencies } from "./classSavingThrows";
import { hasGrantedCompetency } from "./competencySources";
import type { Sheet } from "./sheet";
import { weaponDetails } from "./weaponDetails";

const categoryDetails: Record<string, string> = {
  "Armi semplici": "Competenza con tutte le armi semplici.",
  "Armi da guerra": "Competenza con tutte le armi da guerra.",
  "Armi da guerra leggere": "Competenza con le armi da guerra che hanno la proprietà Leggera.",
  "Armi da guerra accurate o leggere": "Competenza con le armi da guerra che hanno la proprietà Accurata oppure Leggera.",
};

export function weaponCompetencyDetails(sheet: Sheet, name: string): string {
  const origins = [
    ...(classWeaponProficiencies(sheet.classe).includes(name) ? [`Classe: ${sheet.classe}`] : []),
    ...(sheet.fontiCompetenze ?? []).filter((record) => record.tipo === "arma" && record.valore === name).map((record) => record.fonte),
  ];
  return [
    categoryDetails[name] ?? weaponDetails(name) ?? `Competenza nell'uso di ${name}.`,
    `Origine: ${[...new Set(origins)].filter(Boolean).join("; ") || "non registrata"}.`,
  ].join("\n\n");
}

export function addWeaponCompetency(sheet: Sheet, name: string): Partial<Sheet> {
  if (sheet.competenzeArmi.includes(name)) return {};
  return {
    competenzeArmi: [...sheet.competenzeArmi, name],
    fontiCompetenze: [...(sheet.fontiCompetenze ?? []), { tipo: "arma", valore: name, fonte: "Aggiunta manuale" }],
  };
}

export function removeWeaponCompetency(sheet: Sheet, name: string): Partial<Sheet> {
  if (hasGrantedCompetency(sheet, "arma", name, classWeaponProficiencies(sheet.classe).includes(name))) return {};
  return {
    competenzeArmi: sheet.competenzeArmi.filter((value) => value !== name),
    fontiCompetenze: (sheet.fontiCompetenze ?? []).filter((record) => record.tipo !== "arma" || record.valore !== name),
  };
}
