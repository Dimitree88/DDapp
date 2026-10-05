import { armorById } from "./armorCatalog";
import type { Equip, Sheet } from "./sheet";

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
