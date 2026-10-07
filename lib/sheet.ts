import { canonicalSpellName } from "./spells";
import { calculatedMaxHp } from "./classProgression";
import { calculatedArmorClass } from "./armorClass";
import { calculatedSpeed } from "./speed";
import { grantClassLanguages, grantClassProficiencies } from "./classSavingThrows";
import { grantBackgroundSkills, grantBackgroundToolProficiency } from "./backgroundToolProficiencies";
import { grantFeatToolProficiencies } from "./featToolProficiencies";
import { gearByName } from "./gearCatalog";
import { expandPackageEquipment, mergeDuplicateCatalogEquipment } from "./equipmentSelection";

// Modello dati della scheda. I bonus delle abilità sono derivati.

export type Caratteristica = {
  nome: string; // es. "FORZA"
  abbr: string; // es. "FOR"
  valore: string; // es. "9"
  tsCompetente: boolean;
};

export type Abilita = {
  nome: string; // es. "ATLETICA"
  caratteristica: string; // abbr es. "FOR"
  competente: boolean;
  maestria: boolean;
};

export type Arma = {
  nome: string;
  quantita: string;
  bonus: string; // valore manuale prevalente per il tiro per colpire
  modo?: "base" | "lancio" | "dueMani";
  caratteristica?: "FOR" | "DES";
  note: string;
};

export type Equip = {
  nome: string;
  dettaglio: string;
  catalogId?: string;
  quantita?: string;
  unita?: string;
  contenitore?: string;
  indossato?: boolean;
  impugnato?: boolean;
  magico?: boolean;
};

export type Privilegio = {
  titolo: string;
  scelte: string;
};

export type Risorsa = { nome: string; fonte: string; massimo: number; spesi: number; ricarica: string };
export type FonteCompetenza = { tipo: "abilita" | "tiroSalvezza" | "arma" | "armatura" | "strumento" | "lingua"; valore: string; fonte: string };

export type Talento = {
  nome: string;
  scelte: string;
};

export type Incantesimo = {
  nome: string;
  fonte?: "classe" | "talento" | "privilegio" | "altro";
  stato?: "conosciuto" | "libro" | "preparato" | "semprePreparato" | "concesso";
  caratteristica?: "INT" | "SAG" | "CAR";
};

export type Sheet = {
  creazioneCompletata: boolean;
  // Pagina: Stato
  livello: string;
  classe: string;
  sottoclasse: string;
  puntiFerita: string;
  puntiFeritaMax: string;
  storiaPuntiFerita?: { iniziali: number; incrementi: { value: number; method: "tiro" | "fisso" }[] };
  puntiFeritaMaxModo?: "manuale" | "classe";
  incrementiPf?: { value: number; method: "tiro" | "fisso" }[];
  puntiFeritaTemporanei?: string;
  classeArmatura: number | null;
  classeArmaturaModo?: "manuale" | "equipaggiamento";
  scudo: boolean;
  dadiVita: string;
  dadiVitaSpesi?: string;
  tiriMorte?: { successi: number; fallimenti: number };
  condizioni?: string[];
  ispirazioneEroica: boolean;
  puntiEsperienza: string;

  // Pagina: Identità
  specie: string;
  lignaggio: string;
  background: string;
  allineamento: string;
  velocita: string; // solo cifre, senza unità
  velocitaModo?: "manuale" | "specie";
  modificatoriVelocita?: { value: number; fonte: string; temporaneo: boolean }[];
  taglia: string;
  lingue: string[];
  noteLingue: string;

  // Pagina: Caratteristiche & Abilità
  caratteristiche: Caratteristica[];
  abilita: Abilita[];

  // Pagina: Armi
  competenzeArmi: string[];
  padronanzeArmi?: string[];
  armi: Arma[];

  // Pagina: Equipaggiamento
  competenzeArmatura: {
    leggere: boolean;
    medie: boolean;
    pesanti: boolean;
    scudi: boolean;
  };
  competenzeStrumenti?: string[];
  equipaggiamento: Equip[];

  // Pagina: Privilegi
  privilegi: Privilegio[];
  risorse?: Risorsa[];
  fontiCompetenze?: FonteCompetenza[];
  classProficienciesApplied?: boolean;
  backgroundSkillsApplied?: boolean;

  // Pagina: Talenti
  talenti: Talento[];

  // Pagina: Incantesimi
  incantesimi: Incantesimo[];
  storiaIncantesimiPreparati?: { livello: number; nomi: string[] }[];
  slotSpesi?: Record<string, number>;

  // Pagina: Monete & Note
  monete: {
    rame: string;
    argento: string;
    electrum: string;
    oro: string;
    platino: string;
  };
  note: string;
};

