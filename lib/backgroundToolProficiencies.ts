import type { Sheet } from "./sheet";
import backgrounds from "./manuale-2024-backgrounds.json";

// Competenze negli strumenti dei background: Manuale del Giocatore 2024, pp. 178-185.
const backgroundTools: Record<string, string> = Object.fromEntries(
  Object.entries(backgrounds).filter(([, details]) => "tool" in details)
    .map(([name, details]) => [name, (details as { tool: string }).tool]),
);

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
