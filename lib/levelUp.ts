import barbaro from "./manuale-2024/classi/barbaro.json";
import bardo from "./manuale-2024/classi/bardo.json";
import chierico from "./manuale-2024/classi/chierico.json";
import druido from "./manuale-2024/classi/druido.json";
import guerriero from "./manuale-2024/classi/guerriero.json";
import ladro from "./manuale-2024/classi/ladro.json";
import mago from "./manuale-2024/classi/mago.json";
import monaco from "./manuale-2024/classi/monaco.json";
import paladino from "./manuale-2024/classi/paladino.json";
import ranger from "./manuale-2024/classi/ranger.json";
import stregone from "./manuale-2024/classi/stregone.json";
import warlock from "./manuale-2024/classi/warlock.json";
import testiBarbaro from "./manuale-2024/testi/classi/barbaro.json";
import testiBardo from "./manuale-2024/testi/classi/bardo.json";
import testiChierico from "./manuale-2024/testi/classi/chierico.json";
import testiDruido from "./manuale-2024/testi/classi/druido.json";
import testiGuerriero from "./manuale-2024/testi/classi/guerriero.json";
import testiLadro from "./manuale-2024/testi/classi/ladro.json";
import testiMago from "./manuale-2024/testi/classi/mago.json";
import testiMonaco from "./manuale-2024/testi/classi/monaco.json";
import testiPaladino from "./manuale-2024/testi/classi/paladino.json";
import testiRanger from "./manuale-2024/testi/classi/ranger.json";
import testiStregone from "./manuale-2024/testi/classi/stregone.json";
import testiWarlock from "./manuale-2024/testi/classi/warlock.json";
import talentiOrigini from "./manuale-2024/talenti/origini.json";
import talentiGeneraliA from "./manuale-2024/talenti/generali-a.json";
import talentiGeneraliB from "./manuale-2024/talenti/generali-b.json";
import talentiStili from "./manuale-2024/talenti/stili.json";
import talentiDoni from "./manuale-2024/talenti/doni-epici.json";
import testiOrigini from "./manuale-2024/testi/talenti/origini.json";
import testiGeneraliA from "./manuale-2024/testi/talenti/generali-a.json";
import testiGeneraliB from "./manuale-2024/testi/talenti/generali-b.json";
import testiStili from "./manuale-2024/testi/talenti/stili.json";
import testiDoni from "./manuale-2024/testi/talenti/doni-epici.json";
import domains from "./manuale-2024-domains.json";
import { abilityModifier, proficiencyBonus } from "./abilityBonus";
import { abilityName } from "./abilityNames";
import { classHitDice, fixedHitPointGain } from "./classProgression";
import { featByName } from "./featCatalog";
import { featPrerequisitesMet } from "./featPrerequisites";
import { xpThresholds } from "./masterRules";
import { normalizeSheet, type Incantesimo, type Sheet } from "./sheet";
import { spellcastingAbility, spellSlots } from "./spellcasting";
import { spellDetails, spellNames } from "./spells";
import { availableWeaponMasteries, weaponMasteryLimit } from "./weaponChoices";
import { subclassSpellGrants } from "./subclassSpells";
import { bloccoIncantesimo, voceManuale } from "./manuale-2024";

// Motore del cambio di livello (Manuale del Giocatore 2024, pp. 41-42 e
// tabelle dei privilegi di classe del capitolo 3). Prepara le scelte del
// passaggio N → N+1 e applica la bozza confermata in un solo passaggio.

type Privilege = { id: string; nome: string; livello: number; pagina?: number };
type ClassEntry = { tipo: string; nome: string; pagina?: number; tabelle?: { titolo: string; colonne: string[]; righe: string[][] }[]; privilegi?: Privilege[] };
type ClassFile = { voci: ClassEntry[] };

const classFiles: Record<string, { data: ClassFile; texts: Record<string, string> }> = {
  Barbaro: { data: barbaro as ClassFile, texts: testiBarbaro.testi },
  Bardo: { data: bardo as ClassFile, texts: testiBardo.testi },
  Chierico: { data: chierico as ClassFile, texts: testiChierico.testi },
  Druido: { data: druido as ClassFile, texts: testiDruido.testi },
  Guerriero: { data: guerriero as ClassFile, texts: testiGuerriero.testi },
  Ladro: { data: ladro as ClassFile, texts: testiLadro.testi },
  Mago: { data: mago as ClassFile, texts: testiMago.testi },
  Monaco: { data: monaco as ClassFile, texts: testiMonaco.testi },
  Paladino: { data: paladino as ClassFile, texts: testiPaladino.testi },
  Ranger: { data: ranger as ClassFile, texts: testiRanger.testi },
  Stregone: { data: stregone as ClassFile, texts: testiStregone.testi },
  Warlock: { data: warlock as ClassFile, texts: testiWarlock.testi },
};

type FeatEntry = { nome: string; categoria?: string; prerequisito?: string; ripetibile?: boolean; pagina?: number; id: string };
const featEntries: FeatEntry[] = [talentiOrigini, talentiGeneraliA, talentiGeneraliB, talentiStili, talentiDoni]
  .flatMap((file) => (file as { voci: FeatEntry[] }).voci);
const featTexts: Record<string, string> = { ...testiOrigini.testi, ...testiGeneraliA.testi, ...testiGeneraliB.testi, ...testiStili.testi, ...testiDoni.testi };

const fold = (text: string) => text.toLocaleLowerCase("it").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'").replace(/\s+/g, " ").trim();

export const ABILITY_NAMES: Record<string, string> = { FOR: "Forza", DES: "Destrezza", COS: "Costituzione", INT: "Intelligenza", SAG: "Saggezza", CAR: "Carisma" };
const abbrOfName = (name: string) => Object.entries(ABILITY_NAMES).find(([, full]) => fold(full) === fold(name))?.[0];

// --- Tabelle di classe -------------------------------------------------

export function classEntry(classe: string) {
  return classFiles[classe]?.data.voci.find((voce) => voce.tipo === "classe") ?? null;
}

