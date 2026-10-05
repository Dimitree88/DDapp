import manual from "./manuale-2024-entities.json";
import rules from "./regole-srd-2024.json";
import { armorCatalog } from "./armorCatalog";
import { gearCatalog } from "./gearCatalog";
import { weaponCatalog } from "./weaponDetails";
import { spellNames } from "./spells";
import classFeatures from "./class-feature-grants.json";
import subclassFeatures from "./subclass-feature-grants.json";
import { emptySheet } from "./sheet";

export type ArchiveGroup = {
  values: readonly string[];
  source: string;
  page?: string;
  coverage: "verified" | "existing-to-audit";
};

const manualSource = manual.source;
const existingSource = "Cataloghi esistenti SRD 5.2.1: confronto con il Manuale 2024 ancora da completare";
const manualGroup = (values: readonly string[], page: string): ArchiveGroup => ({ values, source: manualSource, page, coverage: "verified" });
const existingGroup = (values: readonly string[], page?: string): ArchiveGroup => ({ values, source: existingSource, page, coverage: "existing-to-audit" });
const unique = (values: string[]) => [...new Set(values)];
const sheet = emptySheet();
const magicGear = gearCatalog.filter((item) => item.id.includes("pergamena-") || item.id.includes("pozione-guarigione"));
const ordinaryGear = gearCatalog.filter((item) => !item.tool && !magicGear.includes(item));

// Archivio consultabile senza cambiare i domini o le schede salvate.
// I gruppi verificati contengono solo nomi confrontati con indice o descrizioni del Manuale.
export const entityArchive = {
  levels: existingGroup(rules.livelliPersonaggio),
  classes: manualGroup(Object.keys(manual.classes), "50-175"),
  subclasses: manualGroup(Object.values(manual.classes).flat(), "54-175"),
  backgrounds: manualGroup(manual.backgrounds, "178-185"),
  species: manualGroup(manual.species, "186-197"),
  conditions: manualGroup(manual.conditions, "29"),
  mounts: manualGroup(manual.mounts, "229"),
  vehicles: manualGroup(manual.vehicles, "229-230"),
  lifestyles: manualGroup(manual.lifestyles, "230"),
  services: manualGroup(manual.services, "231"),
  lineages: existingGroup(Object.values(rules.lignaggi).flat()),
  feats: manualGroup(Object.values(manual.feats).flat(), "200-211"),
  originFeats: manualGroup(manual.feats.origini, "200-202"),
  generalFeats: manualGroup(manual.feats.generali, "202-209"),
  fightingStyles: manualGroup(manual.feats.stileDiCombattimento, "209-210"),
  epicBoons: manualGroup(manual.feats.donoEpico, "210-211"),
  languages: existingGroup([...rules.lingue.standard, ...rules.lingue.rare]),
  alignments: existingGroup(rules.allineamenti),
  sizes: existingGroup(rules.taglie),
  abilities: existingGroup(sheet.caratteristiche.map((item) => item.nome)),
  skills: existingGroup(sheet.abilita.map((item) => item.nome)),
  weapons: existingGroup(weaponCatalog.map((item) => item.name), "213-219"),
  armor: existingGroup(armorCatalog.map((item) => item.name), "219-220"),
  tools: existingGroup(gearCatalog.filter((item) => item.tool).map((item) => item.name), "220-222"),
  equipment: existingGroup(ordinaryGear.map((item) => item.name), "222-230"),
  magicItems: existingGroup(magicGear.map((item) => item.name), "232-233"),
  spells: existingGroup(unique([...spellNames, ...manual.spellNamesToReconcile]), "239-343"),
  classFeatures: existingGroup(unique(Object.values(classFeatures).flat().map((item) => item.name))),
  subclassFeatures: existingGroup(unique(Object.values(subclassFeatures).flat().map((item) => item.name))),
  weaponMasteries: existingGroup(unique(weaponCatalog.map((item) => item.mastery))),
  coins: existingGroup(Object.keys(sheet.monete)),
} satisfies Record<string, ArchiveGroup>;

export const manualClassSubclasses = manual.classes;
export const manualFeatsByCategory = manual.feats;
