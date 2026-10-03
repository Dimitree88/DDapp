import rules from "./regole-srd-2024.json";
import type { Sheet } from "./sheet";

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
  check("Classe", sheet.classe, Object.keys(classes));
  check("Sottoclasse", sheet.sottoclasse, classes[sheet.classe] ?? []);
  check("Specie", sheet.specie, rules.specie);
  check("Lignaggio", sheet.lignaggio, lineages[sheet.specie] ?? []);
  check("Background", sheet.background, rules.background);
  check("Allineamento", sheet.allineamento, rules.allineamenti);
  check("Taglia", sheet.taglia, rules.taglie);
  if (sheet.velocita && !/^\d+(?:\.\d+)?$/.test(sheet.velocita)) errors.push(`Velocità: ${sheet.velocita}`);
  sheet.lingue.forEach((value, index) => check(`Lingua ${index + 1}`, value, languages));
  sheet.competenzeArmi.forEach((value, index) => check(`Competenza armi ${index + 1}`, value, [...rules.competenzeArmi, ...weapons]));
  sheet.armi.forEach((weapon, index) => check(`Arma ${index + 1}`, weapon.nome, weapons));
  sheet.talenti.forEach((feat, index) => check(`Talento ${index + 1}`, feat.nome, feats));
  sheet.incantesimi.forEach((spell, index) => check(`Livello incantesimo ${index + 1}`, spell.livello, rules.livelliIncantesimo));
  return errors;
}
