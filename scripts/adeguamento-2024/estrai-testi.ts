// Estrae le descrizioni delle voci dalla copia automatica del PDF locale
// (docs/manuale-copia/auto, rigenerabile con scripts/manuale/estrai.py)
// seguendo le ancore «testo» dei file in lib/manuale-2024/.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import type { Ancora, FileDominio, Privilegio, Voce, VoceBase } from "../../lib/manuale-2024/schema";
import { SCARTO_PAGINA_PDF } from "../../lib/manuale-2024/pagine";

const CARTELLA = "docs/manuale-copia/auto";
const PAGINE_SEGUENTI = 4; // un segmento può continuare al massimo su quattro pagine successive

type Riga = { inizio: number; fine: number; titolo: boolean; tabella: boolean; pagina: number };
type Flusso = { testo: string; righe: Riga[]; chiave: string; mappa: number[] };

const fileAuto = (stampata: number) => `${CARTELLA}/p${String(stampata + SCARTO_PAGINA_PDF).padStart(3, "0")}.md`;

// Chiave delle ancore: lettere e cifre senza accenti; l/i/1, o/0, s/5 e rn/m coincidono.
function normalizza(testo: string, base = 0): { chiave: string; mappa: number[] } {
  let chiave = "";
  const mappa: number[] = [];
  for (let indice = 0; indice < testo.length; indice++) {
    for (const carattere of testo[indice].normalize("NFD").toLowerCase()) {
      if (!/[a-z0-9!]/.test(carattere)) continue;
      const simbolo = /[il!]/.test(carattere) ? "1" : carattere === "o" ? "0" : carattere === "s" ? "5" : carattere;
      if (simbolo === "n" && chiave.endsWith("r")) {
        chiave = `${chiave.slice(0, -1)}m`;
        continue;
      }
      chiave += simbolo;
      mappa.push(base + indice);
    }
  }
  return { chiave, mappa };
}

export const chiaveAncora = (testo: string) => normalizza(testo).chiave;

const cachePagine = new Map<number, string[]>();
function righeAuto(stampata: number): string[] {
  if (!cachePagine.has(stampata)) {
    const percorso = fileAuto(stampata);
    cachePagine.set(stampata, existsSync(percorso)
      ? readFileSync(percorso, "utf8").replace(/\r\n/g, "\n").split("\n").map((riga) => riga.trim()).filter((riga) => riga && !riga.startsWith("<!--"))
      : []);
  }
  return cachePagine.get(stampata)!;
}

export function flusso(da: number): Flusso {
  let testo = "";
  const righe: Riga[] = [];
  for (let pagina = da; pagina <= da + PAGINE_SEGUENTI; pagina++) {
    for (const contenuto of righeAuto(pagina)) {
      const inizio = testo.length;
      testo += `${contenuto}\n`;
      righe.push({ inizio, fine: testo.length, titolo: contenuto.startsWith("#"), tabella: contenuto.startsWith("|"), pagina });
    }
  }
  return { testo, righe, ...normalizza(testo) };
}

// Occorrenza n-esima (da 1) di «cercato» a partire dalla posizione originale indicata.
export function trova(flusso: Flusso, cercato: string, daOriginale: number, occorrenza = 1): { inizio: number; fine: number } | null {
  const ago = chiaveAncora(cercato);
  if (!ago) return null;
  // L'ancora deve iniziare e finire a confine di parola nel testo originale.
  const alfanumerico = (carattere: string | undefined) => carattere !== undefined && /[\p{L}\p{N}]/u.test(carattere);
  let indice = flusso.mappa.findIndex((posizione) => posizione >= daOriginale);
  while (indice >= 0 && (indice = flusso.chiave.indexOf(ago, indice)) >= 0) {
    const inizio = flusso.mappa[indice];
    const fine = flusso.mappa[indice + ago.length - 1] + 1;
    if (!alfanumerico(flusso.testo[inizio - 1]) && !alfanumerico(flusso.testo[fine]) && --occorrenza === 0) return { inizio, fine };
    indice++;
  }
  return null;
}

