import type { Sheet } from "./sheet";
import { featByName } from "./featCatalog";

const abilityRequirements: Record<string, readonly string[]> = {
  Appostato: ["DES"], Atleta: ["FOR", "DES"], Attore: ["CAR"],
  Carica: ["FOR", "DES"], "Combattente a due armi": ["FOR", "DES"],
  "Condottiero ispiratore": ["SAG", "CAR"], "Duellante difensivo": ["DES"],
  "Esperto di balestre": ["DES"], "Incantatore rituale": ["INT", "SAG", "CAR"],
  Lottatore: ["FOR", "DES"], "Maestro d'armi possenti": ["FOR"],
  "Maestro delle armi su asta": ["FOR", "DES"], "Mente acuta": ["INT"],
  Osservatore: ["INT", "SAG"], Sentinella: ["FOR", "DES"],
  Rapidità: ["DES", "COS"],
  "Tiratore scelto": ["DES"],
};

const spellcastingRequired = new Set([
  "Adepto elementale", "Cecchino magico", "Incantatore da guerra",
]);

const armorRequirements: Record<string, keyof Sheet["competenzeArmatura"]> = {
  "Corazze medie": "leggere", "Corazze pesanti": "medie",
  "Maestro degli scudi": "scudi", "Maestro delle armature medie": "medie",
  "Maestro delle armature pesanti": "pesanti",
};

export function featPrerequisitesMet(sheet: Sheet, name: string): boolean {
  // Manuale del Giocatore 2024, pp. 209-210: gli stili richiedono il privilegio.
  if (featByName(name)?.category === "stileDiCombattimento"
    && !(sheet.classe === "Guerriero" && Number(sheet.livello) >= 1
      || ["Paladino", "Ranger"].includes(sheet.classe) && Number(sheet.livello) >= 2
      || sheet.sottoclasse === "Campione" && Number(sheet.livello) >= 7)) return false;
  const abilities = abilityRequirements[name];
  if (abilities && !sheet.caratteristiche.some((ability) =>
    abilities.includes(ability.abbr) && Number(ability.valore) >= 13)) return false;
  const hasSpellcasting = ["Bardo", "Chierico", "Druido", "Mago", "Paladino", "Ranger", "Stregone"].includes(sheet.classe)
    || ["Cavaliere Mistico", "Mistificatore Arcano"].includes(sheet.sottoclasse) && Number(sheet.livello) >= 3;
  const hasPactMagic = sheet.classe === "Warlock";
  // Manuale, pp. 202, 203, 205 e 211: il Dono richiede Incantesimi;
  // gli altri tre talenti accettano anche Magia del patto.
  if (spellcastingRequired.has(name) && !(hasSpellcasting || hasPactMagic)) return false;
  if (name === "Dono del richiamo degli incantesimi" && !hasSpellcasting) return false;
  const armor = armorRequirements[name];
  if (armor && !sheet.competenzeArmatura[armor]) return false;
  return true;
}
