import type { Sheet } from "./sheet";
import classFeatures from "./class-feature-grants.json";
import subclassFeatures from "./subclass-feature-grants.json";
import { featCatalog } from "./featCatalog";
import phb from "./integrazioni-phb-2024.json";

export type Grant = { name: string; source: string; level?: number; detail?: string };

const backgroundFeats: Record<string, string> = {
  Accolito: "Iniziato alla magia", Criminale: "Allerta",
  Sapiente: "Iniziato alla magia", Soldato: "Aggressore selvaggio",
  Eremita: phb.background.Eremita.talento.nome,
  Guida: phb.background.Guida.talento.nome,
};

const speciesTraits: Record<string, string[]> = {
  Dragonide: ["Retaggio draconico", "Soffio", "Resistenza ai danni"],
  Elfo: ["Scurovisione", "Discendenza fatata", "Sensi acuti", "Trance"],
  Gnomo: ["Scurovisione", "Astuzia gnomesca"],
  Goliath: ["Statura possente", "Discendenza gigantica"],
  Halfling: ["Coraggioso", "Agilità halfling", "Fortunato", "Furtività naturale"],
  Nano: ["Scurovisione", "Resistenza nanica", "Esperto minatore", "Robustezza nanica"],
  Orco: ["Scurovisione", "Scarica di adrenalina", "Tenacia implacabile"],
  Tiefling: ["Scurovisione", "Retaggio immondo", "Presenza ultraterrena"],
  Umano: ["Intraprendente", "Pluriabilità", "Versatile"],
};

const lineageTraits: Record<string, string[]> = {
  Drow: ["Lignaggio drow"], "Elfo alto": ["Lignaggio elfo alto"],
  "Elfo dei boschi": ["Lignaggio elfo dei boschi"],
  "Gnomo delle foreste": ["Lignaggio gnomo delle foreste"],
  "Gnomo delle rocce": ["Lignaggio gnomo delle rocce"],
  Abissale: ["Retaggio abissale"], Ctonio: ["Retaggio ctonio"], Infernale: ["Retaggio infernale"],
};

export function grantedPrivileges(sheet: Sheet): Grant[] {
  const level = Number(sheet.livello);
  const fromClass = (classFeatures as Record<string, { level: number; name: string }[]>)[sheet.classe] ?? [];
  return [
    ...fromClass.filter((feature) => feature.level <= level && !feature.name.startsWith("Sottoclasse "))
      .map((feature) => ({ ...feature, source: `Classe: ${sheet.classe}` })),
    ...(sheet.sottoclasse && level >= 3 ? [{ name: sheet.sottoclasse, source: `Sottoclasse: ${sheet.classe}`, level: 3 }] : []),
    ...((subclassFeatures as Record<string, { level: number; name: string }[]>)[sheet.sottoclasse] ?? [])
      .filter((feature) => feature.level <= level).map((feature) => ({ ...feature, source: `Sottoclasse: ${sheet.sottoclasse}` })),
    ...(speciesTraits[sheet.specie] ?? []).map((name) => ({ name, source: `Specie: ${sheet.specie}` })),
    ...(lineageTraits[sheet.lignaggio] ?? []).map((name) => ({ name, source: `Lignaggio: ${sheet.lignaggio}` })),
  ];
}

export function featGrants(sheet: Sheet): Grant[] {
  const level = Number(sheet.livello);
  const grants: Grant[] = [];
  const backgroundFeat = backgroundFeats[sheet.background];
  if (backgroundFeat) grants.push({ name: backgroundFeat, source: `Background: ${sheet.background}`,
    detail: sheet.background === "Guida" ? `Lista: ${phb.background.Guida.talento.listaIncantesimi}`
      : sheet.background === "Accolito" ? "Lista: Chierico"
      : sheet.background === "Sapiente" ? "Lista: Mago" : undefined });
  if (sheet.specie === "Umano") grants.push({ name: "Talento Origini a scelta", source: "Specie: Umano" });
  if (["Guerriero", "Ranger", "Paladino"].includes(sheet.classe) && level >= (sheet.classe === "Guerriero" ? 1 : 2)) {
    grants.push({ name: "Talento Stile di combattimento a scelta", source: `Classe: ${sheet.classe}` });
  }
  for (const threshold of [4, 8, 12, 16]) {
    if (level >= threshold) grants.push({ name: "Talento Generale a scelta", source: `Classe: ${sheet.classe}`, level: threshold });
  }
  if (sheet.classe === "Guerriero") for (const threshold of [6, 14]) {
    if (level >= threshold) grants.push({ name: "Talento Generale a scelta", source: "Classe: Guerriero", level: threshold });
  }
  if (sheet.classe === "Ladro" && level >= 10) grants.push({ name: "Talento Generale a scelta", source: "Classe: Ladro", level: 10 });
  if (sheet.sottoclasse === "Campione" && level >= 7) grants.push({ name: "Talento Stile di combattimento a scelta", source: "Sottoclasse: Campione", level: 7 });
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
      continue;
    }
    const category = categoryFor(grant.name);
    const choices = featCatalog.filter((feat) => feat.category === category || category === "generali" && feat.category === "origini")
      .filter((feat) => Number(sheet.livello) >= feat.minLevel)
      .filter((feat) => feat.name !== "Lottatore" || sheet.caratteristiche.some((ability) => ["FOR", "DES"].includes(ability.abbr) && Number(ability.valore) >= 13))
      .filter((feat) => feat.name !== "Dono del richiamo degli incantesimi" || grantedPrivileges(sheet).some((known) => known.name === "Incantesimi" || known.name === "Magia del patto"));
    const index = acquired.findIndex((item) => choices.some((feat) => feat.name === item.nome));
    if (index >= 0) acquired.splice(index, 1);
    else choices.forEach((feat) => { if (["Abile", "Iniziato alla magia", "Aumento dei punteggi di caratteristica"].includes(feat.name) || !sheet.talenti.some((item) => item.nome === feat.name)) available.add(feat.name); });
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
