import { armorById, armorCatalog } from "./armorCatalog";
import { gearCatalog } from "./gearCatalog";
import type { Equip, Sheet } from "./sheet";

export function armorForEquipment(item: Equip) {
  return armorById(item.catalogId ?? "") ?? armorCatalog.find((armor) => armor.name === item.nome) ?? null;
}

export function isArmorEquipment(item: Equip): boolean {
  return armorForEquipment(item) !== null;
}

const magicGearIds = new Set(["srd52:gear:pozione-guarigione", "srd52:gear:pergamena-livello-1", "srd52:gear:pergamena-trucchetto"]);
const magicGearNames = new Set(gearCatalog.filter((gear) => magicGearIds.has(gear.id)).map((gear) => gear.name));

export function isMagicGearId(id: string): boolean {
  return magicGearIds.has(id);
}

export function isMagicEquipment(item: Equip): boolean {
  return item.magico === true || magicGearIds.has(item.catalogId ?? "") || magicGearNames.has(item.nome);
}

export function replaceEquipmentGroup(all: Equip[], items: Equip[], magic: boolean): Equip[] {
  return [...all.filter((item) => isArmorEquipment(item) || isMagicEquipment(item) !== magic), ...items];
}

export function replaceOtherEquipment(all: Equip[], other: Equip[]): Equip[] {
  return [...all.filter(isArmorEquipment), ...other];
}

export function selectWornArmor(sheet: Sheet, catalogId: string | null, preferredIndex?: number): Equip[] {
  const armor = catalogId ? armorById(catalogId) : null;
  if (catalogId && (!armor || armor.category === "scudi")) return sheet.equipaggiamento;
  const items = sheet.equipaggiamento.map((item) => ({ ...item, indossato: false }));
  if (!armor) return items;
  const index = preferredIndex !== undefined && items[preferredIndex]?.catalogId === catalogId
    ? preferredIndex : items.findIndex((item) => item.catalogId === catalogId || (!item.catalogId && item.nome === armor.name));
  if (index >= 0) items[index] = { ...items[index], catalogId: armor.id, indossato: true };
  else items.push({ nome: armor.name, catalogId: armor.id, quantita: "1", dettaglio: "", indossato: true });
  return items;
}

export function selectHeldShield(sheet: Sheet, enabled: boolean, preferredIndex?: number): Pick<Sheet, "scudo" | "equipaggiamento"> {
  const items = sheet.equipaggiamento.map((item) => ({ ...item, impugnato: false }));
  if (enabled) {
    const index = preferredIndex !== undefined && armorById(items[preferredIndex]?.catalogId ?? "")?.category === "scudi"
      ? preferredIndex : items.findIndex((item) => armorById(item.catalogId ?? "")?.category === "scudi" || (!item.catalogId && item.nome === "Scudo"));
    if (index >= 0) items[index] = { ...items[index], catalogId: "scudo", impugnato: true };
    else items.push({ nome: "Scudo", catalogId: "scudo", quantita: "1", dettaglio: "", impugnato: true });
  }
  return { scudo: enabled, equipaggiamento: items };
}
