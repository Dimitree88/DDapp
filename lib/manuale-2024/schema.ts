// Schema comune dei file per dominio in lib/manuale-2024/.
// Ogni voce riporta testo e pagina stampata del Manuale del Giocatore 2024;
// note e scelte del giocatore restano nella scheda, mai in questi file.
import { FONTE_MANUALE, paginaNegliIntervalli, paginaValida, type IntervalloPagine } from "./pagine";

export type Sigla = "FOR" | "DES" | "COS" | "INT" | "SAG" | "CAR";
export type StatoVerifica = "da_verificare" | "verificata" | "aperta";

export type Tabella = {
  titolo: string;
  pagina: number;
  colonne: string[];
  righe: string[][];
  note?: string;
};

export type Verifica = {
  stato: StatoVerifica;
  // Obbligatoria per «aperta»: domanda per l'utente o punto non chiarito dal PDF.
  note?: string;
};

export type VoceBase = {
  id: string; // "<prefisso>:<slug>", unico in tutto il manuale
  nome: string; // nome come stampato nel PDF
  descrizione: string; // testo della voce; corretti solo a capo e artefatti OCR
  pagina: number; // pagina stampata in cui inizia la voce
  pagine?: number[]; // altre pagine stampate (tabella, seguito, regola collegata)
  alias?: string[]; // nomi storici, solo per leggere vecchie schede
  tabelle?: Tabella[];
  righeMatrice?: string[]; // righe di docs/adeguamento-2024/matrice.json servite dalla voce
  verifica: Verifica;
};

export type Privilegio = VoceBase & {
  livello?: number;
  risorse?: { nome: string; usi: string; recupero: string }[];
};

export type Componenti = { verbale: boolean; somatica: boolean; materiale?: string };

export type VoceEtichetta = VoceBase & { tipo: "etichetta" };
export type VoceRegola = VoceBase & {
  tipo: "regola";
  formula?: string; // formula come enunciata dal manuale
  calcolo?: string; // funzione dell'app che applica la formula, es. "lib/armorClass.ts#calculatedArmorClass"
};
export type VoceAllineamento = VoceBase & { tipo: "allineamento" };
export type VoceCaratteristica = VoceBase & { tipo: "caratteristica"; sigla: Sigla };
export type VoceAbilita = VoceBase & { tipo: "abilita"; caratteristica: Sigla };
export type VoceTaglia = VoceBase & { tipo: "taglia" };
export type VoceLingua = VoceBase & { tipo: "lingua"; gruppo: "standard" | "rara" };
export type VoceCondizione = VoceBase & { tipo: "condizione" };
export type VoceBackground = VoceBase & {
  tipo: "background";
  punteggiCaratteristica: Sigla[];
  talento: string;
  competenzeAbilita: string[];
  competenzaStrumenti: string;
  equipaggiamento: string;
};
export type VoceSpecie = VoceBase & {
  tipo: "specie";
  tipoCreatura: string;
  taglia: string;
  velocita: string;
  tratti: Privilegio[];
};
export type VoceLignaggio = VoceBase & { tipo: "lignaggio"; specie: string; tratti?: Privilegio[] };
export type VoceTalento = VoceBase & {
  tipo: "talento";
  categoria: "Origini" | "Generale" | "Stile di combattimento" | "Dono epico";
  prerequisito?: string;
  ripetibile: boolean;
};
export type VoceClasse = VoceBase & {
  tipo: "classe";
  dadoVita: string;
  caratteristicaPrimaria: string;
  tiriSalvezza: Sigla[];
  competenze: { abilita: { numero: number; scelte: string[] }; armi: string[]; armature: string[]; strumenti: string[] };
  equipaggiamentoIniziale: string;
  privilegi: Privilegio[];
};
export type VoceSottoclasse = VoceBase & { tipo: "sottoclasse"; classe: string; privilegi: Privilegio[] };
export type VoceArma = VoceBase & {
  tipo: "arma";
  categoria: "semplice" | "da guerra";
  attacco: "mischia" | "distanza";
  danni: string;
  proprieta: string[];
  padronanza: string;
  peso: string;
  pesoKg: number | null;
  costo: string;
  costoMo: number | null;
};
export type VoceProprietaArma = VoceBase & { tipo: "proprietaArma" };
export type VocePadronanza = VoceBase & { tipo: "padronanza" };
export type VoceCategoria = VoceBase & { tipo: "categoria" };
export type VoceArmatura = VoceBase & {
  tipo: "armatura";
  categoria: "leggera" | "media" | "pesante" | "scudo";
  classeArmatura: string;
  forza?: number;
  svantaggioFurtivita: boolean;
  peso: string;
  pesoKg: number | null;
  costo: string;
  costoMo: number | null;
};
export type VoceStrumento = VoceBase & {
  tipo: "strumento";
  categoria: string;
  caratteristica: Sigla;
  peso: string;
  pesoKg: number | null;
  costo: string;
  costoMo: number | null;
  varianteDi?: string;
};
export type VoceOggetto = VoceBase & {
  tipo: "oggetto";
  peso: string;
  pesoKg: number | null;
  costo: string;
  costoMo: number | null;
  quantitaPrezzo?: number; // es. 20 frecce per il prezzo indicato
  varianteDi?: string; // voce madre nella tabella principale
};
export type VoceCostoGenerico = VoceBase & {
  tipo: "cavalcatura" | "veicolo" | "servizio" | "stileDiVita" | "moneta";
  costo?: string;
  costoMo?: number | null;
};
export type VoceIncantesimo = VoceBase & {
  tipo: "incantesimo";
  livello: number; // 0 = trucchetto
  scuola: string;
  classi: string[];
  tempoLancio: string;
  rituale: boolean;
  gittata: string;
  componenti: Componenti;
  durata: string;
  concentrazione: boolean;
  potenziamento?: string; // «Utilizzo di uno slot…» o «Trucchetto potenziato…»
};

