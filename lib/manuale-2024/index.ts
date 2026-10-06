// Adapter di lettura dei file del Manuale del Giocatore 2024.
// Restituisce solo voci presenti nei file per dominio: se una voce manca,
// il risultato è null e l'interfaccia non deve sostituirla con sintesi generiche.
import blocchiIncantesimi from "./incantesimi/blocchi.json";
import { BLOCCHI_E04, DOMINI, REGOLA_BLOCCO_INCANTESIMI, dominioBloccoIncantesimi, fileClasse } from "./domini";
import { riferimentoManuale } from "./pagine";
import { FILE_MANUALE, TESTI_MANUALE } from "./registro";
import type { FileDominio, Privilegio, RegolaDominio, TestiDominio, Voce, VoceBase, VoceEtichetta } from "./schema";

export type RisultatoManuale<T extends VoceBase = Voce> = {
  voce: T;
  dominio: string;
  modulo: string;
  verificata: boolean;
  descrizione: string | null; // testo estratto dal PDF (lib/manuale-2024/testi)
  riferimento: string; // «Manuale del Giocatore 2024, p. N»
};

export type ContestoPrivilegio = { classe?: string; sottoclasse?: string; specie?: string; lignaggio?: string; livello?: number };

// Confronto di nomi: maiuscole, accenti, apostrofi tipografici e spazi non contano.
export function chiaveRicerca(testo: string): string {
  return testo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’`´]/g, "'")
    .toLocaleLowerCase("it").replace(/\s+/g, " ").trim();
}

// Ordinamento dei confini dei blocchi: conta solo la sequenza di lettere e cifre.
export function chiaveOrdinamento(testo: string): string {
  return chiaveRicerca(testo).replace(/[^a-z0-9]/g, "");
}

export function regolaDominio(dominio: string): RegolaDominio | null {
  if (DOMINI[dominio]) return DOMINI[dominio];
  const blocco = blocchiIncantesimi.blocchi.find((item) => dominioBloccoIncantesimi(item.id) === dominio);
  return blocco ? REGOLA_BLOCCO_INCANTESIMI(blocco.id) : null;
}

const pagineVoce = (voce: VoceBase) => [voce.pagina, ...(voce.pagine ?? [])];

export function creaIndiceManuale(files: Record<string, FileDominio>, testi: Record<string, TestiDominio> = {}) {
  const risultato = <T extends VoceBase>(voce: T, dominio: string): RisultatoManuale<T> => ({
    voce, dominio, modulo: files[dominio].modulo,
    verificata: voce.verifica.stato === "verificata",
    descrizione: testi[dominio]?.testi[voce.id] || null,
    riferimento: riferimentoManuale(pagineVoce(voce)),
  });
  const corrisponde = (voce: VoceBase, chiave: string) => {
    const cercata = chiaveRicerca(chiave);
    return voce.id === chiave || chiaveRicerca(voce.nome) === cercata || (voce.alias ?? []).some((alias) => chiaveRicerca(alias) === cercata);
  };
  const privilegiDi = (voce: Voce): Privilegio[] =>
    voce.tipo === "classe" || voce.tipo === "sottoclasse" ? voce.privilegi
      : voce.tipo === "specie" || voce.tipo === "lignaggio" ? voce.tratti ?? [] : [];

  const perId = new Map<string, RisultatoManuale<VoceBase>>();
  for (const [dominio, file] of Object.entries(files)) {
    for (const voce of [...file.etichette, ...file.voci]) {
      perId.set(voce.id, risultato<VoceBase>(voce, dominio));
      for (const privilegio of privilegiDi(voce)) perId.set(privilegio.id, risultato<VoceBase>(privilegio, dominio));
    }
  }

  function voce(dominio: string, chiave: string): RisultatoManuale | null {
    const trovata = files[dominio]?.voci.find((item) => corrisponde(item, chiave));
    return trovata ? risultato(trovata, dominio) : null;
  }

  function etichetta(chiave: string, dominio?: string): RisultatoManuale<VoceEtichetta> | null {
    for (const [nome, file] of Object.entries(files)) {
      if (dominio && nome !== dominio) continue;
      const trovata = file.etichette.find((item) => corrisponde(item, chiave));
      if (trovata) return risultato(trovata, nome);
    }
    return null;
  }

  // Cerca prima nella sottoclasse, poi nella classe, nel lignaggio e nella specie.
  function privilegio(nome: string, contesto: ContestoPrivilegio): RisultatoManuale<Privilegio> | null {
    const fonti: [string, string | undefined][] = [
      [contesto.classe ? fileClasse(contesto.classe) : "", contesto.sottoclasse],
      [contesto.classe ? fileClasse(contesto.classe) : "", contesto.classe],
      ["lignaggi", contesto.lignaggio],
      ["specie", contesto.specie],
    ];
    for (const [dominio, proprietario] of fonti) {
      if (!dominio || !proprietario || !files[dominio]) continue;
      const padre = files[dominio].voci.find((item) => corrisponde(item, proprietario));
      const candidati = padre ? privilegiDi(padre).filter((item) => corrisponde(item, nome)) : [];
      // Un privilegio ripetuto (es. Colpo brutale migliorato ai livelli 13 e 17) si sceglie per livello esatto.
      const trovato = candidati.find((item) => item.livello !== undefined && item.livello === contesto.livello)
        ?? candidati.find((item) => contesto.livello === undefined || item.livello === undefined || item.livello <= contesto.livello) ?? null;
      if (trovato) return risultato(trovato, dominio);
    }
    return null;
  }

  return {
    file: (dominio: string): FileDominio | null => files[dominio] ?? null,
    voci: (dominio: string): Voce[] => files[dominio]?.voci ?? [],
    voce,
    etichetta,
    privilegio,
    perId: (id: string) => perId.get(id) ?? null,
  };
}

export const manuale = creaIndiceManuale(FILE_MANUALE, TESTI_MANUALE);
export const voceManuale = manuale.voce;
export const etichettaManuale = manuale.etichetta;
export const privilegioManuale = manuale.privilegio;

function bloccoPerInizio<T extends { da: string | null }>(blocchi: readonly T[], nome: string): T | null {
  const chiave = chiaveOrdinamento(nome);
  return blocchi.filter((blocco) => blocco.da === null || chiaveOrdinamento(blocco.da) <= chiave).at(-1) ?? null;
}

export function bloccoIncantesimo(livello: number, nome: string): string | null {
  return bloccoPerInizio(blocchiIncantesimi.blocchi.filter((blocco) => blocco.livello === livello), nome)?.id ?? null;
}

// Voce madre nella tabella Equipaggiamento d'avventura: munizioni, focus e
// simboli sacri seguono la voce generale della tabella (p. 223).
export function bloccoEquipaggiamentoAvventura(voceMadre: string): string {
  return bloccoPerInizio(BLOCCHI_E04, voceMadre)!.dominio;
}
