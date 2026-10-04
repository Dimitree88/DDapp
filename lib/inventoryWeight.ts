import type { Sheet } from "./sheet";
import { armorById } from "./armorCatalog";
import { gearById } from "./gearCatalog";
import { weaponByName } from "./weaponDetails";

export type InventoryWeight = { knownKg: number; unknownItems: string[] };

export function carryingCapacity(sheet: Sheet): number | null {
  const strength = Number(sheet.caratteristiche.find((item) => item.abbr === "FOR")?.valore ?? "");
  const multipliers: Record<string, number> = { Minuscola: 3.75, Piccola: 7.5, Media: 7.5, Grande: 15, Enorme: 30, Mastodontica: 60 };
  const multiplier = multipliers[sheet.taglia];
  return Number.isInteger(strength) && strength > 0 && multiplier ? strength * multiplier : null;
}

export function inventoryWeight(sheet: Sheet): InventoryWeight {
  let knownKg = 0;
  const unknownItems: string[] = [];
  for (const item of sheet.equipaggiamento) {
    const catalog = armorById(item.catalogId ?? "") ?? gearById(item.catalogId ?? "");
    const count = item.quantita === undefined || item.quantita === "" ? 1 : Number(item.quantita);
    if (!item.nome && !catalog) continue;
    if (!catalog || catalog.weightKg === undefined || !Number.isFinite(count)) unknownItems.push(item.nome || catalog?.name || "Oggetto senza nome");
    else knownKg += catalog.weightKg * count;
  }
  for (const weapon of sheet.armi) {
    const catalog = weaponByName(weapon.nome);
    const count = weapon.quantita === "" ? 1 : Number(weapon.quantita);
    if (!weapon.nome) continue;
    if (!catalog || catalog.weightKg === undefined || !Number.isFinite(count)) unknownItems.push(weapon.nome);
    else knownKg += catalog.weightKg * count;
  }
  return { knownKg: Math.round(knownKg * 100) / 100, unknownItems };
}