function classTable(classe: string) {
  return classEntry(classe)?.tabelle?.find((table) => /^Privilegi/.test(table.titolo)) ?? null;
}

function tableRow(classe: string, level: number): Record<string, string> | null {
  const table = classTable(classe);
  const row = table?.righe.find((item) => Number(item[0]) === level);
  if (!table || !row) return null;
  return Object.fromEntries(table.colonne.map((column, index) => [column, row[index] ?? ""]));
}

const cellNumber = (value: string | undefined) => {
  if (!value) return 0;
  const number = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(number) ? number : 0;
};

function featureNames(row: Record<string, string> | null): string[] {
  const text = row?.["Privilegi di classe"] ?? "";
  if (!text || text === "—") return [];
  // Dal 2° livello in poi i privilegi della riga sono separati da virgole.
  return text.split(/,\s*/).map((item) => item.trim()).filter((item) => item && item !== "—");
}

// --- Tipi esposti ------------------------------------------------------

export type LevelFeature = { id: string; name: string; level: number; page?: number; text: string; origin: "classe" | "sottoclasse"; detail?: string };
export type SubclassOption = { name: string; page?: number; summary: string; features: LevelFeature[] };
export type FeatOption = {
  name: string; category: string; page?: number; text: string; repeatable: boolean;
  increase: { kind: "asi" | "plus1" | "resiliente" | "none"; abilities: string[]; cap: number };
};
export type SpellOption = {
  name: string; level: number;
  school?: string; time?: string; range?: string; components?: string; duration?: string; concentration?: boolean; ritual?: boolean; page?: number;
};
export type LevelUpPlan = {
  characterId: string;
  characterName: string;
  classe: string;
  from: number;
  to: number;
  xp: number | null;
  xpNeeded: number;
  hitDie: number;
  fixedGain: number;
  conMod: number;
  hpMaxBefore: number | null;
  hpBonus: { source: string; value: number }[];
  proficiency: { before: string; after: string };
  subclass: { required: boolean; current: string; options: SubclassOption[] };
  classFeatures: LevelFeature[];
  subclassFeatures: Record<string, LevelFeature[]>;
  feat: null | { reason: "asi" | "epico" | "stile"; source: string; options: FeatOption[]; alternative: null | { name: string; list: string; ability: "SAG" | "CAR"; options: SpellOption[] } };
  expertise: null | { count: number; source: string; options: string[] };
  languages: null | { count: number; source: string; options: string[] };
  spells: null | {
    ability: string;
    lists: string[];
    maxLevel: number;
    cantrips: { current: number; target: number; needed: number; options: SpellOption[]; known: string[]; canReplace: boolean };
    prepared: { current: number; target: number; needed: number; options: SpellOption[]; known: string[]; canReplace: boolean; fromBook: boolean };
    book: null | { needed: number; options: SpellOption[] };
    arcanum: null | { level: number; options: SpellOption[] };
    alwaysPrepared: Record<string, string[]>;
  };
  mastery: null | { needed: number; options: string[]; current: string[] };
  subclassNotes: Record<string, string[]>;
  columns: { name: string; before: string; after: string }[];
  slots: { before: number[]; after: number[] };
  notes: string[];
};

export type LevelUpChoices = {
  hp: { method: "tiro" | "fisso"; roll?: number };
  subclass?: string;
  feat?: { name?: string; increases?: Record<string, number>; notes?: string; alternative?: boolean; cantrips?: string[] };
  expertise?: string[];
  languages?: string[];
  cantrips?: string[];
  prepared?: string[];
  book?: string[];
  replaceCantrip?: { from: string; to: string } | null;
  replacePrepared?: { from: string; to: string } | null;
  arcanum?: string;
  masteries?: string[];
  featureNotes?: Record<string, string>;
};

export type SummaryItem = { kind: "applicato" | "scelto" | "in gioco" | "da registrare"; text: string; page?: number };

// --- Funzioni di supporto ---------------------------------------------

function privilegeText(classe: string, id: string) {
  return classFiles[classe]?.texts[id] ?? "";
}

function featuresFor(classe: string, level: number, subclass: string | null): { classFeatures: LevelFeature[]; subclassFeatures: LevelFeature[]; rowNames: string[] } {
  const entry = classEntry(classe);
  const rowNames = featureNames(tableRow(classe, level));
  const classFeatures: LevelFeature[] = [];
  for (const raw of rowNames) {
    const name = raw.replace(/\s*\(.*\)$/, "").trim();
    const detail = /\((.*)\)$/.exec(raw)?.[1];
    if (/^privilegio della sottoclasse$/i.test(name)) continue;
    const privilege = (entry?.privilegi ?? []).find((item) => fold(item.nome) === fold(name));
    classFeatures.push({
      id: privilege?.id ?? `classe:${fold(classe)}:${level}:${fold(name)}`,
      name: privilege?.nome ?? name.charAt(0).toUpperCase() + name.slice(1),
      level, page: privilege?.pagina, origin: "classe", detail,
      text: privilege ? privilegeText(classe, privilege.id) : "",
    });
  }
  const subclassEntry = subclass ? classFiles[classe]?.data.voci.find((voce) => voce.tipo === "sottoclasse" && voce.nome === subclass) : null;
  const subclassFeatures = (subclassEntry?.privilegi ?? []).filter((item) => item.livello === level).map((item) => ({
    id: item.id, name: item.nome, level, page: item.pagina, origin: "sottoclasse" as const, text: privilegeText(classe, item.id),
  }));
  return { classFeatures, subclassFeatures, rowNames };
}

// Prima l'aumento dei punteggi, poi i talenti generali, poi gli altri.
const rank = (option: { name: string; category: string }) => fold(option.name) === fold("Aumento dei punteggi di caratteristica") ? 0 : /dono/i.test(option.category) ? 1 : /generale/i.test(option.category) ? 2 : 3;

