import { FILE_MANUALE, TESTI_MANUALE } from "./manuale-2024/registro";
import { manuale, chiaveRicerca } from "./manuale-2024";
import type { VoceBase } from "./manuale-2024/schema";
import { equipmentDetails } from "./equipmentDetails";
import { gearCatalog } from "./gearCatalog";
import { weaponCatalog, weaponDetails } from "./weaponDetails";
import { helpFor } from "./fieldHelp";

export type HomeGlossaryEntry = { id: string; name: string; category: string; description: string; reference: string; searchNames?: string[] };

const entries: HomeGlossaryEntry[] = (() => {
  const byId = new Map<string, HomeGlossaryEntry>();
  const add = (voce: VoceBase, domain: string) => {
    const description = TESTI_MANUALE[domain]?.testi[voce.id]?.trim();
    if (!description) return;
    const name = voce.nome.trim();
    if (!name) return;
    const record = manuale.perId(voce.id);
    byId.set(voce.id, {
      id: voce.id,
      name,
      category: domain.split("/").at(-1)?.replaceAll("-", " ") ?? "Glossario",
      description,
      reference: record?.riferimento ?? `Manuale del Giocatore 2024, p. ${voce.pagina}`,
    });
  };
  for (const [domain, file] of Object.entries(FILE_MANUALE)) {
    for (const voce of [...file.etichette, ...file.voci]) {
      add(voce, domain);
      if ("privilegi" in voce && Array.isArray(voce.privilegi)) voce.privilegi.forEach((item) => add(item, domain));
      if ("tratti" in voce && Array.isArray(voce.tratti)) voce.tratti.forEach((item) => add(item, domain));
    }
  }
  for (const weapon of weaponCatalog) {
    byId.set(`arma:${weapon.id}`, {
      id: `arma:${weapon.id}`, name: weapon.name, category: "Armi",
      description: weaponDetails(weapon.name) ?? "",
      reference: "Manuale del Giocatore 2024, p. 215",
    });
  }
  for (const gear of gearCatalog) {
    const details = equipmentDetails(gear.name);
    if (!details?.meaning) continue;
    byId.set(`equipaggiamento:${gear.id}`, {
      id: `equipaggiamento:${gear.id}`, name: gear.name, category: "Equipaggiamento",
      description: details.meaning,
      reference: `Manuale del Giocatore 2024, p. ${details.page ?? gear.sourcePage ?? 223}`,
    });
  }
  const magicRules = [
    { id: "Oggetto magico", name: "Oggetto magico", searchNames: ["Identificare un oggetto magico", "Oggetti magici"] },
    { id: "In sintonia", name: "Sintonia con un oggetto magico", searchNames: ["Sintonia", "In sintonia", "Sintonizzazione con un oggetto magico"] },
  ];
  for (const rule of magicRules) {
    const help = helpFor(rule.id);
    if (!help) continue;
    byId.set(`regola:${rule.id}`, {
      id: `regola:${rule.id}`, name: rule.name, searchNames: rule.searchNames,
      category: "Oggetti magici", description: help.meaning,
      reference: "Manuale del Giocatore 2024, p. 232",
    });
  }
  return [...byId.values()];
})();

export function searchHomeGlossary(query: string): HomeGlossaryEntry[] {
  const normalized = chiaveRicerca(query);
  if (normalized.length < 2) return [];
  const words = normalized.split(" ").filter(Boolean);
  return entries
    .map((entry) => {
      const names = [entry.name, ...(entry.searchNames ?? [])].map(chiaveRicerca);
      const matchingName = names.find((name) => words.every((word) => name.includes(word)));
      if (!matchingName) return null;
      const rank = matchingName === normalized ? 0 : matchingName.startsWith(normalized) ? 1 : matchingName.includes(normalized) ? 2 : 3;
      return { entry, rank };
    })
    .filter((match): match is { entry: HomeGlossaryEntry; rank: number } => match !== null)
    .sort((a, b) => a.rank - b.rank || a.entry.name.localeCompare(b.entry.name, "it"))
    .slice(0, 10)
    .map(({ entry }) => entry);
}
