import type { Sheet } from "./sheet";

export type ChangeReason = "reincarnazione" | "correzione_dm";

// Taglia di base della specie (SRD 5.2.1). Effetti temporanei non la cambiano.
export const speciesSizes: Record<string, readonly string[]> = {
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
const reincarnationFields: readonly string[] = ["specie", "lignaggio", "taglia"];
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

// I valori acquisiti possono crescere con l'avanzamento, ma non essere rimossi
// o sostituiti senza un'eccezione esplicita.
export function creationErrors(before: Sheet, after: Sheet, reason?: ChangeReason): string[] {
  if (!after.creazioneCompletata) return ["La creazione completata non può essere annullata."];
  const correction = reason === "correzione_dm";
  const errors: string[] = [];
  for (const field of fixedFields) {
    if (!before[field] || before[field] === after[field]) continue;
    if (!correction && !(reason === "reincarnazione" && reincarnationFields.includes(field))) errors.push(field);
  }
  if (before.sottoclasse && before.sottoclasse !== after.sottoclasse && !correction) errors.push("sottoclasse");
  if (correction) return errors;
  for (const language of missing(before.lingue, after.lingue)) errors.push(`lingua ${language}`);
  for (const proficiency of missing(before.competenzeArmi, after.competenzeArmi)) errors.push(`competenza ${proficiency}`);
  for (const [key, known] of Object.entries(before.competenzeArmatura)) {
    if (known && !after.competenzeArmatura[key as keyof Sheet["competenzeArmatura"]]) errors.push(`competenza armatura ${key}`);
  }
  for (const old of before.caratteristiche) {
    const current = after.caratteristiche.find((item) => item.abbr === old.abbr);
    if (old.tsCompetente && !current?.tsCompetente) errors.push(`tiro salvezza ${old.abbr}`);
  }
  for (const old of before.abilita) {
    const current = after.abilita.find((item) => item.nome === old.nome);
    if (old.competente && !current?.competente) errors.push(`competenza ${old.nome}`);
    if (old.maestria && !current?.maestria) errors.push(`maestria ${old.nome}`);
  }
  for (const feat of missing(before.talenti.map((item) => item.nome), after.talenti.map((item) => item.nome))) errors.push(`talento ${feat}`);
  return errors;
}
