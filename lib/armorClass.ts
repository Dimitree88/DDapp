import { abilityModifier } from "./abilityBonus";
import { armorById } from "./armorCatalog";
import type { Sheet } from "./sheet";

export type ArmorClassResult = { value: number; formula: string; warnings: string[] };

export function calculatedArmorClass(sheet: Sheet): ArmorClassResult | null {
  const worn = sheet.equipaggiamento.filter((item) => item.indossato);
  const heldShields = sheet.equipaggiamento.filter((item) => item.impugnato);
  if (worn.length > 1 || heldShields.length > 1) return null;
  const armor = worn[0] ? armorById(worn[0].catalogId ?? "") : null;
  const shield = heldShields[0] ? armorById(heldShields[0].catalogId ?? "") : null;
  if (worn.length && (!armor || armor.category === "scudi") || heldShields.length && shield?.category !== "scudi") return null;
  const dexterity = abilityModifier(sheet.caratteristiche.find((item) => item.abbr === "DES")?.valore ?? "");
  if (armor?.dexterity !== "none" && !dexterity) return null;
  if (!armor && !dexterity) return null;
  const dexBonus = armor?.dexterity === "none" ? 0 : armor?.dexterity === "max2" ? Math.min(Number(dexterity), 2) : Number(dexterity);
  const base = armor?.baseAc ?? 10;
  const armorMagic = armor ? worn[0].bonusMagico ?? 0 : 0;
  const shieldInUse = Boolean(shield || sheet.scudo);
  const shieldBonus = shieldInUse && sheet.competenzeArmatura.scudi ? 2 + (shield ? heldShields[0].bonusMagico ?? 0 : 0) : 0;
  const warnings: string[] = [];
  if (armor && !sheet.competenzeArmatura[armor.category]) warnings.push(`Manca la competenza: ${armor.name}; svantaggio alle prove di d20 che coinvolgono Forza o Destrezza e impossibilità di lanciare incantesimi.`);
  if (shieldInUse && !sheet.competenzeArmatura.scudi) warnings.push("Lo scudo non dà +2 CA senza competenza.");
  if (armor?.strength) {
    const strength = Number(sheet.caratteristiche.find((item) => item.abbr === "FOR")?.valore ?? 0);
    if (strength > 0 && strength < armor.strength) warnings.push("Velocità ridotta di 3 m per il requisito di Forza dell'armatura.");
  }
  if (armor?.stealthDisadvantage) warnings.push("Svantaggio alle prove di Destrezza (Furtività).");
  return { value: base + dexBonus + armorMagic + shieldBonus, formula: `${base}${armor?.dexterity === "none" ? "" : ` + DES ${dexBonus}`}${armorMagic ? ` + armatura magica ${armorMagic}` : ""}${shieldBonus ? ` + scudo ${shieldBonus}` : ""} = ${base + dexBonus + armorMagic + shieldBonus}`, warnings };
}

export function displayedArmorClass(sheet: Sheet): string {
  if (sheet.classeArmaturaOverride != null) return String(sheet.classeArmaturaOverride);
  const calculated = calculatedArmorClass(sheet);
  return calculated ? String(calculated.value) : sheet.classeArmatura == null ? "" : String(sheet.classeArmatura);
}