function featIncrease(name: string): FeatOption["increase"] {
  if (fold(name) === fold("Aumento dei punteggi di caratteristica")) return { kind: "asi", abilities: Object.keys(ABILITY_NAMES), cap: 20 };
  const text = featTexts[featEntries.find((entry) => entry.nome === name)?.id ?? ""] ?? "";
  const line = /Incremento d[ei]+ punteggi[^.]*\.\s*([^\n]*)/i.exec(text)?.[1] ?? "";
  if (!line) return { kind: "none", abilities: [], cap: 20 };
  const cap = /massimo di 30/.test(line) ? 30 : 20;
  if (/competenza nel tiro salvezza/i.test(line)) return { kind: "resiliente", abilities: Object.keys(ABILITY_NAMES), cap };
  if (/caratteristica a scelta/i.test(line)) return { kind: "plus1", abilities: Object.keys(ABILITY_NAMES), cap };
  const names = /punteggio di ([^]+?) aumenta/i.exec(line)?.[1] ?? "";
  const abilities = names.split(/,\s*|\s+o\s+/).map((item) => abbrOfName(item.trim())).filter((item): item is string => Boolean(item));
  return { kind: abilities.length ? "plus1" : "none", abilities, cap };
}

function featOptions(sheet: Sheet, level: number, reason: "asi" | "epico" | "stile"): FeatOption[] {
  const probe = { ...sheet, livello: String(level) };
  return featEntries.filter((entry) => {
    const catalog = featByName(entry.nome);
    if (!catalog) return false;
    if (reason === "stile" && catalog.category !== "stileDiCombattimento") return false;
    if (reason !== "stile" && catalog.category === "stileDiCombattimento" && !featPrerequisitesMet(probe, entry.nome)) return false;
    if (level < catalog.minLevel) return false;
    if (!featPrerequisitesMet(probe, entry.nome)) return false;
    if (!entry.ripetibile && sheet.talenti.some((feat) => fold(feat.nome) === fold(entry.nome))) return false;
    return true;
  }).map((entry) => ({
    name: entry.nome, category: entry.categoria ?? "", page: entry.pagina, repeatable: Boolean(entry.ripetibile),
    text: featTexts[entry.id] ?? "", increase: featIncrease(entry.nome),
  })).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "it"));
}

function spellLevel(name: string) {
  const level = spellDetails(name)?.livello;
  return typeof level === "number" ? level : null;
}

type ManualSpell = { scuola?: string; tempoLancio?: string; gittata?: string; durata?: string; concentrazione?: boolean; rituale?: boolean; pagina?: number; componenti?: { verbale?: boolean; somatica?: boolean; materiale?: string } };

// Voce verificata dell'incantesimo nel manuale (capitolo 7) con il suo testo.
export function manualSpell(name: string) {
  const level = spellDetails(name)?.livello;
  const block = typeof level === "number" ? bloccoIncantesimo(level, name) : null;
  const found = block ? voceManuale(`incantesimi/${block}`, name) : null;
  return found ? { voce: found.voce as unknown as ManualSpell, text: found.descrizione ?? "" } : null;
}

function spellOption(name: string, level: number): SpellOption {
  const voce = manualSpell(name)?.voce;
  if (!voce) return { name, level };
  const parts = voce.componenti;
  const components = parts ? [parts.verbale && "V", parts.somatica && "S", parts.materiale && `M (${parts.materiale})`].filter(Boolean).join(", ") : undefined;
  return {
    name, level, school: voce.scuola, time: voce.tempoLancio, range: voce.gittata, components, duration: voce.durata,
    concentration: Boolean(voce.concentrazione), ritual: Boolean(voce.rituale), page: voce.pagina,
  };
}

function spellsFor(lists: string[], minLevel: number, maxLevel: number): SpellOption[] {
  return spellNames.flatMap((name) => {
    const detail = spellDetails(name);
    if (!detail || detail.livello < minLevel || detail.livello > maxLevel) return [];
    if (!detail.classi.some((item) => lists.includes(item))) return [];
    return [spellOption(name, detail.livello)];
  }).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "it"));
}

const isClassSpell = (spell: Incantesimo) => !spell.fonte || spell.fonte === "classe";
export function classCantrips(sheet: Sheet) {
  return sheet.incantesimi.filter((spell) => isClassSpell(spell) && spellLevel(spell.nome) === 0).map((spell) => spell.nome);
}
export function classPrepared(sheet: Sheet) {
  return sheet.incantesimi.filter((spell) => (spell.stato === "preparato" || (!spell.stato && isClassSpell(spell)))
    && spell.fonte !== "talento" && spell.fonte !== "altro" && (spellLevel(spell.nome) ?? 0) > 0).map((spell) => spell.nome);
}

const cantripReplaceClasses = new Set(["Bardo", "Chierico", "Druido", "Stregone", "Warlock"]);
const preparedReplaceClasses = new Set(["Bardo", "Warlock"]);

function hpBonusSources(sheet: Sheet, subclassAfter: string, to: number, featChosen?: string): { source: string; value: number }[] {
  const sources: { source: string; value: number }[] = [];
  // Robustezza nanica (p. 190): +1 a ogni livello acquisito.
  if (sheet.specie === "Nano") sources.push({ source: "Robustezza nanica", value: 1 });
  // Robusto (p. 202): +2 a ogni livello; all'acquisizione il doppio del livello.
  if (sheet.talenti.some((feat) => fold(feat.nome) === "robusto")) sources.push({ source: "Robusto", value: 2 });
  else if (featChosen && fold(featChosen) === "robusto") sources.push({ source: "Robusto (acquisito ora)", value: 2 * to });
  // Resilienza draconica (p. 159): +3 al 3° livello, poi +1 per livello da stregone.
  if (subclassAfter === "Stregoneria Draconica") {
    if (sheet.sottoclasse === "Stregoneria Draconica") sources.push({ source: "Resilienza draconica", value: 1 });
    else sources.push({ source: "Resilienza draconica (acquisita ora)", value: 3 });
  }
  return sources;
}

