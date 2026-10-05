import { classToolProficiencies } from "./classSavingThrows";
import { backgroundToolProficiency } from "./backgroundToolProficiencies";
import { featToolProficiencies } from "./featToolProficiencies";
import { hasGrantedCompetency } from "./competencySources";
import { equipmentDetails } from "./equipmentDetails";
import { gearByName } from "./gearCatalog";
import backgrounds from "./manuale-2024-backgrounds.json";
import type { Sheet } from "./sheet";

// Scelte dei background (pp. 178-185) e dei tratti iniziali del Bardo e del Monaco
// (pp. 59 e 123) nel Manuale del Giocatore 2024.
function toolChoiceGrants(sheet: Sheet): { source: string; count: number; kinds: string[] }[] {
  const grants: { source: string; count: number; kinds: string[] }[] = [];
  const background = (backgrounds as Record<string, { toolChoice?: string }>)[sheet.background];
  const kind = background?.toolChoice === "strumento da artigiano" ? "artigiano"
    : background?.toolChoice === "strumento musicale" ? "musicale"
      : background?.toolChoice === "tipo di gioco" ? "gioco" : null;
  if (kind) grants.push({ source: `Background: ${sheet.background}`, count: 1, kinds: [kind] });
  if (sheet.classe === "Bardo") grants.push({ source: "Classe: Bardo", count: 3, kinds: ["musicale"] });
  if (sheet.classe === "Monaco") grants.push({ source: "Classe: Monaco", count: 1, kinds: ["artigiano", "musicale"] });
  return grants;
}

export function pendingToolChoiceSources(sheet: Sheet): { source: string; remaining: number }[] {
  return toolChoiceGrants(sheet).map((grant) => ({
    source: grant.source,
    remaining: Math.max(0, grant.count - (sheet.fontiCompetenze ?? []).filter((record) => record.tipo === "strumento" && record.fonte === grant.source && grant.kinds.includes(gearByName(record.valore)?.toolKind ?? "")).length),
  })).filter((grant) => grant.remaining > 0);
}

function toolChoiceSource(sheet: Sheet, name: string): string | null {
  const kind = gearByName(name)?.toolKind;
  if (!kind) return null;
  for (const grant of toolChoiceGrants(sheet)) {
    if (grant.kinds.includes(kind) && pendingToolChoiceSources(sheet).some((pending) => pending.source === grant.source)) return grant.source;
  }
  return null;
}

export function toolCompetencyDetails(sheet: Sheet, name: string): string {
  const origins = [
    ...(classToolProficiencies(sheet.classe).includes(name) ? [`Classe: ${sheet.classe}`] : []),
    ...(backgroundToolProficiency(sheet.background) === name ? [`Background: ${sheet.background}`] : []),
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
  const source = toolChoiceSource(sheet, name) ?? "Aggiunta manuale";
  return {
    competenzeStrumenti: [...(sheet.competenzeStrumenti ?? []), name],
    fontiCompetenze: [...(sheet.fontiCompetenze ?? []), { tipo: "strumento", valore: name, fonte: source }],
  };
}

export function removeToolCompetency(sheet: Sheet, name: string): Partial<Sheet> {
  if (hasGrantedCompetency(sheet, "strumento", name, classToolProficiencies(sheet.classe).includes(name) || backgroundToolProficiency(sheet.background) === name || featToolProficiencies(sheet).includes(name))) return {};
  return {
    competenzeStrumenti: (sheet.competenzeStrumenti ?? []).filter((value) => value !== name),
    fontiCompetenze: (sheet.fontiCompetenze ?? []).filter((record) => record.tipo !== "strumento" || record.valore !== name),
  };
}
