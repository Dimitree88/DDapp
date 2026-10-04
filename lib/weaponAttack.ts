import { abilityModifier, proficiencyBonus } from "./abilityBonus";
import type { Arma, Sheet } from "./sheet";
import { weaponByName } from "./weaponDetails";

export type WeaponAttack = {
  attack: string;
  damage: string;
  ability: "FOR" | "DES";
  modifier: string;
  proficient: boolean;
  proficiency: string;
  formula: string;
};

const signed = (value: number) => value > 0 ? `+${value}` : String(value);

export function weaponAttack(sheet: Sheet, weapon: Arma): WeaponAttack | null {
  const entry = weaponByName(weapon.nome);
  if (!entry) return null;
  const mode = weapon.modo ?? "base";
  if (mode === "lancio" && (!entry.thrown || entry.kind !== "mischia") || mode === "dueMani" && (!entry.versatileDie || entry.kind !== "mischia")) return null;
  const ability = entry.finesse ? weapon.caratteristica ?? (entry.kind === "distanza" ? "DES" : "FOR") : entry.kind === "distanza" ? "DES" : "FOR";
  const modifier = abilityModifier(sheet.caratteristiche.find((item) => item.abbr === ability)?.valore ?? "");
  const proficient = sheet.competenzeArmi.includes(weapon.nome) || sheet.competenzeArmi.includes(entry.category === "semplici" ? "Armi semplici" : "Armi da guerra");
  const proficiency = proficient ? proficiencyBonus(sheet.livello) : "";
  const magic = weapon.bonusMagico ?? 0;
  const attack = modifier && (!proficient || proficiency) ? signed(Number(modifier) + Number(proficiency || 0) + magic) : "";
  const [dice, ...type] = entry.damage.split(" ");
  const damage = modifier ? `${mode === "dueMani" ? entry.versatileDie : dice} ${signed(Number(modifier) + magic)} ${type.join(" ")}` : "";
  return {
    attack, damage, ability, modifier, proficient, proficiency,
    formula: attack ? `${ability} ${modifier}${proficient ? ` + competenza ${proficiency}` : ""}${magic ? ` + arma magica ${magic}` : ""} = ${attack}` : "Inserisci il punteggio di caratteristica e, se competente, il livello.",
  };
}

export function displayedWeaponAttack(sheet: Sheet, weapon: Arma): string {
  return weapon.bonus || weaponAttack(sheet, weapon)?.attack || "";
}
