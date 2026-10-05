import type { Sheet } from "./sheet";

const crafterChoices: Record<string, string> = {
  falegname: "Strumenti da falegname",
  fabbro: "Strumenti da fabbro",
  inventore: "Strumenti da inventore",
};

export function featToolProficiencies(sheet: Sheet): string[] {
  const feat = sheet.talenti.find((item) => item.nome === "Lavoro manuale");
  if (!feat?.scelte) return [];
  return [...new Set(feat.scelte.split(/[,;\n]/).map((value) => {
    const choice = value.trim().toLocaleLowerCase("it-IT");
    return crafterChoices[choice] ?? Object.values(crafterChoices).find((name) => name.toLocaleLowerCase("it-IT") === choice);
  }).filter((name): name is string => Boolean(name)))];
}

export function grantFeatToolProficiencies(sheet: Sheet): Sheet {
  const tools = featToolProficiencies(sheet);
  if (!tools.length) return sheet;
  const source = "Talento: Lavoro manuale";
  const existing = sheet.fontiCompetenze ?? [];
  return {
    ...sheet,
    competenzeStrumenti: [...new Set([...(sheet.competenzeStrumenti ?? []), ...tools])],
    fontiCompetenze: [...existing, ...tools.filter((tool) => !existing.some((record) => record.tipo === "strumento" && record.valore === tool && record.fonte === source)).map((tool) => ({ tipo: "strumento" as const, valore: tool, fonte: source }))],
  };
}
