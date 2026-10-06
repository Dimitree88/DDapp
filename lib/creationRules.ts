import type { Sheet } from "./sheet";
import { classWeaponProficiencies } from "./classSavingThrows";
import { hasGrantedCompetency } from "./competencySources";

// Taglia di base della specie (Manuale del Giocatore 2024, cap. 4).
export const speciesSizes: Record<string, readonly string[]> = {
  Aasimar: ["Media", "Piccola"],
  Dragonide: ["Media"],
  Elfo: ["Media"],
  Gnomo: ["Piccola"],
  Goliath: ["Media"],
  Halfling: ["Piccola"],
  Nano: ["Media"],
  Orco: ["Media"],
  Tiefling: ["Media", "Piccola"],
  Umano: ["Media", "Piccola"],
};

const fixedFields = ["classe", "specie", "lignaggio", "background", "taglia"] as const;
const missing = (before: string[], after: string[]) => {
  const remaining = [...after];
  return before.filter((value) => {
    if (!value) return false;
    const index = remaining.indexOf(value);
    if (index < 0) return true;
    remaining.splice(index, 1);
    return false;
  });
};

// La scheda ordinaria non completa né cambia le scelte di identità.
export function creationErrors(before: Sheet, after: Sheet): string[] {
  if (!after.creazioneCompletata) return ["La creazione completata non può essere annullata."];
  const errors: string[] = [];
  for (const field of fixedFields) {
    if (before[field] === after[field]) continue;
    errors.push(field);
  }
  if (before.sottoclasse !== after.sottoclasse) errors.push("sottoclasse");
  for (const language of missing(before.lingue, after.lingue)) errors.push(`lingua ${language}`);
  for (const proficiency of missing(before.competenzeArmi, after.competenzeArmi)) {
    if (hasGrantedCompetency(before, "arma", proficiency, classWeaponProficiencies(before.classe).includes(proficiency))) {
      errors.push(`competenza ${proficiency}`);
    }
  }
  for (const feat of missing(before.talenti.map((item) => item.nome), after.talenti.map((item) => item.nome))) errors.push(`talento ${feat}`);
  return errors;
}
