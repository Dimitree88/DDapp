import type { Arma, Equip, Sheet } from "./sheet";
import { armorForEquipment } from "./equipmentSelection";
import { gearById, gearByName } from "./gearCatalog";
import { weaponByName } from "./weaponDetails";
import { isWeaponProficient } from "./weaponProficiencyRules";

export type EquipmentWarning = { label: "SENZA COMPETENZA" | "NON UTILIZZABILE"; reason: string; page: number };

export function weaponWarning(sheet: Sheet, weapon: Arma): EquipmentWarning | null {
  const entry = weaponByName(weapon.nome);
  if (!entry || isWeaponProficient(sheet, entry)) return null;
  const category = entry.category === "semplici" ? "armi semplici" : "armi da guerra";
  return {
    label: "SENZA COMPETENZA",
    reason: `Per aggiungere il bonus di competenza al tiro per colpire serve competenza in ${weapon.nome} o nelle ${category}. Il personaggio può comunque impugnare e usare quest'arma, ma non aggiunge quel bonus.`,
    page: 213,
  };
}

export function equipmentWarning(sheet: Sheet, item: Equip): EquipmentWarning | null {
  const armor = armorForEquipment(item);
  if (armor && !sheet.competenzeArmatura[armor.category]) {
    const category = armor.category === "scudi" ? "negli scudi" : `nelle armature ${armor.category}`;
    return {
      label: "SENZA COMPETENZA",
      reason: armor.category === "scudi"
        ? `Serve competenza ${category} per ottenere il bonus di +2 alla Classe Armatura. Il personaggio può comunque impugnare lo scudo.`
        : `Serve competenza ${category} per indossare questa armatura senza penalità. Senza competenza, il personaggio ha svantaggio alle prove con d20 relative a Forza o Destrezza e non può lanciare incantesimi.`,
      page: 219,
    };
  }

  const gear = gearById(item.catalogId ?? "") ?? gearByName(item.nome);
  const focus = gear?.name.toLocaleLowerCase("it");
  const focusClasses = focus?.startsWith("focus arcano") ? ["Mago", "Stregone", "Warlock"]
    : focus?.startsWith("focus druidico") ? ["Druido", "Ranger"]
    : focus?.startsWith("simbolo sacro") ? ["Chierico", "Paladino"] : null;
  if (!focusClasses || focusClasses.includes(sheet.classe)) return null;
  return {
    label: "NON UTILIZZABILE",
    reason: `Non utilizzabile come focus da incantatore da questa classe. Per questo tipo di focus serve essere ${focusClasses.join(", ").replace(/, ([^,]*)$/, " o $1")}. L'oggetto resta trasportabile e utilizzabile per altri scopi consentiti.`,
    page: focus?.startsWith("simbolo sacro") ? 228 : 225,
  };
}
