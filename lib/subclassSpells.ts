import tables from "./manuale-2024/incantesimi-sottoclassi.json";
import { canonicalSpellName } from "./spells";

type Table = { classe: string; sottoclasse: string; pagina: number; livelli: Record<string, string[]> };
const aliases = tables.alias as Record<string, string>;
const entries = tables.voci as unknown as Table[];

// Incantesimi sempre preparati che la sottoclasse concede proprio al livello indicato.
export function subclassSpellGrants(classe: string, subclass: string, level: number): string[] {
  const table = entries.find((item) => item.classe === classe && item.sottoclasse === subclass);
  return (table?.livelli[String(level)] ?? []).map((name) => canonicalSpellName(aliases[name] ?? name));
}

export function subclassSpellPage(classe: string, subclass: string): number | null {
  return entries.find((item) => item.classe === classe && item.sottoclasse === subclass)?.pagina ?? null;
}
