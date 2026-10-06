import { abilityModifier, proficiencyBonus } from "./abilityBonus";
import type { Arma, Sheet } from "./sheet";
import { weaponByName } from "./weaponDetails";
import { isWeaponProficient } from "./weaponProficiencyRules";

export type WeaponAttack = {
  attack: string;
  damage: string;
  ability: "FOR" | "DES";
  modifier: string;
  proficient: boolean;
  proficiency: string;
  formula: string;
  warnings: string[];
};

const signed = (value: number) => value > 0 ? `+${value}` : String(value);

export function weaponAttack(sheet: Sheet, weapon: Arma): WeaponAttack | null {
  const entry = weaponByName(weapon.nome);
  if (!entry) return null;
  const mode = weapon.modo ?? "base";
  if (mode === "lancio" && (!entry.thrown || entry.kind !== "mischia") || mode === "dueMani" && (!entry.versatileDie || entry.kind !== "mischia")) return null;
  const ability = entry.finesse ? weapon.caratteristica ?? (entry.kind === "distanza" ? "DES" : "FOR") : entry.kind === "distanza" ? "DES" : "FOR";
  const modifier = abilityModifier(sheet.caratteristiche.find((item) => item.abbr === ability)?.valore ?? "");
  const proficient = isWeaponProficient(sheet, entry);
  const proficiency = proficient ? proficiencyBonus(sheet.livello) : "";
  const archery = entry.kind === "distanza" && sheet.talenti.some((feat) => feat.nome === "Tiro") ? 2 : 0;
  const attack = modifier && (!proficient || proficiency) ? signed(Number(modifier) + Number(proficiency || 0) + archery) : "";
  const [dice, ...type] = entry.damage.split(" ");
  const damage = modifier ? `${mode === "dueMani" ? entry.versatileDie : dice} ${signed(Number(modifier))} ${type.join(" ")}` : "";
  const heavyAbility = entry.kind === "mischia" ? "FOR" : "DES";
  const heavyScore = Number(sheet.caratteristiche.find((item) => item.abbr === heavyAbility)?.valore);
  const warnings = entry.properties.toLowerCase().includes("pesante") && heavyScore > 0 && heavyScore < 13
    ? [`Arma pesante: svantaggio ai tiri per colpire con ${heavyAbility} inferiore a 13 (Manuale p. 214).`]
    : [];
  return {
    attack, damage, ability, modifier, proficient, proficiency, warnings,
    formula: attack ? `${ability} ${modifier}${proficient ? ` + competenza ${proficiency}` : ""}${archery ? " + Tiro +2" : ""} = ${attack}` : "Inserisci il punteggio di caratteristica e, se competente, il livello.",
  };
}

export function displayedWeaponAttack(sheet: Sheet, weapon: Arma): string {
  return weapon.bonus || weaponAttack(sheet, weapon)?.attack || "";
}
