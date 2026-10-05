import type { Sheet } from "./sheet";
import classFeatures from "./class-feature-grants.json";
import subclassFeatures from "./subclass-feature-grants.json";
import { featCatalog } from "./featCatalog";
import backgrounds from "./manuale-2024-backgrounds.json";
import pages2024 from "./manuale-2024-pages.json";
import { featPrerequisitesMet } from "./featPrerequisites";

export type Grant = { name: string; source: string; level?: number; detail?: string; page?: number };

const backgroundFeats: Record<string, string> = Object.fromEntries(
  Object.entries(backgrounds).map(([name, details]) => [name, details.feat]),
);

const traits = (names: string[]): { name: string; level?: number }[] => names.map((name) => ({ name }));
const speciesTraits: Record<string, { name: string; level?: number }[]> = {
  Aasimar: [...traits(["Mani curative", "Portatore di luce", "Resistenza celestiale", "Scurovisione"]), { name: "Rivelazione celestiale", level: 3 }],
  Dragonide: [...traits(["Discendenza draconica", "Resistenza ai danni", "Scurovisione", "Soffio"]), { name: "Volo draconico", level: 5 }],
  Elfo: traits(["Lignaggio elfico", "Retaggio fatato", "Scurovisione", "Sensi acuti", "Trance"]),
  Gnomo: traits(["Astuzia gnomesca", "Lignaggio gnomesco", "Scurovisione"]),
  Goliath: [...traits(["Costituzione robusta", "Discendenza gigantica"]), { name: "Forma Grande", level: 5 }],
  Halfling: traits(["Agilità halfling", "Coraggioso", "Fortuna", "Furtività innata"]),
  Nano: traits(["Esperto minatore", "Resilienza nanica", "Robustezza nanica", "Scurovisione"]),
  Orco: traits(["Resistenza implacabile", "Scarica di adrenalina", "Scurovisione"]),
  Tiefling: traits(["Presenza ultraterrena", "Retaggio immondo", "Scurovisione"]),
  Umano: traits(["Intraprendente", "Pluriabilità", "Versatile"]),
};

const lineageTraits: Record<string, string[]> = {
  Drow: ["Lignaggio drow"], "Elfo alto": ["Lignaggio elfo alto"],
  "Elfo dei boschi": ["Lignaggio elfo dei boschi"],
  "Gnomo delle foreste": ["Lignaggio gnomo delle foreste"],
  "Gnomo delle rocce": ["Lignaggio gnomo delle rocce"],
  Abissale: ["Retaggio abissale"], Ctonio: ["Retaggio ctonio"], Infernale: ["Retaggio infernale"],
};

const lineagePages: Record<string, number> = {
  Drow: 188, "Elfo alto": 188, "Elfo dei boschi": 188,
  "Gnomo delle foreste": 190, "Gnomo delle rocce": 190,
  Abissale: 195, Ctonio: 195, Infernale: 195,
};

export function grantedPrivileges(sheet: Sheet): Grant[] {
  const level = Number(sheet.livello);
  const fromClass = (classFeatures as Record<string, { level: number; name: string }[]>)[sheet.classe] ?? [];
  return [
    ...fromClass.filter((feature) => feature.level <= level && !feature.name.startsWith("Sottoclasse "))
      .map((feature) => ({ ...feature, source: `Classe: ${sheet.classe}` })),
    ...(sheet.sottoclasse && level >= 3 ? [{ name: sheet.sottoclasse, source: `Sottoclasse: ${sheet.classe}`, level: 3, page: (pages2024.subclasses as Record<string, number>)[sheet.sottoclasse] }] : []),
    ...((subclassFeatures as Record<string, { level: number; name: string }[]>)[sheet.sottoclasse] ?? [])
      .filter((feature) => feature.level <= level).map((feature) => ({ ...feature, source: `Sottoclasse: ${sheet.sottoclasse}` })),
    ...(speciesTraits[sheet.specie] ?? []).filter((trait) => !trait.level || trait.level <= level)
      .map((trait) => ({ ...trait, source: `Specie: ${sheet.specie}`, page: (pages2024.species as Record<string, number>)[sheet.specie] })),
    ...(lineageTraits[sheet.lignaggio] ?? []).map((name) => ({ name, source: `Lignaggio: ${sheet.lignaggio}`, page: lineagePages[sheet.lignaggio] })),
  ];
}