const resourceColumnsExcluded = new Set(["Livello", "Bonus di competenza", "Privilegi di classe", "Trucchetti", "Incantesimi preparati", "Slot incantesimo", "Livello slot", "Padronanza d'armi", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

// --- Piano -------------------------------------------------------------

export function planLevelUp(id: string, name: string, raw: Sheet): LevelUpPlan | { error: string } {
  const sheet = normalizeSheet(raw);
  const from = Number(sheet.livello);
  if (!Number.isInteger(from) || from < 1) return { error: "Livello non registrato." };
  if (from >= 20) return { error: "Il personaggio è già al 20° livello." };
  const classe = sheet.classe;
  if (!classFiles[classe]) return { error: "Classe non registrata: il cambio livello richiede una delle 12 classi del manuale." };
  const to = from + 1;
  const hitDie = classHitDice[classe];
  const conMod = Number(abilityModifier(sheet.caratteristiche.find((item) => item.abbr === "COS")?.valore ?? "") || 0);
  const beforeRow = tableRow(classe, from);
  const afterRow = tableRow(classe, to);
  const { classFeatures, rowNames } = featuresFor(classe, to, null);
  const notes: string[] = [];

  const subclassRequired = rowNames.some((item) => /^sottoclasse d/i.test(item)) && !sheet.sottoclasse;
  const subclassOptions: SubclassOption[] = subclassRequired ? (classFiles[classe].data.voci.filter((voce) => voce.tipo === "sottoclasse")).map((voce) => {
    const text = privilegeText(classe, (voce as unknown as { id: string }).id);
    return {
      name: voce.nome, page: voce.pagina,
      summary: text.split(/\n\n/).slice(0, 2).join("\n\n"),
      features: featuresFor(classe, to, voce.nome).subclassFeatures,
    };
  }) : [];
  const subclassFeatures: Record<string, LevelFeature[]> = {};
  if (sheet.sottoclasse) subclassFeatures[sheet.sottoclasse] = featuresFor(classe, to, sheet.sottoclasse).subclassFeatures;
  for (const option of subclassOptions) subclassFeatures[option.name] = option.features;

  // Talenti concessi dal livello.
  const names = rowNames.map(fold);
  const subclassNames = (sheet.sottoclasse ? subclassFeatures[sheet.sottoclasse] : []).map((item) => fold(item.name));
  let feat: LevelUpPlan["feat"] = null;
  if (names.some((item) => item.startsWith("aumento dei punteggi di caratteristica"))) feat = { reason: "asi", source: "Aumento dei punteggi di caratteristica", options: featOptions(sheet, to, "asi"), alternative: null };
  else if (names.includes("dono epico")) feat = { reason: "epico", source: "Dono epico", options: featOptions(sheet, to, "epico"), alternative: null };
  else if (names.includes("stile di combattimento") || subclassNames.includes(fold("Stile di Combattimento Aggiuntivo"))) {
    const alternative = names.includes("stile di combattimento") && (classe === "Paladino" || classe === "Ranger")
      ? classe === "Paladino"
        ? { name: "Guerriero Benedetto", list: "chierico", ability: "CAR" as const, options: spellsFor(["chierico"], 0, 0) }
        : { name: "Guerriero Druidico", list: "druido", ability: "SAG" as const, options: spellsFor(["druido"], 0, 0) }
      : null;
    feat = { reason: "stile", source: names.includes("stile di combattimento") ? "Stile di combattimento" : "Stile di Combattimento Aggiuntivo", options: featOptions(sheet, to, "stile"), alternative };
  }

  // Maestria e lingue.
  const proficientSkills = sheet.abilita.filter((item) => item.competente && !item.maestria).map((item) => item.nome);
  let expertise: LevelUpPlan["expertise"] = null;
  let languages: LevelUpPlan["languages"] = null;
  if (names.includes("maestria")) expertise = { count: 2, source: "Maestria", options: proficientSkills };
  if (names.includes("esploratore esperto")) {
    expertise = { count: 1, source: "Esploratore Esperto", options: proficientSkills };
    languages = { count: 2, source: "Esploratore Esperto", options: [...domains.lingue.standard, ...domains.lingue.rare].filter((item) => !sheet.lingue.includes(item)) };
  }
  if (names.includes("studioso")) {
    const allowed = ["ARCANO", "INDAGARE", "MEDICINA", "NATURA", "RELIGIONE", "STORIA"];
    expertise = { count: 1, source: "Studioso", options: proficientSkills.filter((item) => allowed.includes(item)) };
  }

  // Incantesimi.
  let spells: LevelUpPlan["spells"] = null;
  const ability = spellcastingAbility[classe];
  if (ability && afterRow) {
    const probe = { ...sheet, livello: String(to) };
    const slotsAfter = spellSlots(probe);
    const maxLevel = slotsAfter.reduce((max, slot) => slot.maximum ? slot.level : max, 0);
    const own = fold(classe);
    const secrets = classe === "Bardo" && to >= 10;
    const lists = secrets ? ["bardo", "chierico", "druido", "mago"] : [own];
    const knownCantrips = classCantrips(sheet);
    const knownPrepared = classPrepared(sheet);
    const owned = new Set(sheet.incantesimi.map((spell) => spell.nome));
    const cantripTarget = cellNumber(afterRow["Trucchetti"]);
    const preparedTarget = cellNumber(afterRow["Incantesimi preparati"]);
    const hasCantrips = "Trucchetti" in afterRow;
    const book = classe === "Mago" ? sheet.incantesimi.filter((spell) => spell.stato === "libro").map((spell) => spell.nome) : [];
    const arcanumLevel = classFeatures.find((item) => fold(item.name) === "arcanum mistico")?.detail?.match(/(\d)°/)?.[1];
    spells = {
      ability, lists, maxLevel,
      cantrips: {
        current: knownCantrips.length, target: cantripTarget, needed: hasCantrips ? Math.max(0, cantripTarget - knownCantrips.length) : 0,
        options: hasCantrips ? spellsFor([own], 0, 0).filter((item) => !owned.has(item.name)) : [], known: knownCantrips,
        canReplace: hasCantrips && cantripReplaceClasses.has(classe) && knownCantrips.length > 0,
      },
      prepared: {
        current: knownPrepared.length, target: preparedTarget, needed: Math.max(0, preparedTarget - knownPrepared.length),
        options: classe === "Mago" ? [] : spellsFor(lists, 1, maxLevel).filter((item) => !owned.has(item.name)),
        known: knownPrepared, canReplace: preparedReplaceClasses.has(classe) && knownPrepared.length > 0, fromBook: classe === "Mago",
      },
      book: classe === "Mago" ? { needed: 2, options: spellsFor(["mago"], 1, maxLevel).filter((item) => !owned.has(item.name)) } : null,
      arcanum: arcanumLevel ? { level: Number(arcanumLevel), options: spellsFor(["warlock"], Number(arcanumLevel), Number(arcanumLevel)).filter((item) => !owned.has(item.name)) } : null,
      alwaysPrepared: {},
    };
    if (classe === "Mago") spells.prepared.options = book.map((nome) => spellOption(nome, spellLevel(nome) ?? 1)).filter((item) => item.level <= maxLevel);
    const subclassChoices = subclassRequired ? subclassOptions.map((item) => item.name) : sheet.sottoclasse ? [sheet.sottoclasse] : [];
    for (const subclass of subclassChoices) {
      const granted = subclassSpellGrants(classe, subclass, to).filter((spell) => !owned.has(spell));
      if (granted.length) spells.alwaysPrepared[subclass] = granted;
    }
  }
  // Le tabelle degli incantesimi di queste sottoclassi non sono ancora nei dati verificati.
  const subclassNotes: Record<string, string[]> = {
    "Cavaliere Mistico": ["Cavaliere Mistico: trucchetti e incantesimi della sottoclasse (tabella a p. 94) non sono ancora gestiti dal cambio livello."],
    "Mistificatore Arcano": ["Mistificatore Arcano: trucchetti e incantesimi della sottoclasse (tabella a p. 108) non sono ancora gestiti dal cambio livello."],
    "Circolo della Terra": ["Circolo della Terra: gli incantesimi del terreno scelto (p. 88) non sono ancora aggiunti automaticamente."],
  };

  // Padronanze d'armi (Barbaro e Guerriero, colonna della tabella).
  let mastery: LevelUpPlan["mastery"] = null;
  const masteryAfter = weaponMasteryLimit({ ...sheet, livello: String(to) });
  const masteryNeeded = masteryAfter - (sheet.padronanzeArmi ?? []).length;
  if (masteryNeeded > 0 && masteryAfter > weaponMasteryLimit(sheet)) {
    mastery = { needed: masteryNeeded, current: sheet.padronanzeArmi ?? [], options: availableWeaponMasteries(sheet).filter((item) => !(sheet.padronanzeArmi ?? []).includes(item)) };
  }

  const columns = Object.keys(afterRow ?? {}).filter((column) => !resourceColumnsExcluded.has(column))
    .map((column) => ({ name: column, before: beforeRow?.[column] ?? "", after: afterRow?.[column] ?? "" }))
    .filter((column) => column.before !== column.after);
  if (classe === "Warlock" && columns.some((column) => column.name === "Suppliche occulte")) {
    notes.push("Suppliche occulte: annota le nuove suppliche nel privilegio «Suppliche Occulte» (opzioni da p. 166).");
  }

  const xp = /^\d+$/.test(sheet.puntiEsperienza) ? Number(sheet.puntiEsperienza) : null;
  return {
    characterId: id, characterName: name, classe, from, to, xp, xpNeeded: xpThresholds[to - 1],
    hitDie, fixedGain: fixedHitPointGain(hitDie), conMod,
    hpMaxBefore: /^\d+$/.test(sheet.puntiFeritaMax) ? Number(sheet.puntiFeritaMax) : null,
    hpBonus: hpBonusSources(sheet, sheet.sottoclasse, to),
    proficiency: { before: proficiencyBonus(String(from)), after: proficiencyBonus(String(to)) },
    subclass: { required: subclassRequired, current: sheet.sottoclasse, options: subclassOptions },
    classFeatures, subclassFeatures, feat, expertise, languages, spells, mastery, columns, subclassNotes,
    slots: { before: spellSlots(sheet).map((slot) => slot.maximum), after: spellSlots({ ...sheet, livello: String(to) }).map((slot) => slot.maximum) },
    notes,
  };
}



// --- Validazione e applicazione ---------------------------------------

const unique = (items: string[]) => new Set(items).size === items.length;

export function levelUpErrors(sheet: Sheet, plan: LevelUpPlan, choices: LevelUpChoices): string[] {
  const errors: string[] = [];
  if (choices.hp?.method === "tiro") {
    const roll = Number(choices.hp.roll);
    if (!Number.isInteger(roll) || roll < 1 || roll > plan.hitDie) errors.push(`Tiro del Dado Vita: inserisci un risultato da 1 a ${plan.hitDie}.`);
  } else if (choices.hp?.method !== "fisso") errors.push("Scegli se tirare il Dado Vita o usare il valore fisso.");
  const subclass = plan.subclass.required ? choices.subclass : sheet.sottoclasse;
  if (plan.subclass.required && !plan.subclass.options.some((item) => item.name === choices.subclass)) errors.push("Scegli la sottoclasse.");
  if (plan.feat) {
    const alternative = Boolean(choices.feat?.alternative && plan.feat.alternative);
    if (alternative) {
      const cantrips = choices.feat?.cantrips ?? [];
      if (cantrips.length !== 2 || !unique(cantrips) || cantrips.some((name) => !plan.feat!.alternative!.options.some((item) => item.name === name))) errors.push(`${plan.feat.alternative!.name}: scegli due trucchetti.`);
    } else {
      const option = plan.feat.options.find((item) => item.name === choices.feat?.name);
      if (!option) errors.push("Scegli il talento.");
      else {
        const increases = Object.entries(choices.feat?.increases ?? {}).filter(([, value]) => value > 0);
        const total = increases.reduce((sum, [, value]) => sum + value, 0);
        const score = (abbr: string) => Number(sheet.caratteristiche.find((item) => item.abbr === abbr)?.valore ?? 0);
        if (option.increase.kind === "asi" && !(total === 2 && increases.every(([, value]) => value === 1 || value === 2) && (increases.length === 1 ? increases[0][1] === 2 : increases.length === 2))) {
          errors.push("Aumento dei punteggi: +2 a una caratteristica oppure +1 a due caratteristiche.");
        }
        if ((option.increase.kind === "plus1" || option.increase.kind === "resiliente") && !(increases.length === 1 && total === 1)) errors.push(`${option.name}: scegli la caratteristica da aumentare di 1.`);
        for (const [abbr, value] of increases) {
          if (!option.increase.abilities.includes(abbr)) errors.push(`${option.name}: ${ABILITY_NAMES[abbr] ?? abbr} non è tra le opzioni.`);
          if (score(abbr) + value > option.increase.cap) errors.push(`${ABILITY_NAMES[abbr] ?? abbr} non può superare ${option.increase.cap}.`);
        }
        if (option.increase.kind === "resiliente" && increases.some(([abbr]) => sheet.caratteristiche.find((item) => item.abbr === abbr)?.tsCompetente)) {
          errors.push("Resiliente: scegli una caratteristica senza competenza nel tiro salvezza.");
        }
      }
    }
  }
  if (plan.expertise) {
    const picked = choices.expertise ?? [];
    if (picked.length !== Math.min(plan.expertise.count, plan.expertise.options.length) || !unique(picked) || picked.some((item) => !plan.expertise!.options.includes(item))) {
      errors.push(`${plan.expertise.source}: scegli ${plan.expertise.count === 1 ? "un'abilità" : `${plan.expertise.count} abilità`} per la maestria.`);
    }
  }
  if (plan.languages) {
    const picked = choices.languages ?? [];
    if (picked.length !== plan.languages.count || !unique(picked) || picked.some((item) => !plan.languages!.options.includes(item))) errors.push(`${plan.languages.source}: scegli ${plan.languages.count} lingue.`);
  }
  if (plan.spells) {
    const s = plan.spells;
    const check = (picked: string[] | undefined, needed: number, options: SpellOption[], label: string) => {
      const list = picked ?? [];
      const max = Math.min(needed, options.length);
      if (list.length !== max || !unique(list) || list.some((name) => !options.some((item) => item.name === name))) errors.push(`${label}: scegli ${max}.`);
    };
    check(choices.cantrips, s.cantrips.needed, s.cantrips.options, "Nuovi trucchetti");
    if (s.book) check(choices.book, s.book.needed, s.book.options, "Incantesimi da aggiungere al libro");
    const preparedOptions = s.prepared.fromBook ? [...s.prepared.options, ...(choices.book ?? []).map((name) => ({ name, level: spellLevel(name) ?? 1 }))] : s.prepared.options;
    check(choices.prepared, s.prepared.needed, preparedOptions, "Nuovi incantesimi preparati");
    if (s.arcanum) check(choices.arcanum ? [choices.arcanum] : [], 1, s.arcanum.options, `Arcanum mistico di ${s.arcanum.level}° livello`);
    const taken = new Set([...(choices.cantrips ?? []), ...(choices.prepared ?? []), ...(choices.book ?? [])]);
    if (choices.replaceCantrip) {
      if (!s.cantrips.canReplace || !s.cantrips.known.includes(choices.replaceCantrip.from) || !s.cantrips.options.some((item) => item.name === choices.replaceCantrip!.to) || taken.has(choices.replaceCantrip.to)) errors.push("Sostituzione del trucchetto non valida.");
    }
    if (choices.replacePrepared) {
      if (!s.prepared.canReplace || !s.prepared.known.includes(choices.replacePrepared.from) || !s.prepared.options.some((item) => item.name === choices.replacePrepared!.to) || taken.has(choices.replacePrepared.to)) errors.push("Sostituzione dell'incantesimo non valida.");
    }
  }
  if (plan.mastery) {
    const picked = choices.masteries ?? [];
    const max = Math.min(plan.mastery.needed, plan.mastery.options.length);
    if (picked.length !== max || !unique(picked) || picked.some((item) => !plan.mastery!.options.includes(item))) errors.push(`Padronanza d'armi: scegli ${max} arm${max === 1 ? "a" : "i"}.`);
  }
  if (subclass === undefined) errors.push("Sottoclasse mancante.");
  return errors;
}

export function applyLevelUp(raw: Sheet, plan: LevelUpPlan, choices: LevelUpChoices): { sheet: Sheet; summary: SummaryItem[] } {
  const sheet = normalizeSheet(raw);
  const next: Sheet = structuredClone(sheet);
  const summary: SummaryItem[] = [];
  const to = plan.to;
  next.livello = String(to);
  summary.push({ kind: "applicato", text: `Livello ${plan.from} → ${to}`, page: 41 });
  if (plan.proficiency.before !== plan.proficiency.after) summary.push({ kind: "applicato", text: `Bonus di competenza ${plan.proficiency.before} → ${plan.proficiency.after}`, page: 42 });

  // Sottoclasse.
  const subclass = plan.subclass.required ? choices.subclass! : sheet.sottoclasse;
  if (plan.subclass.required) {
    next.sottoclasse = subclass;
    const option = plan.subclass.options.find((item) => item.name === subclass);
    summary.push({ kind: "scelto", text: `Sottoclasse: ${subclass}`, page: option?.page });
  }

  // Talento e caratteristiche.
  const conBefore = Number(abilityModifier(sheet.caratteristiche.find((item) => item.abbr === "COS")?.valore ?? "") || 0);
  let featName: string | undefined;
  if (plan.feat) {
    if (choices.feat?.alternative && plan.feat.alternative) {
      const alt = plan.feat.alternative;
      const cantrips = choices.feat.cantrips ?? [];
      next.privilegi = upsertPrivilege(next.privilegi, plan.feat.source, `${alt.name}: ${cantrips.join(", ")}`);
      next.incantesimi = [...next.incantesimi, ...cantrips.map((nome) => ({ nome, fonte: "privilegio" as const, stato: "conosciuto" as const, caratteristica: alt.ability }))];
      summary.push({ kind: "scelto", text: `${plan.feat.source}: ${alt.name} (trucchetti ${cantrips.join(", ")}, caratteristica ${abilityName(alt.ability)})` });
    } else {
      const option = plan.feat.options.find((item) => item.name === choices.feat?.name)!;
      featName = option.name;
      const increases = Object.entries(choices.feat?.increases ?? {}).filter(([, value]) => value > 0);
      const increaseText = increases.map(([abbr, value]) => `${abilityName(abbr)} +${value}`).join(", ");
      const notes = choices.feat?.notes?.trim() ?? "";
      next.talenti = [...next.talenti, { nome: option.name, scelte: [increaseText, notes].filter(Boolean).join("; ") }];
      next.caratteristiche = next.caratteristiche.map((item) => {
        const value = Number(choices.feat?.increases?.[item.abbr] ?? 0);
        if (!value) return item;
        const before = Number(item.valore);
        summary.push({ kind: "scelto", text: `${ABILITY_NAMES[item.abbr]} ${before} → ${before + value}`, page: option.page });
        return { ...item, valore: String(before + value), ...(option.increase.kind === "resiliente" ? { tsCompetente: true } : {}) };
      });
      if (option.increase.kind === "resiliente") {
        const abbr = increases[0][0];
        next.fontiCompetenze = [...(next.fontiCompetenze ?? []), { tipo: "tiroSalvezza", valore: abbr, fonte: `Talento: ${option.name}` }];
        summary.push({ kind: "applicato", text: `Competenza nei tiri salvezza su ${ABILITY_NAMES[abbr]}`, page: option.page });
      }
      summary.push({ kind: "scelto", text: `Talento: ${option.name}${notes ? ` (${notes})` : ""}`, page: option.page });
      if (option.increase.kind === "none" || notes || option.increase.kind !== "asi") {
        summary.push({ kind: "da registrare", text: `${option.name}: gli altri benefici del talento non sono calcolati dall'app`, page: option.page });
      }
    }
  }

  // Punti ferita e Dadi Vita (p. 42).
  const conAfter = Number(abilityModifier(next.caratteristiche.find((item) => item.abbr === "COS")?.valore ?? "") || 0);
  const base = choices.hp.method === "tiro" ? Number(choices.hp.roll) : plan.fixedGain;
  const gain = Math.max(1, base + conBefore);
  const bonuses = hpBonusSources(sheet, subclass, to, featName);
  const conRetro = (conAfter - conBefore) * to;
  const totalGain = gain + bonuses.reduce((sum, item) => sum + item.value, 0) + conRetro;
  const hpBefore = Number(sheet.puntiFeritaMax);
  if (Number.isFinite(hpBefore) && sheet.puntiFeritaMax !== "") {
    next.puntiFeritaMax = String(hpBefore + totalGain);
    summary.push({ kind: "applicato", text: `PF massimi ${hpBefore} → ${hpBefore + totalGain} (${choices.hp.method === "tiro" ? `d${plan.hitDie}: ${base}` : `valore fisso ${base}`} ${conBefore >= 0 ? "+" : "−"} ${Math.abs(conBefore)} ${abilityName("COS")}${bonuses.map((item) => ` + ${item.value} ${item.source}`).join("")}${conRetro ? ` + ${conRetro} per l'aumento della Costituzione` : ""})`, page: 42 });
  } else summary.push({ kind: "da registrare", text: "PF massimi non registrati: l'aumento non è stato applicato." });
  summary.push({ kind: "applicato", text: "PF attuali invariati: il cambio di livello non è una guarigione", page: 27 });
  const dice = /^\s*(\d+)\s*d(\d+)\s*$/i.exec(sheet.dadiVita);
  next.dadiVita = dice ? `${Number(dice[1]) + 1}d${dice[2]}` : `${to}d${plan.hitDie}`;
  summary.push({ kind: "applicato", text: `Dadi Vita ${sheet.dadiVita || "—"} → ${next.dadiVita}`, page: 42 });
  const history = sheet.storiaPuntiFerita;
  if (history && history.incrementi.length === plan.from - 1) {
    next.storiaPuntiFerita = { ...history, incrementi: [...history.incrementi, { value: base, method: choices.hp.method }] };
  }

  // Maestria e lingue.
  if (plan.expertise && choices.expertise?.length) {
    next.abilita = next.abilita.map((item) => choices.expertise!.includes(item.nome) ? { ...item, maestria: true } : item);
    const label = choices.expertise.map((item) => item.charAt(0) + item.slice(1).toLocaleLowerCase("it")).join(", ");
    next.privilegi = upsertPrivilege(next.privilegi, plan.expertise.source, `Maestria: ${label}`, true);
    summary.push({ kind: "scelto", text: `Maestria: ${label}` });
  }
  if (plan.languages && choices.languages?.length) {
    next.lingue = [...next.lingue, ...choices.languages];
    next.fontiCompetenze = [...(next.fontiCompetenze ?? []), ...choices.languages.map((valore) => ({ tipo: "lingua" as const, valore, fonte: `Privilegio: ${plan.languages!.source}` }))];
    summary.push({ kind: "scelto", text: `Lingue: ${choices.languages.join(", ")}` });
  }

  // Incantesimi.
  if (plan.spells) {
    const s = plan.spells;
    const ability = s.ability as Incantesimo["caratteristica"];
    let spells = [...next.incantesimi];
    const add = (nome: string, stato: Incantesimo["stato"], fonte: Incantesimo["fonte"] = "classe") => { spells.push({ nome, fonte, stato, caratteristica: ability }); };
    const ownList = fold(plan.classe);
    for (const nome of choices.cantrips ?? []) add(nome, "conosciuto");
    for (const nome of choices.book ?? []) add(nome, "libro");
    const newlyPrepared: string[] = [];
    for (const nome of choices.prepared ?? []) {
      const existing = spells.findIndex((spell) => spell.nome === nome && spell.stato === "libro");
      if (existing >= 0) spells[existing] = { ...spells[existing], stato: "preparato" };
      else add(nome, "preparato", spellDetails(nome)?.classi.includes(ownList) ? "classe" : "privilegio");
      newlyPrepared.push(nome);
    }
    if (choices.replaceCantrip) {
      spells = spells.filter((spell) => !(spell.nome === choices.replaceCantrip!.from && isClassSpell(spell)));
      add(choices.replaceCantrip.to, "conosciuto");
      summary.push({ kind: "scelto", text: `Trucchetto sostituito: ${choices.replaceCantrip.from} → ${choices.replaceCantrip.to}` });
    }
    if (choices.replacePrepared) {
      spells = spells.filter((spell) => spell.nome !== choices.replacePrepared!.from);
      add(choices.replacePrepared.to, "preparato", spellDetails(choices.replacePrepared.to)?.classi.includes(ownList) ? "classe" : "privilegio");
      newlyPrepared.push(choices.replacePrepared.to);
      summary.push({ kind: "scelto", text: `Incantesimo sostituito: ${choices.replacePrepared.from} → ${choices.replacePrepared.to}` });
    }
    if (choices.arcanum) {
      spells.push({ nome: choices.arcanum, fonte: "privilegio", stato: "conosciuto", caratteristica: ability });
      summary.push({ kind: "scelto", text: `Arcanum mistico: ${choices.arcanum}` });
    }
    for (const nome of s.alwaysPrepared[subclass] ?? []) spells.push({ nome, fonte: "privilegio", stato: "semprePreparato", caratteristica: ability });
    if (s.alwaysPrepared[subclass]?.length) summary.push({ kind: "applicato", text: `Sempre preparati (${subclass}): ${s.alwaysPrepared[subclass].join(", ")}` });
    next.incantesimi = spells;
    if (choices.cantrips?.length) summary.push({ kind: "scelto", text: `Nuovi trucchetti: ${choices.cantrips.join(", ")}` });
    if (choices.book?.length) summary.push({ kind: "scelto", text: `Aggiunti al libro: ${choices.book.join(", ")}`, page: 112 });
    if (choices.prepared?.length) summary.push({ kind: "scelto", text: `Nuovi incantesimi preparati: ${choices.prepared.join(", ")}` });
    if (newlyPrepared.length) next.storiaIncantesimiPreparati = [...(next.storiaIncantesimiPreparati ?? []), { livello: to, nomi: newlyPrepared }];
    const beforeSlots = plan.slots.before.join("/");
    const afterSlots = plan.slots.after.join("/");
    if (beforeSlots !== afterSlots) summary.push({ kind: "applicato", text: `Slot incantesimo per livello ${beforeSlots || "—"} → ${afterSlots}; quelli già spesi restano spesi` });
  }

  // Padronanze d'armi.
  if (plan.mastery && choices.masteries?.length) {
    next.padronanzeArmi = [...(next.padronanzeArmi ?? []), ...choices.masteries];
    summary.push({ kind: "scelto", text: `Padronanza d'armi: ${choices.masteries.join(", ")}` });
  }

  // Colonne della tabella (risorse e dadi): aggiorna le risorse con lo stesso nome.
  for (const column of plan.columns) {
    const target = fold(column.name);
    const value = cellNumber(column.after);
    const index = (next.risorse ?? []).findIndex((resource) => fold(resource.nome) === target || fold(resource.nome).startsWith(target) || target.startsWith(fold(resource.nome)));
    if (index >= 0 && /^\d+$/.test(column.after.trim()) && value > 0) {
      const resource = next.risorse![index];
      next.risorse = next.risorse!.map((item, i) => i === index ? { ...item, massimo: value, spesi: Math.min(item.spesi, value) } : item);
      summary.push({ kind: "applicato", text: `${resource.nome}: massimo ${resource.massimo} → ${value}` });
    } else summary.push({ kind: "applicato", text: `${column.name}: ${column.before || "—"} → ${column.after}` });
  }

  // Privilegi del nuovo livello.
  const features = [...plan.classFeatures, ...(plan.subclassFeatures[subclass] ?? [])];
  for (const feature of features) {
    const note = choices.featureNotes?.[feature.name]?.trim();
    if (note) next.privilegi = upsertPrivilege(next.privilegi, feature.name, note);
    if (/^sottoclasse d/i.test(feature.name) || /^aumento dei punteggi/i.test(feature.name) || /^dono epico$/i.test(feature.name)) continue;
    summary.push({ kind: "in gioco", text: `${feature.name}${feature.detail ? ` (${feature.detail})` : ""}${note ? `: ${note}` : ""}`, page: feature.page });
  }
  const subclassPending = (plan.subclass.required || (plan.subclassFeatures[subclass] ?? []).length > 0) ? plan.subclassNotes[subclass] ?? [] : [];
  for (const note of [...plan.notes, ...subclassPending]) summary.push({ kind: "da registrare", text: note });

  next.eventiStoria = [...(next.eventiStoria ?? []), {
    capitolo: `Livello ${to}`, titolo: `Passaggio al livello ${to}`,
    dettagli: summary.map((item) => item.text), data: new Date().toISOString(),
  }];
  return { sheet: normalizeSheet(next), summary };
}

function upsertPrivilege(list: Sheet["privilegi"], titolo: string, scelte: string, append = false): Sheet["privilegi"] {
  const index = list.findIndex((item) => fold(item.titolo) === fold(titolo));
  if (index < 0) return [...list, { titolo, scelte }];
  return list.map((item, i) => i === index ? { ...item, scelte: append && item.scelte ? `${item.scelte}\n${scelte}` : scelte } : item);
}