export type Voce =
  | VoceEtichetta | VoceRegola | VoceAllineamento | VoceCaratteristica | VoceAbilita
  | VoceTaglia | VoceLingua | VoceCondizione | VoceBackground | VoceSpecie | VoceLignaggio
  | VoceTalento | VoceClasse | VoceSottoclasse | VoceArma | VoceProprietaArma | VocePadronanza
  | VoceCategoria | VoceArmatura | VoceStrumento | VoceOggetto | VoceCostoGenerico | VoceIncantesimo;

export type TipoVoce = Voce["tipo"];

export type FileDominio = {
  dominio: string; // chiave del registro, es. "talenti/origini"
  modulo: string; // modulo proprietario, es. "T01"
  fonte: typeof FONTE_MANUALE;
  tipoPagina: "stampata";
  etichette: VoceEtichetta[]; // definizioni generali delle etichette del dominio
  voci: Voce[];
};

// Campi obbligatori oltre a quelli di VoceBase, controllati anche a runtime.
const CAMPI: Record<TipoVoce, readonly string[]> = {
  etichetta: [], regola: [], allineamento: [], taglia: [], condizione: [],
  caratteristica: ["sigla"], abilita: ["caratteristica"], lingua: ["gruppo"],
  background: ["punteggiCaratteristica", "talento", "competenzeAbilita", "competenzaStrumenti", "equipaggiamento"],
  specie: ["tipoCreatura", "taglia", "velocita", "tratti"],
  lignaggio: ["specie"],
  talento: ["categoria", "ripetibile"],
  classe: ["dadoVita", "caratteristicaPrimaria", "tiriSalvezza", "competenze", "equipaggiamentoIniziale", "privilegi"],
  sottoclasse: ["classe", "privilegi"],
  arma: ["categoria", "attacco", "danni", "proprieta", "padronanza", "peso", "pesoKg", "costo", "costoMo"],
  proprietaArma: [], padronanza: [], categoria: [],
  armatura: ["categoria", "classeArmatura", "svantaggioFurtivita", "peso", "pesoKg", "costo", "costoMo"],
  strumento: ["categoria", "caratteristica", "peso", "pesoKg", "costo", "costoMo"],
  oggetto: ["peso", "pesoKg", "costo", "costoMo"],
  cavalcatura: [], veicolo: [], servizio: [], stileDiVita: [], moneta: [],
  incantesimo: ["livello", "scuola", "classi", "tempoLancio", "rituale", "gittata", "componenti", "durata", "concentrazione"],
};

export const TIPI_VOCE = Object.keys(CAMPI) as TipoVoce[];

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*(?::[a-z0-9]+(?:-[a-z0-9]+)*)+$/;
// Artefatti tipici dell'estrazione dal PDF che non devono restare nel testo.
const ARTEFATTI: [RegExp, string][] = [
  [/­/, "trattino morbido"],
  [/[ \t]{2,}/, "spazi doppi"],
  [/[a-zà-ù]-\n[a-zà-ù]/, "parola spezzata a capo"],
  [/\bSRD\b/, "riferimento all'SRD"],
];

export type RegolaDominio = {
  modulo: string;
  tipi: readonly TipoVoce[];
  pagine: readonly IntervalloPagine[]; // intervalli per la pagina principale delle voci
};

function controllaTesto(dove: string, testo: unknown, errori: string[], obbligatorio = true) {
  if (typeof testo !== "string" || (obbligatorio && !testo.trim())) {
    errori.push(`${dove}: testo mancante`);
    return;
  }
  if (testo !== testo.trim()) errori.push(`${dove}: spazi iniziali o finali`);
  for (const [regola, nome] of ARTEFATTI) if (regola.test(testo)) errori.push(`${dove}: ${nome}`);
}

