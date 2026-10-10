import { armorById, armorCatalog } from "./armorCatalog";
import { gearById, gearByName, gearCatalog } from "./gearCatalog";
import type { Equip, Sheet } from "./sheet";
import { weaponByName } from "./weaponDetails";

export function weaponHandUsage(sheet: Sheet, weaponIndex: number): number {
  const weapon = sheet.armi[weaponIndex];
  if (!weapon) return 0;
  const entry = weaponByName(weapon.nome);
  return weapon.modo === "dueMani" || entry?.properties.split(",").some((property) => property.trim().toLowerCase().startsWith("due mani")) ? 2 : 1;
}

export function heldHandsUsed(sheet: Sheet): number {
  const weapons = sheet.armi.reduce((total, weapon, index) => total + (weapon.impugnata ? weaponHandUsage(sheet, index) : 0), 0);
  const shield = sheet.scudo || sheet.equipaggiamento.some((item) => item.impugnato && armorForEquipment(item)?.category === "scudi");
  return weapons + (shield ? 1 : 0);
}

export function selectHeldWeapon(sheet: Sheet, weaponIndex: number, enabled: boolean): Sheet["armi"] {
  if (!sheet.armi[weaponIndex] || enabled && Number(sheet.armi[weaponIndex].quantita || "1") < 1) return sheet.armi;
  const next = sheet.armi.map((weapon, index) => index === weaponIndex ? { ...weapon, impugnata: enabled } : weapon);
  const candidate = { ...sheet, armi: next };
  return heldHandsUsed(candidate) <= 2 ? next : sheet.armi;
}

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

export function addCatalogEquipment(items: Equip[], catalogId: string): Equip[] {
  const gear = gearCatalog.find((entry) => entry.id === catalogId);
  if (!gear) return items;
  if (gear.contents?.length) return mergeDuplicateCatalogEquipment(expandPackageEquipment([
    ...items, { nome: gear.name, catalogId, dettaglio: "", quantita: "1" },
  ]));
  const index = items.findIndex((item) =>
    (item.catalogId === catalogId || (!item.catalogId && item.nome === gear.name)) &&
    !item.dettaglio && !item.unita && !item.contenitore
  );
  if (index < 0) return [...items, { nome: gear.name, catalogId, dettaglio: "", quantita: "1", ...(isMagicGearId(catalogId) ? { magico: true } : {}) }];
  return items.map((item, current) => current === index
    ? { ...item, nome: gear.name, catalogId, quantita: String((Number(item.quantita || "1") || 0) + 1) }
    : item);
}

export function expandPackageEquipment(items: Equip[]): Equip[] {
  return items.flatMap((item) => {
    const gear = gearById(item.catalogId ?? "") ?? gearByName(item.nome);
    if (!gear?.contents?.length) return [item];
    const packs = Number(item.quantita ?? "1");
    if (!Number.isSafeInteger(packs) || packs < 1) return [item];
    return gear.contents.map((content) => {
      const component = gearByName(content.name);
      if (!component) throw new Error(`Contenuto non presente nel catalogo: ${content.name}`);
      return {
        nome: component.name,
        catalogId: component.id,
        dettaglio: "",
        quantita: String((content.quantity ?? 1) * packs),
        ...(item.contenitore ? { contenitore: item.contenitore } : {}),
      };
    });
  });
}

export function mergeDuplicateCatalogEquipment(items: Equip[]): Equip[] {
  return items.reduce<Equip[]>((merged, item) => {
    const count = Number(item.quantita || "1");
    if (!gearCatalog.some((gear) => gear.id === item.catalogId) || item.dettaglio || item.unita || item.contenitore || item.indossato || item.impugnato || !Number.isInteger(count) || count < 0) {
      merged.push(item);
      return merged;
    }
    const index = merged.findIndex((other) => other.catalogId === item.catalogId && !other.dettaglio && !other.unita && !other.contenitore && !other.indossato && !other.impugnato && Number.isInteger(Number(other.quantita || "1")));
    if (index < 0) merged.push(item);
    else merged[index] = { ...merged[index], quantita: String(Number(merged[index].quantita || "1") + count) };
    return merged;
  }, []);
}

