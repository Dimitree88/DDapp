import { armorById } from "./armorCatalog";
import type { Sheet } from "./sheet";

// Velocità di base delle specie, Manuale del Giocatore 2024, pp. 186-197.
export const speciesSpeed: Record<string, number> = {
  Dragonide: 9, Elfo: 9, Gnomo: 9, Goliath: 10.5, Halfling: 9,
  Nano: 9, Orco: 9, Tiefling: 9, Umano: 9,
};

export function calculatedSpeed(sheet: Sheet): { value: number; formula: string } | null {
  if (sheet.velocitaModo !== "specie") return null;
  const base = sheet.specie === "Elfo" && sheet.lignaggio === "Elfo dei boschi" ? 10.5 : speciesSpeed[sheet.specie];
  if (base === undefined) return null;
  const armor = sheet.equipaggiamento.find((item) => item.indossato);
  const requirement = armorById(armor?.catalogId ?? "")?.strength;
  const strength = Number(sheet.caratteristiche.find((item) => item.abbr === "FOR")?.valore ?? "");
  if (requirement && !strength) return null;
  const penalty = requirement && strength < requirement ? 3 : 0;
  const changes = sheet.modificatoriVelocita ?? [];
  if (changes.some((change) => !Number.isFinite(change.value))) return null;
  const total = Math.max(0, base - penalty + changes.reduce((sum, change) => sum + change.value, 0));
  return { value: total, formula: `${base} m (${sheet.specie}${sheet.lignaggio ? `, ${sheet.lignaggio}` : ""})${penalty ? " - 3 m (armatura)" : ""}${changes.map((change) => ` ${change.value >= 0 ? "+" : ""}${change.value} m (${change.fonte})`).join("")} = ${total} m` };
}

export function displayedSpeed(sheet: Sheet): string {
  return sheet.velocitaModo === "specie" ? String(calculatedSpeed(sheet)?.value ?? "") : sheet.velocita;
}