export const retiredCharacterFields = [
  "puntiFeritaMaxModo", "incrementiPf", "puntiFeritaTemporanei",
  "classeArmaturaModo", "classeArmaturaOverride", "dadiVitaSpesi", "tiriMorte", "condizioni",
  "velocitaModo", "modificatoriVelocita",
] as const;

export function removeRetiredFields(sheet: Sheet): Sheet {
  const cleaned = { ...sheet };
  if (sheet.puntiFeritaMaxModo === "classe") {
    const value = calculatedMaxHp(sheet)?.value;
    if (value !== undefined) cleaned.puntiFeritaMax = String(value);
  }
  if (sheet.classeArmaturaModo === "equipaggiamento") {
    const value = calculatedArmorClass(sheet)?.value;
    if (value !== undefined) cleaned.classeArmatura = value;
  }
  if (sheet.velocitaModo === "specie") {
    const value = calculatedSpeed(sheet)?.value;
    if (value !== undefined) cleaned.velocita = String(value);
  }
  for (const field of retiredCharacterFields) delete (cleaned as unknown as Record<string, unknown>)[field];
  return cleaned;
}

// Le 6 caratteristiche standard, in ordine di scheda.
const CARATTERISTICHE_BASE: { nome: string; abbr: string }[] = [
  { nome: "FORZA", abbr: "FOR" },
  { nome: "DESTREZZA", abbr: "DES" },
  { nome: "COSTITUZIONE", abbr: "COS" },
  { nome: "INTELLIGENZA", abbr: "INT" },
  { nome: "SAGGEZZA", abbr: "SAG" },
  { nome: "CARISMA", abbr: "CAR" },
];

// Le abilità standard di D&D 5e, raggruppate per caratteristica.
const ABILITA_BASE: { nome: string; caratteristica: string }[] = [
  { nome: "ATLETICA", caratteristica: "FOR" },
  { nome: "ACROBAZIA", caratteristica: "DES" },
  { nome: "FURTIVITÀ", caratteristica: "DES" },
  { nome: "RAPIDITÀ DI MANO", caratteristica: "DES" },
  { nome: "ARCANO", caratteristica: "INT" },
  { nome: "INDAGARE", caratteristica: "INT" },
  { nome: "NATURA", caratteristica: "INT" },
  { nome: "RELIGIONE", caratteristica: "INT" },
  { nome: "STORIA", caratteristica: "INT" },
  { nome: "ADDESTRARE ANIMALI", caratteristica: "SAG" },
  { nome: "INTUIZIONE", caratteristica: "SAG" },
  { nome: "MEDICINA", caratteristica: "SAG" },
  { nome: "PERCEZIONE", caratteristica: "SAG" },
  { nome: "SOPRAVVIVENZA", caratteristica: "SAG" },
  { nome: "INGANNO", caratteristica: "CAR" },
  { nome: "INTIMIDIRE", caratteristica: "CAR" },
  { nome: "INTRATTENERE", caratteristica: "CAR" },
  { nome: "PERSUASIONE", caratteristica: "CAR" },
];

// Scheda vuota pre-popolata con lo scheletro standard (caratteristiche e abilità).
export function emptySheet(): Sheet {
  return {
    creazioneCompletata: true,
    livello: "1",
    classe: "",
    sottoclasse: "",
    puntiFerita: "",
    puntiFeritaMax: "",
    classeArmatura: null,
    scudo: false,
    dadiVita: "",
    ispirazioneEroica: false,
    puntiEsperienza: "0",

    specie: "",
    lignaggio: "",
    background: "",
    allineamento: "",
    velocita: "",
    taglia: "",
    lingue: ["Comune"],
    noteLingue: "",

    caratteristiche: CARATTERISTICHE_BASE.map((c) => ({
      nome: c.nome,
      abbr: c.abbr,
      valore: "",
      tsCompetente: false,
    })),
    abilita: ABILITA_BASE.map((a) => ({
      nome: a.nome,
      caratteristica: a.caratteristica,
      competente: false,
      maestria: false,
    })),

    competenzeArmi: [],
    padronanzeArmi: [],
    armi: [],

    competenzeArmatura: {
      leggere: false,
      medie: false,
      pesanti: false,
      scudi: false,
    },
    competenzeStrumenti: [],
    equipaggiamento: [],

    privilegi: [],
    risorse: [],
    fontiCompetenze: [],
    talenti: [],
    incantesimi: [],
    slotSpesi: {},

    monete: { rame: "", argento: "", electrum: "", oro: "", platino: "" },
    note: "",
  };
}

