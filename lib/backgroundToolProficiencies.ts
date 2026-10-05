import type { Sheet } from "./sheet";
import phb from "./integrazioni-phb-2024.json";

// Player's Handbook 2024: competenze fisse dei background presenti nell'app.
const backgroundTools: Record<string, string> = {
  Accolito: "Scorte da calligrafo",
  Criminale: "Arnesi da scasso",
  Sapiente: "Scorte da calligrafo",
  Eremita: phb.background.Eremita.strumento,
  Guida: phb.background.Guida.strumento,
};

export function backgroundToolProficiency(background: string): string | null {
  return backgroundTools[background] ?? null;
}

export function grantBackgroundToolProficiency(sheet: Sheet): Sheet {
  const tool = backgroundToolProficiency(sheet.background);
  if (!tool) return sheet;
  const source = `Background: ${sheet.background}`;
  const existing = sheet.fontiCompetenze ?? [];
  return {
    ...sheet,
    competenzeStrumenti: [...new Set([...(sheet.competenzeStrumenti ?? []), tool])],
    fontiCompetenze: existing.some((record) => record.tipo === "strumento" && record.valore === tool && record.fonte === source)
      ? existing
      : [...existing, { tipo: "strumento", valore: tool, fonte: source }],
  };
}
