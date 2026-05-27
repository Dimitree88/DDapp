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
  note: string; // es. "da Ranger"
};

export type Arma = {
  nome: string;
  quantita: string;
  bonus: string; // bonus att. / CD
  danno: string; // danno & tipo
  gittata: string;
  provenienza: string;
  note: string;
};

export type Equip = {
  nome: string;
  dettaglio: string;
  provenienza: string;
};

export type Privilegio = {
  titolo: string;
  descrizione: string;
};

export type Talento = {
  nome: string;
  descrizione: string;
};

export type Incantesimo = {
  livello: string;
  nome: string;
  tempo: string; // tempo di lancio
  gittata: string;
  componenti: string;
  durata: string;
  crm: string; // concentrazione / rituale / materiali
  note: string;
};

export type Sheet = {
  // Pagina: Stato
  livello: string;
  classe: string;
  puntiFerita: string;
  puntiFeritaMax: string;
  classeArmatura: string;
  scudo: string;
  iniziativa: string;
  bonusCompetenza: string;
  percezionePassiva: string;
  dadiVita: string;
  ispirazioneEroica: string;
  puntiEsperienza: string;

  // Pagina: Identità
  specie: string;
  background: string;
  allineamento: string;
  velocita: string;
  taglia: string;
  lingue: string;

  // Pagina: Caratteristiche & Abilità
  caratteristiche: Caratteristica[];
  abilita: Abilita[];

  // Pagina: Armi
  competenzeArmi: string;
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
    puntiFerita: "",
    puntiFeritaMax: "",
    classeArmatura: "",
    scudo: "",
    iniziativa: "",
    bonusCompetenza: "+2",
    percezionePassiva: "",
    dadiVita: "",
    ispirazioneEroica: "",
    puntiEsperienza: "0",

    specie: "",
    background: "",
    allineamento: "",
    velocita: "",
    taglia: "",
    lingue: "",

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
      note: "",
    })),

    competenzeArmi: "",
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