// Le schede vecchie sono JSON: la conversione avviene alla lettura e non
// modifica il database finché il personaggio non viene salvato normalmente.
export function normalizeSheet(value: Sheet): Sheet {
  const old = value as unknown as {
    sottoclasse?: string;
    lignaggio?: string;
    noteLingue?: string;
    velocita: number | string | null;
    classeArmatura: number | string | null;
    scudo: boolean | string;
    ispirazioneEroica: boolean | string;
    lingue: unknown;
    competenzeArmi: unknown;
    caratteristiche: (Caratteristica & { modificatore?: string; tsBonus?: string })[];
    abilita: (Abilita & { bonus?: string; note?: string })[];
    armi: (Arma & { danno?: string; gittata?: string; provenienza?: string })[];
    equipaggiamento: (Equip & { provenienza?: string })[];
    privilegi: (Privilegio & { descrizione?: string })[];
    talenti: (Talento & { descrizione?: string })[];
    incantesimi: (Incantesimo & { tempo?: string })[];
  };
  const rawArmor = old.classeArmatura;
  const armorMatch = typeof rawArmor === "string" ? rawArmor.trim().match(/^(\d+)(?:\s*\(([\s\S]*)\))?$/) : null;
  const classeArmatura = typeof rawArmor === "number" && Number.isFinite(rawArmor)
    ? rawArmor
    : armorMatch ? Number(armorMatch[1]) : null;
  const rawSpeed = old.velocita;
  const speedMatch = typeof rawSpeed === "string" ? rawSpeed.trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:m|metri)?$/i) : null;
  const velocita = typeof rawSpeed === "number" && Number.isFinite(rawSpeed)
    ? String(rawSpeed) : speedMatch ? String(Number(speedMatch[1].replace(",", "."))) : "";
  const toBoolean = (input: boolean | string) =>
    typeof input === "boolean" ? input : /^s(?:i|ì)(?:\s|$)/i.test(input.trim());
  const toList = (input: unknown): string[] =>
    Array.isArray(input) ? input : typeof input === "string"
      ? input.split(/[;,\n]/).map((item) => item.trim()).filter(Boolean) : [];
  const languages = toList(old.lingue);
  const noteLingue = (old.noteLingue ?? "").split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed) return [];
    const provenance = /^(.+?)\s+\(da [^)]+\)$/i.exec(trimmed);
    if (provenance && languages.some((language) => language.toLocaleLowerCase("it") === provenance[1].toLocaleLowerCase("it"))) return [];
    return [line];
  }).join("\n");
  const privileges = old.privilegi.flatMap((item) => {
    if (typeof item.scelte === "string") return [{ titolo: item.titolo, scelte: item.scelte }];
    const description = item.descrizione ?? "";
    if (!/^Livello [12]\b/i.test(item.titolo)) return [{ titolo: item.titolo, scelte: description }];
    const choices: Privilegio[] = [];
    const mastery = /padronanza d'armi \(([^)]+)\)/i.exec(description);
    if (mastery) choices.push({ titolo: "Padronanza d'armi", scelte: mastery[1] });
    if (/Esploratore esperto/i.test(description)) choices.push({ titolo: "Esploratore esperto", scelte: "Abilità scelta non indicata" });
    const fightingStyle = /stile di combattimento \(scelto ([^)]+)\)/i.exec(description);
    if (fightingStyle) choices.push({ titolo: "Stile di combattimento", scelte: fightingStyle[1] });
    return choices;
  });
  const hunterMark = old.incantesimi.find((spell) => /marchio del cacciatore/i.test(spell.nome));
  const freeCasts = /\((\d+ volte senza spendere slot)\)/i.exec(hunterMark?.tempo ?? "");
  if (freeCasts && !privileges.some((item) => item.titolo === "Nemico prescelto")) {
    privileges.push({ titolo: "Nemico prescelto", scelte: `Marchio del Cacciatore: ${freeCasts[1]}` });
  }
  const normalized = {
    ...value,
    creazioneCompletata: value.creazioneCompletata !== false,
    sottoclasse: typeof old.sottoclasse === "string" ? old.sottoclasse : "",
    lignaggio: typeof old.lignaggio === "string" ? old.lignaggio : "",
    noteLingue,
    classeArmatura,
    velocita,
    scudo: toBoolean(old.scudo),
    ispirazioneEroica: toBoolean(old.ispirazioneEroica),
    lingue: [...new Set(["Comune", ...languages])],
    competenzeArmi: toList(old.competenzeArmi),
    ...(Array.isArray(value.competenzeStrumenti) ? { competenzeStrumenti: value.competenzeStrumenti } : {}),
    ...(Array.isArray(value.padronanzeArmi) ? { padronanzeArmi: value.padronanzeArmi } : {}),
    caratteristiche: old.caratteristiche.map(({ nome, abbr, valore, tsCompetente }) => ({
      nome, abbr, valore, tsCompetente,
    })),
    abilita: old.abilita.map(({ nome, caratteristica, competente, maestria }) => ({
      nome, caratteristica, competente, maestria: competente && maestria === true,
    })),
    armi: old.armi.map((weapon) => {
      const personalBonus = /\((\+\d+ da talento [^)]+)\)/i.exec(weapon.danno ?? "");
      const note = personalBonus && !(weapon.note ?? "").includes(personalBonus[1])
        ? [weapon.note, `Bonus al tiro per colpire: ${personalBonus[1]}`].filter(Boolean).join("\n")
        : weapon.note ?? "";
      return { nome: weapon.nome, quantita: weapon.quantita?.trim() ? weapon.quantita : "1", bonus: weapon.bonus, ...(weapon.modo ? { modo: weapon.modo } : {}), ...(weapon.caratteristica ? { caratteristica: weapon.caratteristica } : {}), note };
    }),
    equipaggiamento: old.equipaggiamento
      .filter((item) => item.nome !== "Sconto 20% su oggetti non magici")
      .map((item) => {
        const legacyArrows = !item.catalogId && !item.quantita ? /^Frecce x([1-9]\d*)$/.exec(item.nome) : null;
        const nome = legacyArrows ? "Frecce" : item.nome;
        return { nome, ...(legacyArrows ? { catalogId: gearByName("Frecce")?.id, quantita: legacyArrows[1] } : item.catalogId ? { catalogId: item.catalogId } : {}), ...(!legacyArrows && item.quantita ? { quantita: item.quantita } : {}), ...(item.unita ? { unita: item.unita } : {}), ...(item.contenitore ? { contenitore: item.contenitore } : {}), ...(item.indossato ? { indossato: true } : {}), ...(item.impugnato ? { impugnato: true } : {}), ...(item.magico ? { magico: true } : {}), dettaglio:
        (item.nome === "Armatura di cuoio borchiato" && item.dettaglio === "Classe armatura 12") ||
        (item.nome === "Borsa da erborista" && /^CD 10 per identificare una pianta; creazione:/.test(item.dettaglio))
          ? "" : gearByName(item.dettaglio)?.contents?.length ? "" : item.dettaglio };
      }),
    privilegi: privileges,
    risorse: (value.risorse ?? []).map((resource) => ({
      ...resource,
      ricarica: resource.ricarica === "breve" ? "Riposo breve" : resource.ricarica === "lungo" ? "Riposo lungo" : resource.ricarica === "manuale" ? "" : resource.ricarica,
    })),
    talenti: old.talenti.map((feat) => {
      const tools = /strumenti da artigiano scelti:\s*([^\n.]+)/i.exec(feat.descrizione ?? "");
      return { nome: feat.nome, scelte: typeof feat.scelte === "string" ? feat.scelte : tools?.[1].trim() ?? "" };
    }),
    incantesimi: old.incantesimi.map((spell) => ({ nome: canonicalSpellName(spell.nome), ...(spell.fonte ? { fonte: spell.fonte } : {}), ...(spell.stato ? { stato: spell.stato } : {}), ...(spell.caratteristica ? { caratteristica: spell.caratteristica } : {}) })),
  };
  delete (normalized as Sheet & { noteClasseArmatura?: string }).noteClasseArmatura;
  delete (normalized as Sheet & { noteVelocita?: string }).noteVelocita;
  delete (normalized as Sheet & { bonusCompetenza?: string }).bonusCompetenza;
  delete (normalized as Sheet & { percezionePassiva?: string }).percezionePassiva;
  delete (normalized as Sheet & { iniziativa?: string }).iniziativa;
  const cleaned = removeRetiredFields(normalized);
  cleaned.equipaggiamento = mergeDuplicateCatalogEquipment(expandPackageEquipment(cleaned.equipaggiamento));
  const withClass = cleaned.classProficienciesApplied ? cleaned : grantClassProficiencies(cleaned);
  return grantFeatToolProficiencies(grantBackgroundToolProficiency(grantBackgroundSkills(grantClassLanguages(withClass))));
}
