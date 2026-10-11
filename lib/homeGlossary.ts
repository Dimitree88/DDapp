import { FILE_MANUALE, TESTI_MANUALE } from "./manuale-2024/registro";
import { manuale, chiaveRicerca } from "./manuale-2024";
import type { VoceBase } from "./manuale-2024/schema";

export type HomeGlossaryEntry = { id: string; name: string; category: string; description: string; reference: string };

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
  return [...byId.values()];
})();

export function searchHomeGlossary(query: string): HomeGlossaryEntry[] {
  const normalized = chiaveRicerca(query);
  if (normalized.length < 2) return [];
  const words = normalized.split(" ").filter(Boolean);
  return entries
    .map((entry) => {
      const name = chiaveRicerca(entry.name);
      const searchable = chiaveRicerca(`${entry.name} ${entry.category} ${entry.description}`);
      if (!words.every((word) => searchable.includes(word))) return null;
      const rank = name === normalized ? 0 : name.startsWith(normalized) ? 1 : name.includes(normalized) ? 2 : 3;
      return { entry, rank };
    })
    .filter((match): match is { entry: HomeGlossaryEntry; rank: number } => match !== null)
    .sort((a, b) => a.rank - b.rank || a.entry.name.localeCompare(b.entry.name, "it"))
    .slice(0, 10)
    .map(({ entry }) => entry);
}
