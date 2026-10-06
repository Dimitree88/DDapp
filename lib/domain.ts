import rules from "./manuale-2024-domains.json";
import type { Sheet } from "./sheet";
import { numericValueValid, type NumericMode } from "./numeric";
import { spellNames } from "./spells";
import { speciesSizes } from "./creationRules";
import { weaponByName, weaponNames } from "./weaponDetails";
import { isWeaponProficient, WEAPON_PROFICIENCIES } from "./weaponProficiencyRules";
import { armorById } from "./armorCatalog";
import { gearById } from "./gearCatalog";
import { gearCatalog } from "./gearCatalog";
import { availableClassSpells, spellSlots, spellcastingAbility } from "./spellcasting";
import { subclassLevel } from "./classProgression";
import { featByName } from "./featCatalog";
import { featPrerequisitesMet } from "./featPrerequisites";

const classes = rules.classi as Record<string, string[]>;
const lineages = rules.lignaggi as Record<string, string[]>;
const languages = [...rules.lingue.standard, ...rules.lingue.rare];
const weapons = weaponNames;
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
  if (sheet.sottoclasse && Number(sheet.livello) < subclassLevel) errors.push(`Sottoclasse disponibile dal livello ${subclassLevel}`);
  check("Specie", sheet.specie, rules.specie);
  check("Lignaggio", sheet.lignaggio, lineages[sheet.specie] ?? []);
  check("Background", sheet.background, rules.background);
  check("Allineamento", sheet.allineamento, rules.allineamenti);
  check("Taglia", sheet.taglia, rules.taglie);
  if (sheet.specie && sheet.taglia && !speciesSizes[sheet.specie]?.includes(sheet.taglia)) {
    errors.push(`Taglia ${sheet.taglia} non prevista per ${sheet.specie}`);
  }
  checkNumber("Punti ferita", sheet.puntiFerita, "unsigned");
  checkNumber("Punti ferita massimi", sheet.puntiFeritaMax, "unsigned");
  if (sheet.classeArmatura !== null && (!Number.isSafeInteger(sheet.classeArmatura) || sheet.classeArmatura < 0)) errors.push(`Classe armatura: ${sheet.classeArmatura}`);
  checkNumber("Dadi vita", sheet.dadiVita, "dice");
  checkNumber("Punti esperienza", sheet.puntiEsperienza, "unsigned");
  if (sheet.velocita && !/^\d+(?:\.\d+)?$/.test(sheet.velocita)) errors.push(`Velocità: ${sheet.velocita}`);
  sheet.caratteristiche.forEach((characteristic) => {
    checkNumber(`${characteristic.abbr} valore`, characteristic.valore, "unsigned");
    if (characteristic.valore && (Number(characteristic.valore) < 1 || Number(characteristic.valore) > 30)) {
      errors.push(`${characteristic.abbr} valore: ${characteristic.valore}`);
    }
  });
  sheet.abilita.forEach((ability) => {
    if (ability.maestria && !ability.competente) errors.push(`${ability.nome}: Maestria richiede competenza`);
  });
  sheet.lingue.forEach((value, index) => check(`Lingua ${index + 1}`, value, languages));
  sheet.competenzeArmi.forEach((value, index) => check(`Competenza armi ${index + 1}`, value, [...WEAPON_PROFICIENCIES, ...weapons]));
  const toolNames = gearCatalog.filter((item) => item.tool).map((item) => item.name);
  (sheet.competenzeStrumenti ?? []).forEach((value, index) => check(`Competenza strumenti ${index + 1}`, value, toolNames));
  if (new Set(sheet.competenzeStrumenti ?? []).size !== (sheet.competenzeStrumenti ?? []).length) errors.push("Competenze strumenti duplicate");
  (sheet.fontiCompetenze ?? []).forEach((record, index) => {
    const values: Record<string, string[]> = {
      abilita: sheet.abilita.filter((item) => item.competente).map((item) => item.nome),
      tiroSalvezza: sheet.caratteristiche.filter((item) => item.tsCompetente).map((item) => item.abbr),
      arma: sheet.competenzeArmi, armatura: Object.entries(sheet.competenzeArmatura).filter(([, trained]) => trained).map(([kind]) => kind),
      strumento: sheet.competenzeStrumenti ?? [], lingua: sheet.lingue,
    };
    if (!record.fonte.trim() || !values[record.tipo]?.includes(record.valore)) errors.push(`Fonte competenza ${index + 1}: competenza non registrata o fonte assente`);
  });
  if (new Set(sheet.padronanzeArmi ?? []).size !== (sheet.padronanzeArmi ?? []).length) errors.push("Padronanze armi duplicate");
  (sheet.padronanzeArmi ?? []).forEach((name, index) => {
    check(`Padronanza armi ${index + 1}`, name, weapons);
    const entry = weaponByName(name);
    if (entry && !isWeaponProficient(sheet, entry)) errors.push(`Padronanza ${name}: manca competenza`);
  });
  sheet.armi.forEach((weapon, index) => {
    check(`Arma ${index + 1}`, weapon.nome, weapons);
    checkNumber(`Arma ${index + 1} quantità`, weapon.quantita, "unsigned");
    checkNumber(`Arma ${index + 1} bonus`, weapon.bonus, "signed");
    const entry = weaponByName(weapon.nome);
    if (weapon.modo && weapon.modo !== "base" && !(weapon.modo === "lancio" && entry?.kind === "mischia" && entry.thrown) && !(weapon.modo === "dueMani" && entry?.kind === "mischia" && entry.versatileDie)) errors.push(`Arma ${index + 1} modo: ${weapon.modo}`);
    if (weapon.caratteristica && (weapon.caratteristica !== "FOR" && weapon.caratteristica !== "DES" || !entry?.finesse)) errors.push(`Arma ${index + 1} caratteristica: ${weapon.caratteristica}`);
  });
  sheet.talenti.forEach((feat, index) => {
    check(`Talento ${index + 1}`, feat.nome, feats);
    const entry = featByName(feat.nome);
    if (entry && Number(sheet.livello) < entry.minLevel) errors.push(`Talento ${feat.nome}: richiede almeno livello ${entry.minLevel}`);
    if (entry && !featPrerequisitesMet(sheet, feat.nome)) errors.push(`Talento ${feat.nome}: prerequisiti non soddisfatti`);
  });
  (sheet.risorse ?? []).forEach((resource, index) => {
    if (!resource.nome.trim() || !resource.fonte.trim() || !Number.isSafeInteger(resource.massimo) || resource.massimo < 0 || !Number.isSafeInteger(resource.spesi) || resource.spesi < 0 || resource.spesi > resource.massimo || typeof resource.ricarica !== "string") errors.push(`Risorsa ${index + 1}: dati non validi`);
  });
  sheet.incantesimi.forEach((spell, index) => {
    check(`Incantesimo ${index + 1}`, spell.nome, spellNames);
    if (spell.fonte && !["classe", "talento", "privilegio", "altro"].includes(spell.fonte)) errors.push(`Incantesimo ${index + 1} fonte: ${spell.fonte}`);
    if (spell.stato && !["conosciuto", "libro", "preparato", "semprePreparato", "concesso"].includes(spell.stato)) errors.push(`Incantesimo ${index + 1} stato: ${spell.stato}`);
    if (spell.caratteristica && !["INT", "SAG", "CAR"].includes(spell.caratteristica)) errors.push(`Incantesimo ${index + 1} caratteristica: ${spell.caratteristica}`);
    if (spell.fonte === "classe" && !availableClassSpells(sheet).includes(spell.nome)) errors.push(`Incantesimo ${index + 1} non disponibile per ${sheet.classe} al livello ${sheet.livello}: ${spell.nome}`);
    if (spell.fonte === "classe" && !spellcastingAbility[sheet.classe]) errors.push(`Incantesimo ${index + 1}: la classe non lancia incantesimi`);
  });
  const slotMax = new Map(spellSlots(sheet).map((slot) => [String(slot.level), slot.maximum]));
  for (const [level, spent] of Object.entries(sheet.slotSpesi ?? {})) {
    if (!Number.isInteger(spent) || spent < 0 || spent > (slotMax.get(level) ?? 0)) errors.push(`Slot di livello ${level} spesi: ${spent}`);
  }
  if (sheet.equipaggiamento.filter((item) => item.indossato).length > 1) errors.push("Puoi indossare una sola armatura");
  if (sheet.equipaggiamento.filter((item) => item.impugnato).length > 1) errors.push("Puoi impugnare un solo scudo");
  sheet.equipaggiamento.forEach((item, index) => {
    if (item.quantita !== undefined) checkNumber(`Oggetto ${index + 1} quantità`, item.quantita, "unsigned");
    if (item.catalogId && !armorById(item.catalogId) && !gearById(item.catalogId)) errors.push(`Oggetto ${index + 1} ID catalogo: ${item.catalogId}`);
    if (item.indossato && armorById(item.catalogId ?? "")?.category === "scudi") errors.push(`Oggetto ${index + 1}: uno scudo non si indossa come armatura`);
    if (item.impugnato && armorById(item.catalogId ?? "")?.category !== "scudi") errors.push(`Oggetto ${index + 1}: seleziona uno scudo di catalogo`);
    if (item.indossato && !armorById(item.catalogId ?? "")) errors.push(`Oggetto ${index + 1}: seleziona un'armatura di catalogo`);
  });
  Object.entries(sheet.monete).forEach(([coin, value]) => checkNumber(`Monete ${coin}`, value, "unsigned"));
  return errors;
}
