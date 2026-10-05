import type { Sheet } from "./sheet";
import backgrounds from "./manuale-2024-backgrounds.json";

// Player's Handbook 2024: competenze fisse dei background presenti nell'app.
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
