// Domini del manuale e moduli proprietari (PLAN_ADEGUAMENTO_2024.md, F00).
// Ogni file ha un solo modulo proprietario; nessun altro modulo lo modifica.
import { intervalloCapitolo as cap, type IntervalloPagine } from "./pagine";
import type { RegolaDominio, TipoVoce } from "./schema";

const REGOLE: readonly IntervalloPagine[] = [[4, 377]];
const ORIGINI = [cap("capitolo-4")];
const TALENTI = [cap("capitolo-5")];
const CLASSI = [cap("capitolo-3")];
const EQUIPAGGIAMENTO = [cap("capitolo-6")];
const INCANTESIMI = [cap("capitolo-7")];
const GLOSSARIO = cap("appendice-c");

const dominio = (modulo: string, tipi: readonly TipoVoce[], pagine: readonly IntervalloPagine[]): RegolaDominio => ({ modulo, tipi, pagine });

export const CLASSI_MODULI = {
  Barbaro: "C01", Bardo: "C02", Chierico: "C03", Druido: "C04", Guerriero: "C05", Ladro: "C06",
  Mago: "C07", Monaco: "C08", Paladino: "C09", Ranger: "C10", Stregone: "C11", Warlock: "C12",
} as const;

export const fileClasse = (classe: string) =>
  `classi/${classe.toLocaleLowerCase("it")}`;

// Blocchi di E04: ogni voce della tabella Equipaggiamento d'avventura (p. 223)
// appartiene al blocco il cui inizio è l'ultimo non successivo al suo nome;
// le varianti (munizioni, focus, simboli sacri) seguono la voce madre.
export const BLOCCHI_E04 = [
  { dominio: "equipaggiamento/avventura-01", da: null },
  { dominio: "equipaggiamento/avventura-02", da: "Costume" },
  { dominio: "equipaggiamento/avventura-03", da: "Giaciglio" },
  { dominio: "equipaggiamento/avventura-04", da: "Profumo" },
] as const;

export const DOMINI: Record<string, RegolaDominio> = {
  allineamenti: dominio("V01", ["allineamento"], [cap("capitolo-2"), GLOSSARIO]),
  etichette: dominio("V05", ["etichetta"], REGOLE),
  "regole/generali": dominio("V05", ["regola"], REGOLE),
  caratteristiche: dominio("V02", ["caratteristica"], [cap("capitolo-1"), cap("capitolo-2"), GLOSSARIO]),
  abilita: dominio("V02", ["abilita"], [cap("capitolo-1"), cap("capitolo-2"), GLOSSARIO]),
  taglie: dominio("V02", ["taglia"], [cap("capitolo-1"), cap("capitolo-2"), cap("capitolo-4"), GLOSSARIO]),
  lingue: dominio("V02", ["lingua"], [cap("capitolo-2"), cap("capitolo-3"), cap("capitolo-4"), GLOSSARIO]),
  condizioni: dominio("V02", ["condizione"], [cap("capitolo-1"), GLOSSARIO]),
  "regole/caratteristiche": dominio("V02", ["regola"], REGOLE),
  background: dominio("V03", ["background"], ORIGINI),
  specie: dominio("V04", ["specie"], ORIGINI),
  lignaggi: dominio("V04", ["lignaggio"], ORIGINI),
  "talenti/origini": dominio("T01", ["talento"], TALENTI),
  "talenti/generali-a": dominio("T02A", ["talento"], TALENTI),
  "talenti/generali-b": dominio("T02B", ["talento"], TALENTI),
  "talenti/stili": dominio("T03", ["talento"], TALENTI),
  "talenti/doni-epici": dominio("T04", ["talento"], TALENTI),
  ...Object.fromEntries(Object.entries(CLASSI_MODULI).map(([classe, modulo]) =>
    [fileClasse(classe), dominio(modulo, ["classe", "sottoclasse"], CLASSI)])),
  "equipaggiamento/armi": dominio("E01", ["arma", "proprietaArma", "padronanza", "categoria"], EQUIPAGGIAMENTO),
  "regole/attacchi": dominio("E01", ["regola"], REGOLE),
  "equipaggiamento/armature": dominio("E02", ["armatura", "categoria"], EQUIPAGGIAMENTO),
  "regole/classe-armatura": dominio("E02", ["regola"], REGOLE),
  "equipaggiamento/strumenti": dominio("E03", ["strumento", "categoria"], EQUIPAGGIAMENTO),
  ...Object.fromEntries(BLOCCHI_E04.map(({ dominio: chiave }) => [chiave, dominio("E04", ["oggetto"], EQUIPAGGIAMENTO)])),
  "equipaggiamento/cavalcature-veicoli": dominio("E05", ["cavalcatura", "veicolo", "oggetto"], EQUIPAGGIAMENTO),
  "equipaggiamento/servizi": dominio("E05", ["servizio", "stileDiVita"], EQUIPAGGIAMENTO),
  "equipaggiamento/monete": dominio("E05", ["moneta", "regola"], EQUIPAGGIAMENTO),
  "regole/incantesimi": dominio("I10", ["regola"], REGOLE),
};

// I file dei blocchi di incantesimi sono creati da I00 (uno per blocco di
// incantesimi/blocchi.json) insieme ai loro file di stato.
export const dominioBloccoIncantesimi = (blocco: string) => `incantesimi/${blocco}`;
export const REGOLA_BLOCCO_INCANTESIMI = (blocco: string): RegolaDominio => dominio(blocco, ["incantesimo"], INCANTESIMI);
