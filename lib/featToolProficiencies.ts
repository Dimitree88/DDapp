import type { Sheet } from "./sheet";
import { gearCatalog } from "./gearCatalog";

// Manuale del Giocatore 2024, Fabbricazione rapida p. 201 e Musicista p. 202.
const crafterNames = ["conciatore", "fabbro", "falegname", "intagliatore", "inventore", "muratore", "tessitore", "vasaio"];
export const crafterFeatTools = gearCatalog.filter((gear) => gear.tool && crafterNames.some((name) => gear.id === `srd52:tool:strumenti-${name}`)).map((gear) => gear.name);
export const musicalTools = gearCatalog.filter((gear) => gear.id.startsWith("phb24:tool:musicale-")).map((gear) => gear.name);

function choices(text: string, allowed: string[]): string[] {
  return [...new Set(text.split(/[,;\n]/).map((part) => {
    const choice = part.trim().toLocaleLowerCase("it-IT");
    return allowed.find((name) => name.toLocaleLowerCase("it-IT") === choice || name.toLocaleLowerCase("it-IT").replace(/^strumenti da /, "") === choice);
  }).filter((name): name is string => Boolean(name)))].slice(0, 3);
}

export function featToolProficiencies(sheet: Sheet): string[] {
  return [...new Set(sheet.talenti.flatMap((feat) => feat.nome === "Lavoro manuale"
    ? choices(feat.scelte, crafterFeatTools)
    : feat.nome === "Musicista" ? choices(feat.scelte, musicalTools) : []))];
}

export function grantFeatToolProficiencies(sheet: Sheet): Sheet {
  const grants = sheet.talenti.flatMap((feat) => {
    const allowed = feat.nome === "Lavoro manuale" ? crafterFeatTools : feat.nome === "Musicista" ? musicalTools : [];
    return choices(feat.scelte, allowed).map((tool) => ({ tipo: "strumento" as const, valore: tool, fonte: `Talento: ${feat.nome}` }));
  });
  if (!grants.length) return sheet;
  const existing = sheet.fontiCompetenze ?? [];
  return {
    ...sheet,
    competenzeStrumenti: [...new Set([...(sheet.competenzeStrumenti ?? []), ...grants.map((grant) => grant.valore)])],
    fontiCompetenze: [...existing, ...grants.filter((grant) => !existing.some((record) => record.tipo === grant.tipo && record.valore === grant.valore && record.fonte === grant.fonte))],
  };
}