function controllaVoceBase(dove: string, voce: VoceBase, regola: RegolaDominio | null, errori: string[]) {
  if (typeof voce.id !== "string" || !ID.test(voce.id)) errori.push(`${dove}: id non valido (${voce.id})`);
  controllaTesto(`${dove} nome`, voce.nome, errori);
  controllaTesto(`${dove} descrizione`, voce.descrizione, errori);
  if (!paginaValida(voce.pagina)) errori.push(`${dove}: pagina stampata non valida (${voce.pagina})`);
  else if (regola && !paginaNegliIntervalli(voce.pagina, regola.pagine)) errori.push(`${dove}: pagina ${voce.pagina} fuori dal dominio`);
  if (voce.pagine !== undefined && (!Array.isArray(voce.pagine) || !voce.pagine.every(paginaValida))) errori.push(`${dove}: pagine aggiuntive non valide`);
  if (voce.alias !== undefined && (!Array.isArray(voce.alias) || voce.alias.some((alias) => typeof alias !== "string" || !alias.trim()))) errori.push(`${dove}: alias non validi`);
  if (voce.righeMatrice !== undefined && (!Array.isArray(voce.righeMatrice) || voce.righeMatrice.some((riga) => typeof riga !== "string"))) errori.push(`${dove}: righeMatrice non valide`);
  for (const [indice, tabella] of (voce.tabelle ?? []).entries()) {
    const qui = `${dove} tabella ${indice + 1}`;
    controllaTesto(`${qui} titolo`, tabella.titolo, errori);
    if (!paginaValida(tabella.pagina)) errori.push(`${qui}: pagina non valida`);
    if (!Array.isArray(tabella.colonne) || tabella.colonne.length === 0) errori.push(`${qui}: colonne mancanti`);
    else if (!Array.isArray(tabella.righe) || tabella.righe.some((riga) => !Array.isArray(riga) || riga.length !== tabella.colonne.length)) errori.push(`${qui}: righe non coerenti con le colonne`);
  }
  const stato = voce.verifica?.stato;
  if (stato !== "da_verificare" && stato !== "verificata" && stato !== "aperta") errori.push(`${dove}: stato di verifica non valido`);
  if (stato === "aperta" && !voce.verifica.note?.trim()) errori.push(`${dove}: voce aperta senza domanda`);
}

function controllaPrivilegi(dove: string, privilegi: unknown, errori: string[]) {
  if (!Array.isArray(privilegi)) {
    errori.push(`${dove}: privilegi non validi`);
    return;
  }
  for (const [indice, privilegio] of (privilegi as Privilegio[]).entries()) {
    controllaVoceBase(`${dove} privilegio ${indice + 1}`, privilegio, null, errori);
    if (privilegio.livello !== undefined && (!Number.isInteger(privilegio.livello) || privilegio.livello < 1 || privilegio.livello > 20)) errori.push(`${dove} privilegio ${indice + 1}: livello non valido`);
  }
}

export function validaVoce(dove: string, voce: Voce, regola: RegolaDominio | null): string[] {
  const errori: string[] = [];
  if (!TIPI_VOCE.includes(voce.tipo)) return [`${dove}: tipo non valido (${String(voce.tipo)})`];
  if (regola && !regola.tipi.includes(voce.tipo)) errori.push(`${dove}: tipo ${voce.tipo} non ammesso nel dominio`);
  controllaVoceBase(dove, voce, regola, errori);
  const record = voce as unknown as Record<string, unknown>;
  for (const campo of CAMPI[voce.tipo]) if (record[campo] === undefined) errori.push(`${dove}: campo ${campo} mancante`);
  if ("tratti" in voce && voce.tratti !== undefined) controllaPrivilegi(dove, voce.tratti, errori);
  if (voce.tipo === "classe" || voce.tipo === "sottoclasse") controllaPrivilegi(dove, voce.privilegi, errori);
  if (voce.tipo === "incantesimo" && (!Number.isInteger(voce.livello) || voce.livello < 0 || voce.livello > 9)) errori.push(`${dove}: livello incantesimo non valido`);
  return errori;
}

export function validaFileDominio(chiave: string, file: FileDominio, regola: RegolaDominio): string[] {
  const errori: string[] = [];
  if (file.dominio !== chiave) errori.push(`${chiave}: dominio dichiarato ${file.dominio}`);
  if (file.modulo !== regola.modulo) errori.push(`${chiave}: modulo dichiarato ${file.modulo}, atteso ${regola.modulo}`);
  if (file.fonte !== FONTE_MANUALE) errori.push(`${chiave}: fonte diversa dal PDF locale`);
  if (file.tipoPagina !== "stampata") errori.push(`${chiave}: tipo di pagina diverso da «stampata»`);
  if (!Array.isArray(file.etichette) || !Array.isArray(file.voci)) return [...errori, `${chiave}: etichette o voci mancanti`];
  for (const [indice, voce] of file.etichette.entries()) {
    const dove = `${chiave} etichetta ${indice + 1}`;
    if (voce.tipo !== "etichetta") errori.push(`${dove}: tipo diverso da etichetta`);
    errori.push(...validaVoce(dove, voce, { ...regola, tipi: ["etichetta"] }));
  }
  for (const [indice, voce] of file.voci.entries()) errori.push(...validaVoce(`${chiave} voce ${indice + 1}`, voce, regola));
  return errori;
}
