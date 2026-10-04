import rules from "./regole-srd-2024.json";
import type { Sheet } from "./sheet";
import { numericValueValid, type NumericMode } from "./numeric";
import { spellNames } from "./spells";

const classes = rules.classi as Record<string, string[]>;
const lineages = rules.lignaggi as Record<string, string[]>;
const languages = [...rules.lingue.standard, ...rules.lingue.rare];
const weapons = [...rules.armi.semplici, ...rules.armi.daGuerra];
const feats = Object.values(rules.talenti).flat();

export function domainErrors(sheet: Sheet): string[] {
  const errors: string[] = [];
  const check = (label: string, value: string, choices: readonly string[]) => {
    if (value && !choices.includes(value)) errors.push(`${label}: ${value}`);
  };
  const checkNumber = (label: string, value: string, mode: NumericMode) => {
    if (typeof value !== "string" || !numericValueValid(value, mode)) errors.push(`${label}: ${value}`);
  };
  if (!rules.livelliPersonaggio.includes(sheet.livello)) errors.push(`Livello: ${sheet.livello}`);
  check("Classe", sheet.classe, Object.keys(classes));
  check("Sottoclasse", sheet.sottoclasse, classes[sheet.classe] ?? []);
  check("Specie", sheet.specie, rules.specie);
  check("Lignaggio", sheet.lignaggio, lineages[sheet.specie] ?? []);
  check("Background", sheet.background, rules.background);
  check("Allineamento", sheet.allineamento, rules.allineamenti);
  check("Taglia", sheet.taglia, rules.taglie);
  checkNumber("Punti ferita", sheet.puntiFerita, "unsigned");
  checkNumber("Punti ferita massimi", sheet.puntiFeritaMax, "unsigned");
  if (sheet.classeArmatura !== null && (!Number.isSafeInteger(sheet.classeArmatura) || sheet.classeArmatura < 0)) errors.push(`Classe armatura: ${sheet.classeArmatura}`);
  checkNumber("Iniziativa", sheet.iniziativa, "signed");
  checkNumber("Bonus competenza", sheet.bonusCompetenza, "signed");
  checkNumber("Percezione passiva", sheet.percezionePassiva, "unsigned");
  checkNumber("Dadi vita", sheet.dadiVita, "dice");
  checkNumber("Punti esperienza", sheet.puntiEsperienza, "unsigned");
  if (sheet.velocita && !/^\d+(?:\.\d+)?$/.test(sheet.velocita)) errors.push(`Velocità: ${sheet.velocita}`);
  sheet.caratteristiche.forEach((characteristic) => {
    checkNumber(`${characteristic.abbr} valore`, characteristic.valore, "unsigned");
    checkNumber(`${characteristic.abbr} modificatore`, characteristic.modificatore, "signed");
    checkNumber(`${characteristic.abbr} tiro salvezza`, characteristic.tsBonus, "signed");
  });
  sheet.abilita.forEach((ability) => {
    if (ability.maestria && !ability.competente) errors.push(`${ability.nome}: Maestria richiede competenza`);
  });
  sheet.lingue.forEach((value, index) => check(`Lingua ${index + 1}`, value, languages));
  sheet.competenzeArmi.forEach((value, index) => check(`Competenza armi ${index + 1}`, value, [...rules.competenzeArmi, ...weapons]));
  sheet.armi.forEach((weapon, index) => {
    check(`Arma ${index + 1}`, weapon.nome, weapons);
    checkNumber(`Arma ${index + 1} quantità`, weapon.quantita, "unsigned");
    checkNumber(`Arma ${index + 1} bonus`, weapon.bonus, "signed");
  });
  sheet.talenti.forEach((feat, index) => check(`Talento ${index + 1}`, feat.nome, feats));
  sheet.incantesimi.forEach((spell, index) => check(`Incantesimo ${index + 1}`, spell.nome, spellNames));
  Object.entries(sheet.monete).forEach(([coin, value]) => checkNumber(`Monete ${coin}`, value, "unsigned"));
  return errors;
}
