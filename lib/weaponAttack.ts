import { abilityModifier, proficiencyBonus } from "./abilityBonus";
import type { Arma, Sheet } from "./sheet";
import { weaponByName } from "./weaponDetails";
import { isWeaponProficient } from "./weaponProficiencyRules";

export type WeaponAttack = {
  attack: string;
  damage: string;
  dice: string;
  damageType: string;
  ability: "FOR" | "DES";
  modifier: string;
  proficient: boolean;
  proficiency: string;
  archery: number;
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
  const [baseDice, ...type] = entry.damage.split(" ");
  const dice = mode === "dueMani" ? entry.versatileDie! : baseDice;
  const damageType = type.join(" ");
  const damage = modifier ? `${dice} ${signed(Number(modifier))} ${damageType}` : "";
  const heavyAbility = entry.kind === "mischia" ? "FOR" : "DES";
  const heavyScore = Number(sheet.caratteristiche.find((item) => item.abbr === heavyAbility)?.valore);
  const warnings = entry.properties.toLowerCase().includes("pesante") && heavyScore > 0 && heavyScore < 13
    ? [`Arma pesante: svantaggio ai tiri per colpire con ${heavyAbility} inferiore a 13 (Manuale p. 214).`]
    : [];
  return {
    attack, damage, dice, damageType, ability, modifier, proficient, proficiency, archery, warnings,
    formula: attack ? `${ability} ${modifier}${proficient ? ` + competenza ${proficiency}` : ""}${archery ? " + Tiro +2" : ""} = ${attack}` : "Inserisci il punteggio di caratteristica e, se competente, il livello.",
  };
}

export function displayedWeaponAttack(sheet: Sheet, weapon: Arma): string {
  return weapon.bonus || weaponAttack(sheet, weapon)?.attack || "";
}

// Portata e gittata, Manuale del Giocatore 2024: portata di 1,5 m (p. 26),
// proprietà Portata +1,5 m (p. 214), Gittata normale/lunga e Lancio (p. 213).
export type WeaponRange = {
  label: "Portata" | "Gittata";
  value: string;
  reach?: number;
  normal?: number;
  long?: number;
  reachProperty: boolean;
  thrown?: string;
};

export const meters = (value: number) => `${String(value).replace(".", ",")} m`;
const rangeText = ([normal, long]: readonly [number, number]) => `${String(normal).replace(".", ",")}/${String(long).replace(".", ",")} m`;

export function weaponRange(weapon: Arma): WeaponRange | null {
  const entry = weaponByName(weapon.nome);
  if (!entry) return null;
  const reachProperty = /(?:^|,\s*)portata\b/i.test(entry.properties);
  if (entry.kind === "distanza" || weapon.modo === "lancio") {
    if (!entry.rangeMeters) return null;
    return { label: "Gittata", value: rangeText(entry.rangeMeters), normal: entry.rangeMeters[0], long: entry.rangeMeters[1], reachProperty };
  }
  const reach = reachProperty ? 3 : 1.5;
  return { label: "Portata", value: meters(reach), reach, reachProperty, ...(entry.thrown && entry.rangeMeters ? { thrown: rangeText(entry.rangeMeters) } : {}) };
}
