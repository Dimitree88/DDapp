import type { FonteCompetenza, Sheet } from "./sheet";

// Le competenze acquisite restano registrate anche se la fonte viene corretta.
// Non si revocano automaticamente: possono provenire da piu fonti o da scelte manuali.
export function grantCompetencies(sheet: Sheet, sources: FonteCompetenza[]): Partial<Sheet> {
  const patch: Partial<Sheet> = { fontiCompetenze: sources };
  for (const { tipo, valore, fonte } of sources) {
    if (!valore || !fonte.trim()) continue;
    if (tipo === "abilita" && sheet.abilita.some((item) => item.nome === valore)) {
      patch.abilita = (patch.abilita ?? sheet.abilita).map((item) => item.nome === valore ? { ...item, competente: true } : item);
    } else if (tipo === "tiroSalvezza" && sheet.caratteristiche.some((item) => item.abbr === valore)) {
      patch.caratteristiche = (patch.caratteristiche ?? sheet.caratteristiche).map((item) => item.abbr === valore ? { ...item, tsCompetente: true } : item);
    } else if (tipo === "arma") {
      patch.competenzeArmi = [...new Set([...(patch.competenzeArmi ?? sheet.competenzeArmi), valore])];
    } else if (tipo === "armatura" && valore in sheet.competenzeArmatura) {
      patch.competenzeArmatura = { ...(patch.competenzeArmatura ?? sheet.competenzeArmatura), [valore]: true };
    } else if (tipo === "strumento") {
      patch.competenzeStrumenti = [...new Set([...(patch.competenzeStrumenti ?? sheet.competenzeStrumenti ?? []), valore])];
    } else if (tipo === "lingua") {
      patch.lingue = [...new Set([...(patch.lingue ?? sheet.lingue), valore])];
    }
  }
  return patch;
}

export function setCheckboxCompetency(sheet: Sheet, type: "abilita" | "tiroSalvezza" | "armatura", value: string, checked: boolean): Partial<Sheet> {
  const patch: Partial<Sheet> = {
    classProficienciesApplied: true,
    fontiCompetenze: checked ? sheet.fontiCompetenze : (sheet.fontiCompetenze ?? []).filter((record) => record.tipo !== type || record.valore !== value),
  };
  if (type === "abilita") patch.abilita = sheet.abilita.map((item) => item.nome === value ? { ...item, competente: checked, maestria: checked && item.maestria } : item);
  if (type === "tiroSalvezza") patch.caratteristiche = sheet.caratteristiche.map((item) => item.abbr === value ? { ...item, tsCompetente: checked } : item);
  if (type === "armatura") patch.competenzeArmatura = { ...sheet.competenzeArmatura, [value]: checked };
  return patch;
}
