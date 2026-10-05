import { classToolProficiencies } from "./classSavingThrows";
import { backgroundToolProficiency } from "./backgroundToolProficiencies";
import { featToolProficiencies } from "./featToolProficiencies";
import { hasGrantedCompetency } from "./competencySources";
import { equipmentDetails } from "./equipmentDetails";
import type { Sheet } from "./sheet";

export function toolCompetencyDetails(sheet: Sheet, name: string): string {
  const origins = [
    ...(classToolProficiencies(sheet.classe).includes(name) ? [`Classe: ${sheet.classe}`] : []),
    ...(backgroundToolProficiency(sheet.background) === name ? [`Background: ${sheet.background}`] : []),
    ...(featToolProficiencies(sheet).includes(name) ? ["Talento: Lavoro manuale"] : []),
    ...(sheet.fontiCompetenze ?? []).filter((record) => record.tipo === "strumento" && record.valore === name).map((record) => record.fonte),
  ];
  return [
    equipmentDetails(name, "")?.meaning ?? `Competenza nell'uso di ${name}.`,
    "La competenza aggiunge il bonus alle prove che usano questo strumento. Se è pertinente anche un'abilità in cui sei competente, la prova ha vantaggio.",
    `Origine: ${[...new Set(origins)].filter(Boolean).join("; ") || "non registrata"}.`,
  ].join("\n\n");
}

export function addToolCompetency(sheet: Sheet, name: string): Partial<Sheet> {
  if ((sheet.competenzeStrumenti ?? []).includes(name)) return {};
  return {
    competenzeStrumenti: [...(sheet.competenzeStrumenti ?? []), name],
    fontiCompetenze: [...(sheet.fontiCompetenze ?? []), { tipo: "strumento", valore: name, fonte: "Aggiunta manuale" }],
  };
}

export function removeToolCompetency(sheet: Sheet, name: string): Partial<Sheet> {
  if (hasGrantedCompetency(sheet, "strumento", name, classToolProficiencies(sheet.classe).includes(name) || backgroundToolProficiency(sheet.background) === name || featToolProficiencies(sheet).includes(name))) return {};
  return {
    competenzeStrumenti: (sheet.competenzeStrumenti ?? []).filter((value) => value !== name),
    fontiCompetenze: (sheet.fontiCompetenze ?? []).filter((record) => record.tipo !== "strumento" || record.valore !== name),
  };
}
