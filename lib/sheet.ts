// Modello dati della scheda. Tutto testo libero: nessun calcolo, nessuna regola.

export type Caratteristica = {
  nome: string; // es. "FORZA"
  abbr: string; // es. "FOR"
  valore: string; // es. "9"
  modificatore: string; // es. "-1"
  tsBonus: string; // tiro salvezza, es. "+1"
  tsCompetente: boolean;
};

export type Abilita = {
  nome: string; // es. "ATLETICA"
  caratteristica: string; // abbr es. "FOR"
  competente: boolean;
  bonus: string; // es. "-1"
};

export type Arma = {
  nome: string;
  quantita: string;
  bonus: string; // bonus att. / CD
  note: string;
};

export type Equip = {
  nome: string;
  dettaglio: string;
};

export type Privilegio = {
  titolo: string;
  scelte: string;
};

export type Talento = {
  nome: string;
  scelte: string;
};

export type Incantesimo = {
  nome: string;
};

export type Sheet = {
  // Pagina: Stato
  livello: string;
  classe: string;
  sottoclasse: string;
  puntiFerita: string;
  puntiFeritaMax: string;
  classeArmatura: number | null;
  scudo: boolean;
  iniziativa: string;
  bonusCompetenza: string;
  percezionePassiva: string;
  dadiVita: string;
  ispirazioneEroica: boolean;
  puntiEsperienza: string;

  // Pagina: Identità
  specie: string;
  lignaggio: string;
  background: string;
  allineamento: string;
  velocita: string; // solo cifre, senza unità
  taglia: string;
  lingue: string[];
  noteLingue: string;

  // Pagina: Caratteristiche & Abilità
  caratteristiche: Caratteristica[];
  abilita: Abilita[];

  // Pagina: Armi
  competenzeArmi: string[];
  armi: Arma[];

  // Pagina: Equipaggiamento
  competenzeArmatura: {
    leggere: boolean;
    medie: boolean;
    pesanti: boolean;
    scudi: boolean;
  };
  equipaggiamento: Equip[];

  // Pagina: Privilegi
  privilegi: Privilegio[];

  // Pagina: Talenti
  talenti: Talento[];

  // Pagina: Incantesimi
  incantesimi: Incantesimo[];

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
    livello: "1",
    classe: "",
    sottoclasse: "",
    puntiFerita: "",
    puntiFeritaMax: "",
    classeArmatura: null,
    scudo: false,
    iniziativa: "",
    bonusCompetenza: "+2",
    percezionePassiva: "",
    dadiVita: "",
    ispirazioneEroica: false,
    puntiEsperienza: "0",

    specie: "",
    lignaggio: "",
    background: "",
    allineamento: "",
    velocita: "",
    taglia: "",
    lingue: [],
    noteLingue: "",

    caratteristiche: CARATTERISTICHE_BASE.map((c) => ({
      nome: c.nome,
      abbr: c.abbr,
      valore: "",
      modificatore: "",
      tsBonus: "",
      tsCompetente: false,
    })),
    abilita: ABILITA_BASE.map((a) => ({
      nome: a.nome,
      caratteristica: a.caratteristica,
      competente: false,
      bonus: "",
    })),

    competenzeArmi: [],
    armi: [],

    competenzeArmatura: {
      leggere: false,
      medie: false,
      pesanti: false,
      scudi: false,
    },
    equipaggiamento: [],

    privilegi: [],
    talenti: [],
    incantesimi: [],

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
    incantesimi: (Incantesimo & { crm?: string })[];
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
  const normalized = {
    ...value,
    sottoclasse: typeof old.sottoclasse === "string" ? old.sottoclasse : "",
    lignaggio: typeof old.lignaggio === "string" ? old.lignaggio : "",
    noteLingue: typeof old.noteLingue === "string" ? old.noteLingue : "",
    classeArmatura,
    velocita,
    scudo: toBoolean(old.scudo),
    ispirazioneEroica: toBoolean(old.ispirazioneEroica),
    lingue: toList(old.lingue),
    competenzeArmi: toList(old.competenzeArmi),
    incantesimi: old.incantesimi.map((inc) => {
      const legacy = inc.crm ?? "";
      const symbols = new Set(legacy.toUpperCase().match(/\b[CRM]\b/g) ?? []);
      return {
        ...inc,
        concentrazione: inc.concentrazione ?? (symbols.has("C") || /concentrazione/i.test(legacy)),
        rituale: inc.rituale ?? (symbols.has("R") || /rituale/i.test(legacy)),
        materiali: inc.materiali ?? (symbols.has("M") || /material/i.test(legacy) || /(?:^|[,\s])M(?:\s|,|\(|$)/i.test(inc.componenti)),
      };
    }),
  };
  delete (normalized as Sheet & { noteClasseArmatura?: string }).noteClasseArmatura;
  delete (normalized as Sheet & { noteVelocita?: string }).noteVelocita;
  return normalized;
}