export function featGrants(sheet: Sheet): Grant[] {
  const level = Number(sheet.livello);
  const grants: Grant[] = [];
  const backgroundFeat = backgroundFeats[sheet.background];
  if (backgroundFeat) {
    const background = (backgrounds as Record<string, { spellList?: string }>)[sheet.background];
    grants.push({ name: backgroundFeat, source: `Background: ${sheet.background}`, page: (pages2024.feats as Record<string, number>)[backgroundFeat],
      detail: background?.spellList ? `Lista: ${background.spellList}` : undefined });
  }
  if (sheet.specie === "Umano") grants.push({ name: "Talento Origini a scelta", source: "Specie: Umano", page: (pages2024.species as Record<string, number>).Umano });
  if (["Guerriero", "Ranger", "Paladino"].includes(sheet.classe) && level >= (sheet.classe === "Guerriero" ? 1 : 2)) {
    grants.push({ name: "Talento Stile di combattimento a scelta", source: `Classe: ${sheet.classe}`, page: 209 });
  }
  for (const threshold of [4, 8, 12, 16]) {
    if (level >= threshold) grants.push({ name: "Talento a scelta", source: `Classe: ${sheet.classe}`, level: threshold });
  }
  if (sheet.classe === "Guerriero") for (const threshold of [6, 14]) {
    if (level >= threshold) grants.push({ name: "Talento a scelta", source: "Classe: Guerriero", level: threshold });
  }
  if (sheet.classe === "Ladro" && level >= 10) grants.push({ name: "Talento a scelta", source: "Classe: Ladro", level: 10 });
  if (sheet.sottoclasse === "Campione" && level >= 7) grants.push({ name: "Talento Stile di combattimento a scelta", source: "Sottoclasse: Campione", level: 7, page: 209 });
  if (level >= 19) grants.push({ name: "Dono epico a scelta", source: `Classe: ${sheet.classe}`, level: 19 });
  return grants;
}

const categoryFor = (name: string) => name === "Talento Origini a scelta" ? "origini"
  : name === "Talento Stile di combattimento a scelta" ? "stileDiCombattimento"
  : name === "Dono epico a scelta" ? "donoEpico" : "generali";

export function availableFeatChoices(sheet: Sheet): string[] {
  const acquired = [...sheet.talenti.filter((item) => item.nome)];
  const grants = featGrants(sheet);
  const available = new Set<string>();
  for (const grant of grants) {
    if (!grant.name.includes("a scelta")) {
      const index = acquired.findIndex((item) => item.nome === grant.name);
      if (index >= 0) acquired.splice(index, 1);
      else available.add(grant.name);
      continue;
    }
    const category = categoryFor(grant.name);
    // I privilegi di aumento e Dono epico permettono anche un altro talento
    // di cui si possiedono i prerequisiti (Manuale, pp. 53 e 199).
    const choices = featCatalog.filter((feat) => category === "donoEpico" || category === "generali" || feat.category === category)
      .filter((feat) => (grant.level ?? Number(sheet.livello)) >= feat.minLevel)
      .filter((feat) => featPrerequisitesMet(sheet, feat.name));
    const index = acquired.findIndex((item) => choices.some((feat) => feat.name === item.nome));
    if (index >= 0) acquired.splice(index, 1);
    else choices.forEach((feat) => { if (["Abile", "Adepto elementale", "Iniziato alla magia", "Aumento dei punteggi di caratteristica"].includes(feat.name) || !sheet.talenti.some((item) => item.nome === feat.name)) available.add(feat.name); });
  }
  return [...available];
}

export function availablePrivilegeChoices(sheet: Sheet): string[] {
  const choices: Record<string, string[]> = {
    Druido: ["Ordine primordiale"], Chierico: ["Ordine divino"],
  };
  return (choices[sheet.classe] ?? []).filter((name) =>
    Number(sheet.livello) >= 1 && !sheet.privilegi.some((item) => item.titolo === name));
}

export const privilegeOptions: Record<string, string[]> = {
  "Ordine primordiale": ["Mago", "Custode"],
  "Ordine divino": ["Protettore", "Taumaturgo"],
};
