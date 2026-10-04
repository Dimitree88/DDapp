import rules from "./regole-srd-2024.json";

export type FeatEntry = { name: string; id: string; category: "origini" | "generali" | "stileDiCombattimento" | "donoEpico"; minLevel: number; source: "SRD 5.2.1" | "Integrazione 2024" };

const categories = ["origini", "generali", "stileDiCombattimento", "donoEpico"] as const;
export const featCatalog: FeatEntry[] = categories.flatMap((category) => rules.talenti[category].map((name) => ({
  name,
  id: `2024:feat:${name.toLocaleLowerCase("it").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`,
  category,
  minLevel: category === "donoEpico" ? 19 : category === "generali" ? 4 : 1,
  source: (rules.integrazioniNonSrd.talenti as string[]).includes(name) ? "Integrazione 2024" as const : "SRD 5.2.1" as const,
})));

export const featByName = (name: string) => featCatalog.find((entry) => entry.name === name);
export const availableFeats = (level: number) => featCatalog.filter((entry) => level >= entry.minLevel).map((entry) => entry.name);
