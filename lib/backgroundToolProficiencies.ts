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

// Le due competenze fisse sono riportate nei tratti di ogni background,
// Manuale del Giocatore 2024, pp. 178-185. Si applicano una volta sola,
// come le competenze iniziali di classe, per conservare correzioni manuali.
export function grantBackgroundSkills(sheet: Sheet): Sheet {
  const skills = (backgrounds as Record<string, { skills: string[] }>)[sheet.background]?.skills;
  if (!skills || sheet.backgroundSkillsApplied) return sheet;
  const source = `Background: ${sheet.background}`;
  const existing = sheet.fontiCompetenze ?? [];
  return {
    ...sheet,
    backgroundSkillsApplied: true,
    abilita: sheet.abilita.map((ability) => skills.includes(ability.nome) ? { ...ability, competente: true } : ability),
    fontiCompetenze: [
      ...existing,
      ...skills.filter((name) => !existing.some((record) => record.tipo === "abilita" && record.valore === name && record.fonte === source))
        .map((name) => ({ tipo: "abilita" as const, valore: name, fonte: source })),
    ],
  };
}
