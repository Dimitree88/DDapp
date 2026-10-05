// Manuale del Giocatore 2024, tabella Armature, p. 219.
export type Armor = {
  id: string;
  name: string;
  category: "leggere" | "medie" | "pesanti" | "scudi";
  baseAc: number;
  dexterity: "full" | "max2" | "none";
  strength?: 13 | 15;
  stealthDisadvantage?: true;
  weightKg: number;
  costGp: number;
  source: "Manuale del Giocatore 2024";
};

export const armorCatalog: readonly Armor[] = [
  { id: "armatura-imbottita", name: "Armatura imbottita", category: "leggere", baseAc: 11, dexterity: "full", stealthDisadvantage: true, weightKg: 4, costGp: 5, source: "Manuale del Giocatore 2024" },
  { id: "armatura-di-cuoio", name: "Armatura di cuoio", category: "leggere", baseAc: 11, dexterity: "full", weightKg: 5, costGp: 10, source: "Manuale del Giocatore 2024" },
  { id: "armatura-di-cuoio-borchiato", name: "Armatura di cuoio borchiato", category: "leggere", baseAc: 12, dexterity: "full", weightKg: 6.5, costGp: 45, source: "Manuale del Giocatore 2024" },
  { id: "armatura-di-pelle", name: "Armatura di pelle", category: "medie", baseAc: 12, dexterity: "max2", weightKg: 6, costGp: 10, source: "Manuale del Giocatore 2024" },
  { id: "giaco-di-maglia", name: "Giaco di maglia", category: "medie", baseAc: 13, dexterity: "max2", weightKg: 10, costGp: 50, source: "Manuale del Giocatore 2024" },
  { id: "corazza-a-scaglie", name: "Corazza a scaglie", category: "medie", baseAc: 14, dexterity: "max2", stealthDisadvantage: true, weightKg: 22.5, costGp: 50, source: "Manuale del Giocatore 2024" },
  { id: "corazza-di-piastre", name: "Corazza di piastre", category: "medie", baseAc: 14, dexterity: "max2", weightKg: 10, costGp: 400, source: "Manuale del Giocatore 2024" },
  { id: "mezza-armatura", name: "Mezza armatura", category: "medie", baseAc: 15, dexterity: "max2", stealthDisadvantage: true, weightKg: 20, costGp: 750, source: "Manuale del Giocatore 2024" },
  { id: "corazza-ad-anelli", name: "Corazza ad anelli", category: "pesanti", baseAc: 14, dexterity: "none", stealthDisadvantage: true, weightKg: 20, costGp: 30, source: "Manuale del Giocatore 2024" },
  { id: "cotta-di-maglia", name: "Cotta di maglia", category: "pesanti", baseAc: 16, dexterity: "none", strength: 13, stealthDisadvantage: true, weightKg: 27.5, costGp: 75, source: "Manuale del Giocatore 2024" },
  { id: "corazza-a-strisce", name: "Corazza a strisce", category: "pesanti", baseAc: 17, dexterity: "none", strength: 15, stealthDisadvantage: true, weightKg: 30, costGp: 200, source: "Manuale del Giocatore 2024" },
  { id: "armatura-a-piastre", name: "Armatura a piastre", category: "pesanti", baseAc: 18, dexterity: "none", strength: 15, stealthDisadvantage: true, weightKg: 32.5, costGp: 1500, source: "Manuale del Giocatore 2024" },
  { id: "scudo", name: "Scudo", category: "scudi", baseAc: 2, dexterity: "none", weightKg: 3, costGp: 10, source: "Manuale del Giocatore 2024" },
];

export const armorById = (id: string) => armorCatalog.find((armor) => armor.id === id) ?? null;