export function addOwnedArmor(items: Equip[], catalogId: string): Equip[] {
  const armor = armorById(catalogId);
  if (!armor) return items;
  const index = items.findIndex((item) =>
    (item.catalogId === catalogId || (!item.catalogId && item.nome === armor.name)) &&
    !item.magico && !item.dettaglio && !item.unita && !item.contenitore &&
    Number.isSafeInteger(Number(item.quantita ?? "1")) && Number(item.quantita ?? "1") >= 0 &&
    Number(item.quantita ?? "1") < Number.MAX_SAFE_INTEGER,
  );
  if (index < 0) return [...items, { nome: armor.name, catalogId, quantita: "1", dettaglio: "" }];
  return items.map((item, current) => current === index
    ? { ...item, catalogId, quantita: String(Number(item.quantita ?? "1") + 1) }
    : item);
}

export function removeOwnedArmor(items: Equip[], index: number): Equip[] {
  const item = items[index];
  if (!item || !isArmorEquipment(item)) return items;
  const quantity = Number(item.quantita ?? "1");
  if (!Number.isSafeInteger(quantity) || quantity < 1) return items;
  if (quantity === 1) {
    if (item.indossato || item.impugnato) return items;
    return items.filter((_, current) => current !== index);
  }
  return items.map((entry, current) => current === index ? { ...entry, quantita: String(quantity - 1) } : entry);
}

export function selectWornArmor(sheet: Sheet, catalogId: string | null, preferredIndex?: number): Equip[] {
  const armor = catalogId ? armorById(catalogId) : null;
  if (catalogId && (!armor || armor.category === "scudi")) return sheet.equipaggiamento;
  const index = !armor ? -1 : preferredIndex !== undefined && sheet.equipaggiamento[preferredIndex] &&
    armorForEquipment(sheet.equipaggiamento[preferredIndex])?.id === catalogId &&
    Number(sheet.equipaggiamento[preferredIndex].quantita ?? "1") > 0
    ? preferredIndex : sheet.equipaggiamento.findIndex((item) =>
      armorForEquipment(item)?.id === catalogId && Number(item.quantita ?? "1") > 0);
  if (armor && index < 0) return sheet.equipaggiamento;
  const items = sheet.equipaggiamento.map((item) => ({ ...item, indossato: false }));
  if (armor) items[index] = { ...items[index], catalogId: armor.id, indossato: true };
  return items;
}

export function selectHeldShield(sheet: Sheet, enabled: boolean, preferredIndex?: number): Pick<Sheet, "scudo" | "equipaggiamento"> {
  const index = !enabled ? -1 : preferredIndex !== undefined && sheet.equipaggiamento[preferredIndex] &&
    armorForEquipment(sheet.equipaggiamento[preferredIndex])?.category === "scudi" &&
    Number(sheet.equipaggiamento[preferredIndex].quantita ?? "1") > 0
    ? preferredIndex : sheet.equipaggiamento.findIndex((item) =>
      armorForEquipment(item)?.category === "scudi" && Number(item.quantita ?? "1") > 0);
  if (enabled && index < 0) return { scudo: sheet.scudo, equipaggiamento: sheet.equipaggiamento };
  if (enabled && sheet.armi.reduce((total, weapon, weaponIndex) => total + (weapon.impugnata ? weaponHandUsage(sheet, weaponIndex) : 0), 0) > 1) {
    return { scudo: sheet.scudo, equipaggiamento: sheet.equipaggiamento };
  }
  const items = sheet.equipaggiamento.map((item) => ({ ...item, impugnato: false }));
  if (enabled) items[index] = { ...items[index], catalogId: "scudo", impugnato: true };
  return { scudo: enabled, equipaggiamento: items };
}