export const rigaDi = (flusso: Flusso, posizione: number) =>
  flusso.righe.find((riga) => posizione >= riga.inizio && posizione < riga.fine)!;

// Confusioni sistematiche di estrazione; il resto va corretto voce per voce.
const PULIZIA: [RegExp, string][] = [
  [/\u00ad/g, ""],
  [/[ \t]+/g, " "],
  [/ ([,.;:!?])/g, "$1"],
  [/\bII(?= [a-zà-ù])/g, "Il"],
  [/\b1'(?=\d)/g, "l'"],
  [/\bO,(?=\d)/g, "0,"],
  [/\bl,(?=\d)/g, "1,"],
  [/\bVedianche\b/g, "Vedi anche"],
  [/\bGuidadel DungeonMaster\b/g, "Guida del Dungeon Master"],
  [/\bDungeonMaster\b/g, "Dungeon Master"],
  [/\bingrado\b/g, "in grado"],
  // «O» al posto dello zero dopo parole che introducono un numero.
  [/\b(Velocità|livello|pari a|tra|lo|ha|a|di) O\b(?!['’])/g, "$1 0"],
];

export function pulisciTesto(testo: string): string {
  return PULIZIA.reduce((risultato, [regola, sostituzione]) => risultato.replace(regola, sostituzione), testo)
    .split("\n").map((riga) => riga.trim()).join("\n").trim();
}

export function estraiSegmento(ancora: Ancora): { testo: string; errore?: string } {
  const sorgente = flusso(ancora.pagina);
  const paginaIniziale = sorgente.righe.filter((riga) => riga.pagina === ancora.pagina);
  if (paginaIniziale.length === 0) return { testo: "", errore: `pagina ${ancora.pagina} assente in ${CARTELLA}` };
  const fineIniziale = paginaIniziale.at(-1)!.fine;
  const inizioAncora = trova(sorgente, ancora.da, paginaIniziale[0].inizio, ancora.n ?? 1);
  if (!inizioAncora || inizioAncora.inizio >= fineIniziale) return { testo: "", errore: `«${ancora.da}» non trovato a p. ${ancora.pagina}` };
  const rigaAncora = rigaDi(sorgente, inizioAncora.fine - 1);
  const inizio = ancora.includiDa ? inizioAncora.inizio : rigaAncora.titolo ? rigaAncora.fine : inizioAncora.fine;
  let fine: number;
  if (ancora.finePagina) {
    fine = paginaIniziale.at(-1)!.fine;
  } else if (ancora.a) {
    const termine = trova(sorgente, ancora.a, inizio, ancora.na ?? 1);
    if (!termine) return { testo: "", errore: `«${ancora.a}» non trovato dopo «${ancora.da}» (p. ${ancora.pagina})` };
    fine = termine.inizio;
  } else {
    const titolo = sorgente.righe.find((riga) => riga.titolo && riga.inizio >= inizio);
    if (!titolo) return { testo: "", errore: `nessun titolo dopo «${ancora.da}» (p. ${ancora.pagina})` };
    fine = titolo.inizio;
  }
  // Paragrafi separati da una riga vuota; righe di tabella consecutive a capo.
  let testo = "";
  let tabellaPrecedente = false;
  for (const riga of sorgente.righe) {
    if (riga.fine <= inizio || riga.inizio >= fine) continue;
    let contenuto = sorgente.testo.slice(Math.max(riga.inizio, inizio), Math.min(riga.fine, fine)).trim();
    if (riga.inizio < inizio) contenuto = contenuto.replace(/^[\s.,;:)\]»]+/, "");
    if (riga.titolo) contenuto = contenuto.replace(/^#+\s*/, "");
    if (riga.tabella) contenuto = contenuto.split("|").map((cella) => cella.trim()).filter(Boolean).join(" · ");
    if (!contenuto) continue;
    testo += testo ? (riga.tabella && tabellaPrecedente ? "\n" : "\n\n") + contenuto : contenuto;
    tabellaPrecedente = riga.tabella;
  }
  const pulito = pulisciTesto(ancora.unisci ? testo.replace(/\s*\n+\s*/g, " ") : testo);
  return pulito ? { testo: pulito } : { testo: "", errore: `testo vuoto per «${ancora.da}» (p. ${ancora.pagina})` };
}

export function testoVoce(voce: VoceBase): { testo: string; errori: string[] } {
  const errori: string[] = [];
  let testo = (voce.testo ?? []).map((ancora) => {
    const segmento = estraiSegmento(ancora);
    if (segmento.errore) errori.push(segmento.errore);
    return segmento.testo;
  }).filter(Boolean).join("\n\n");
  for (const [cercato, sostituto] of voce.correzioni ?? []) {
    if (!testo.includes(cercato)) errori.push(`correzione non applicabile: «${cercato}»`);
    testo = testo.split(cercato).join(sostituto);
  }
  return { testo, errori };
}

const annidate = (voce: Voce): Privilegio[] =>
  voce.tipo === "classe" || voce.tipo === "sottoclasse" ? voce.privilegi
    : voce.tipo === "specie" || voce.tipo === "lignaggio" ? voce.tratti ?? [] : [];

export const tutteLeVoci = (file: FileDominio): VoceBase[] =>
  [...file.etichette, ...file.voci, ...file.voci.flatMap(annidate)];

export function estraiDominio(file: FileDominio): { testi: Record<string, string>; errori: string[] } {
  const testi: Record<string, string> = {};
  const errori: string[] = [];
  for (const voce of tutteLeVoci(file)) {
    if (!voce.testo) continue;
    const risultato = testoVoce(voce);
    errori.push(...risultato.errori.map((errore) => `${file.dominio} ${voce.id}: ${errore}`));
    testi[voce.id] = risultato.testo;
  }
  return { testi: Object.fromEntries(Object.entries(testi).sort(([a], [b]) => a.localeCompare(b))), errori };
}

// Parole rare o anomale da controllare sulla pagina: segnalazioni, non errori.
let vocabolario: Map<string, number> | null = null;
function frequenze(): Map<string, number> {
  if (vocabolario) return vocabolario;
  vocabolario = new Map();
  for (const nome of readdirSync(CARTELLA)) {
    for (const parola of readFileSync(`${CARTELLA}/${nome}`, "utf8").toLowerCase().match(/[a-zà-ù]+/g) ?? []) {
      vocabolario.set(parola, (vocabolario.get(parola) ?? 0) + 1);
    }
  }
  return vocabolario;
}

export function paroleSospette(testo: string): string[] {
  const conteggi = frequenze();
  const sospette = new Set<string>();
  for (const elemento of testo.match(/[\p{L}\p{N}°]+['’]?/gu) ?? []) {
    const parola = elemento.replace(/['’]$/, "");
    if (/^(?:II|O)$/.test(parola) || (parola === "l" && parola === elemento)) sospette.add(parola);
    else if (/\p{Ll}\p{Lu}/u.test(parola)) sospette.add(parola);
    else if (/\d/.test(parola) && /\p{L}/u.test(parola) && !/^(?:\d*d\d+|\d+°|\d+[ºª]|[dD]\d+|\d+(?:mo|ma|mr|kg|m)?)$/.test(parola)) sospette.add(parola);
    else if (!/\d/.test(parola) && parola.length >= 10 && (conteggi.get(parola.toLowerCase()) ?? 0) <= 1) {
      const minuscola = parola.toLowerCase();
      for (let taglio = 2; taglio <= minuscola.length - 2; taglio++) {
        if ((conteggi.get(minuscola.slice(0, taglio)) ?? 0) >= 3 && (conteggi.get(minuscola.slice(taglio)) ?? 0) >= 3) {
          sospette.add(`${parola} → ${parola.slice(0, taglio)} ${parola.slice(taglio)}`);
          break;
        }
      }
    }
  }
  return [...sospette];
}
