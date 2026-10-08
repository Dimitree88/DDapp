// Copertura della matrice del piano 2024 (F00): espande le righe nei valori
// dei cataloghi attuali, assegna ogni valore a un modulo e calcola l'esito
// confrontando i valori con le voci verificate dei file in lib/manuale-2024/.
import matrice from "../../docs/adeguamento-2024/matrice.json";
import regole from "../../lib/manuale-2024-domains.json";
import entita from "../../lib/manuale-2024-entities.json";
import privilegiClassi from "../../lib/class-feature-grants.json";
import privilegiSottoclassi from "../../lib/subclass-feature-grants.json";
import blocchiIncantesimi from "../../lib/manuale-2024/incantesimi/blocchi.json";
import { weaponNames } from "../../lib/weaponDetails";
import { WEAPON_PROFICIENCIES } from "../../lib/weaponProficiencyRules";
import { armorCatalog } from "../../lib/armorCatalog";
import { gearCatalog, type Gear } from "../../lib/gearCatalog";
import { spellDetails, spellNames } from "../../lib/spells";
import { emptySheet } from "../../lib/sheet";
import { availablePrivilegeChoices, grantedPrivileges } from "../../lib/characterGrants";
import { masteryEffects } from "../../lib/weaponMastery";
import { CLASSI_MODULI } from "../../lib/manuale-2024/domini";
import { FILE_MANUALE } from "../../lib/manuale-2024/registro";
import { bloccoEquipaggiamentoAvventura, bloccoIncantesimo, chiaveOrdinamento, chiaveRicerca } from "../../lib/manuale-2024/index";
import type { FileDominio, Privilegio, Voce, VoceBase } from "../../lib/manuale-2024/schema";

export type RigaMatrice = {
  id: string;
  schermata: string;
  elemento: string;
  tipo: "etichetta" | "valore" | "derivato" | "oggetto" | "incantesimo" | "app";
  apertura: string | null;
  modulo?: string;
  moduloPerValore?: "classe" | "sottoclasse" | "talento" | "incantesimo" | "oggetto";
  sorgente?: string;
  domini?: string[];
  codice?: string[];
  note?: string;
};

// «padre»: classe, sottoclasse, specie o lignaggio che contiene il privilegio o tratto.
export type ValoreMatrice = { riga: string; valore: string; modulo: string; dominio?: string; padre?: string };
export type Esito = "verificato" | "da_fare" | "aperto" | "app";

export const righe = matrice.righe as RigaMatrice[];

// Proprietà delle armi e di padronanza: Manuale del Giocatore 2024, pp. 213-214.
export const PROPRIETA_ARMI = ["A due mani", "Accurata", "Gittata", "Lancio", "Leggera", "Munizioni", "Pesante", "Portata", "Ricarica", "Versatile"] as const;
export const MONETE = ["Rame", "Argento", "Electrum", "Oro", "Platino"] as const;
export const INIZIO_T02B = "Incantatore rituale";

const classeDiSottoclasse = (sottoclasse: string) =>
  Object.entries(regole.classi as Record<string, string[]>).find(([, elenco]) => elenco.includes(sottoclasse))?.[0] ?? "";

const categoriaTalento = (nome: string) =>
  (Object.entries(regole.talenti) as [string, string[]][]).find(([, elenco]) => elenco.includes(nome))?.[0] ?? "";

// Voce madre nella tabella Equipaggiamento d'avventura (p. 223).
export function voceMadreOggetto(oggetto: Pick<Gear, "id" | "name">): string {
  if (oggetto.id.includes(":ammo:")) return "Munizioni";
  return oggetto.name.replace(/\s*\([^)]*\)$/, "");
}

type Elemento = { valore: string; classe?: string; padre?: string; livello?: number; oggetto?: Gear };

const sorgenti: Record<string, () => Elemento[]> = {
  allineamenti: () => regole.allineamenti.map((valore) => ({ valore })),
  livelli: () => regole.livelliPersonaggio.map((valore) => ({ valore })),
  classi: () => Object.keys(regole.classi).map((valore) => ({ valore, classe: valore })),
  sottoclassi: () => Object.values(regole.classi).flat().map((valore) => ({ valore, classe: classeDiSottoclasse(valore) })),
  specie: () => regole.specie.map((valore) => ({ valore })),
  lignaggi: () => Object.values(regole.lignaggi).flat().map((valore) => ({ valore })),
  background: () => regole.background.map((valore) => ({ valore })),
  taglie: () => regole.taglie.map((valore) => ({ valore })),
  lingue: () => [...regole.lingue.standard, ...regole.lingue.rare].map((valore) => ({ valore })),
  caratteristiche: () => emptySheet().caratteristiche.map((item) => ({ valore: item.nome })),
  abilita: () => emptySheet().abilita.map((item) => ({ valore: item.nome })),
  condizioni: () => entita.conditions.map((valore) => ({ valore })),
  talenti: () => Object.values(regole.talenti).flat().map((valore) => ({ valore })),
  categorieArmature: () => ["Leggere", "Medie", "Pesanti", "Scudi"].map((valore) => ({ valore })),
  competenzeArmi: () => [...WEAPON_PROFICIENCIES, ...weaponNames].map((valore) => ({ valore })),
  armi: () => weaponNames.map((valore) => ({ valore })),
  armature: () => armorCatalog.map((item) => ({ valore: item.name })),
  strumenti: () => gearCatalog.filter((item) => item.tool).map((item) => ({ valore: item.name, oggetto: item })),
  oggetti: () => gearCatalog.map((item) => ({ valore: item.name, oggetto: item })),
  proprietaPadronanze: () => [...PROPRIETA_ARMI, ...Object.keys(masteryEffects)].map((valore) => ({ valore })),
  monete: () => MONETE.map((valore) => ({ valore })),
  cavalcatureServizi: () => [...entita.mounts, ...entita.vehicles, ...entita.lifestyles, ...entita.services].map((valore) => ({ valore })),
  incantesimi: () => spellNames.map((valore) => ({ valore, livello: spellDetails(valore)?.livello })),
  privilegiClasse: () => Object.entries(privilegiClassi as Record<string, { name: string }[]>)
    .flatMap(([classe, elenco]) => elenco.map((item) => ({ valore: item.name, classe, padre: classe }))),
  privilegiSottoclasse: () => Object.entries(privilegiSottoclassi as Record<string, { name: string }[]>)
    .flatMap(([sottoclasse, elenco]) => elenco.map((item) => ({ valore: item.name, classe: classeDiSottoclasse(sottoclasse), padre: sottoclasse }))),
  trattiSpecie: () => regole.specie.flatMap((specie) => [undefined, ...((regole.lignaggi as Record<string, string[]>)[specie] ?? [])]
    .flatMap((lignaggio) => grantedPrivileges({ ...emptySheet(), livello: "20", specie, lignaggio: lignaggio ?? "" })
      .filter((grant) => grant.source.startsWith(lignaggio ? "Lignaggio:" : "Specie:"))
      .map((grant) => ({ valore: grant.name, ...(lignaggio ? {} : { padre: specie }) })))),
  sceltePrivilegi: () => Object.keys(regole.classi).flatMap((classe) =>
    availablePrivilegeChoices({ ...emptySheet(), classe, livello: "20" }).map((valore) => ({ valore, classe }))),
};

export const SORGENTI = Object.keys(sorgenti);

function modulo(riga: RigaMatrice, elemento: Elemento): { modulo: string; dominio?: string } {
  if (riga.modulo) return { modulo: riga.modulo };
  switch (riga.moduloPerValore) {
    case "classe": case "sottoclasse":
      return { modulo: (CLASSI_MODULI as Record<string, string>)[elemento.classe ?? ""] ?? "" };
    case "talento": {
      const categoria = categoriaTalento(elemento.valore);
      if (categoria === "origini") return { modulo: "T01", dominio: "talenti/origini" };
      if (categoria === "stileDiCombattimento") return { modulo: "T03", dominio: "talenti/stili" };
      if (categoria === "donoEpico") return { modulo: "T04", dominio: "talenti/doni-epici" };
      if (categoria !== "generali") return { modulo: "" };
      return chiaveOrdinamento(elemento.valore) < chiaveOrdinamento(INIZIO_T02B)
        ? { modulo: "T02A", dominio: "talenti/generali-a" } : { modulo: "T02B", dominio: "talenti/generali-b" };
    }
    case "incantesimo": {
      const blocco = elemento.livello === undefined ? null : bloccoIncantesimo(elemento.livello, elemento.valore);
      return blocco ? { modulo: blocco, dominio: `incantesimi/${blocco}` } : { modulo: "" };
    }
    case "oggetto":
      if (!elemento.oggetto) return { modulo: "" };
      if (elemento.oggetto.tool) return { modulo: "E03", dominio: "equipaggiamento/strumenti" };
      return { modulo: "E04", dominio: bloccoEquipaggiamentoAvventura(voceMadreOggetto(elemento.oggetto)) };
    default:
      return { modulo: "" };
  }
}

export function espandiValori(): ValoreMatrice[] {
  return righe.flatMap((riga) => {
    if (!riga.sorgente) return [];
    const elenca = sorgenti[riga.sorgente];
    if (!elenca) throw new Error(`Sorgente sconosciuta nella riga ${riga.id}: ${riga.sorgente}`);
    return elenca().map((elemento) => ({ riga: riga.id, valore: elemento.valore, ...(elemento.padre ? { padre: elemento.padre } : {}), ...modulo(riga, elemento) }));
  });
}

export const moduliBlocchiIncantesimi = blocchiIncantesimi.blocchi.map((blocco) => blocco.id);

const annidate = (voce: Voce): Privilegio[] =>
  voce.tipo === "classe" || voce.tipo === "sottoclasse" ? voce.privilegi
    : voce.tipo === "specie" || voce.tipo === "lignaggio" ? voce.tratti ?? [] : [];

// Voci di un file, compresi privilegi e tratti annidati.
function vociDelFile(file: FileDominio): VoceBase[] {
  return [...file.etichette, ...file.voci, ...file.voci.flatMap(annidate)];
}

export function vociDelModulo(modulo: string, files: Record<string, FileDominio> = FILE_MANUALE): VoceBase[] {
  return Object.values(files).filter((file) => file.modulo === modulo).flatMap(vociDelFile);
}

const nomiVoce = (voce: VoceBase) => [voce.nome, ...(voce.alias ?? [])].map(chiaveRicerca);

const conNome = (nome: string) => (voce: VoceBase) => nomiVoce(voce).includes(chiaveRicerca(nome));

export function esitoValore(valore: ValoreMatrice, files: Record<string, FileDominio> = FILE_MANUALE): Esito {
  const delModulo = Object.values(files).filter((file) => file.modulo === valore.modulo);
  const voci = valore.padre
    ? delModulo.flatMap((file) => file.voci.filter(conNome(valore.padre!))).flatMap(annidate).filter(conNome(valore.valore))
    : delModulo.flatMap(vociDelFile).filter(conNome(valore.valore));
  if (voci.some((voce) => voce.verifica.stato === "aperta")) return "aperto";
  return voci.some((voce) => voce.verifica.stato === "verificata") ? "verificato" : "da_fare";
}

// Etichette e calcoli sono coperti dalle voci che citano la riga in «righeMatrice».
// Etichette, calcoli e oggetti singoli (non da sorgente) sono coperti dalle voci che citano la riga in «righeMatrice».
const richiedeVoceDiRiga = (riga: RigaMatrice) => (riga.tipo === "etichetta" || riga.tipo === "derivato" || riga.tipo === "oggetto") && !riga.sorgente;

function esitoVociDiRiga(riga: RigaMatrice, files: Record<string, FileDominio>): Esito {
  const voci = vociDelModulo(riga.modulo ?? "", files).filter((voce) => voce.righeMatrice?.includes(riga.id));
  if (voci.some((voce) => voce.verifica.stato === "aperta")) return "aperto";
  return voci.some((voce) => voce.verifica.stato === "verificata") ? "verificato" : "da_fare";
}

export function esitoRiga(riga: RigaMatrice, files: Record<string, FileDominio> = FILE_MANUALE): Esito {
  if (riga.tipo === "app") return "app";
  const esiti: Esito[] = [];
  if (riga.sorgente) esiti.push(...espandiValori().filter((valore) => valore.riga === riga.id).map((valore) => esitoValore(valore, files)));
  if (richiedeVoceDiRiga(riga)) esiti.push(esitoVociDiRiga(riga, files));
  if (esiti.includes("aperto")) return "aperto";
  return esiti.length > 0 && esiti.every((esito) => esito === "verificato") ? "verificato" : "da_fare";
}

export type CoperturaModulo = {
  modulo: string;
  valori: { totale: number; verificati: number; mancanti: string[]; aperti: string[] };
  righe: { totale: number; verificate: number; mancanti: string[]; aperte: string[] };
};

// Valori assegnati al modulo ed etichette o calcoli di sua proprietà.
export function coperturaModulo(modulo: string, files: Record<string, FileDominio> = FILE_MANUALE): CoperturaModulo {
  // Lo stesso valore mostrato da più righe conta una sola volta.
  const valori = [...new Map(espandiValori().filter((valore) => valore.modulo === modulo)
    .map((valore) => [`${valore.padre ?? ""}|${chiaveRicerca(valore.valore)}`, valore])).values()];
  const esitiValori = valori.map((valore) => ({ valore, esito: esitoValore(valore, files) }));
  const proprie = righe.filter((riga) => riga.modulo === modulo && richiedeVoceDiRiga(riga));
  const esitiRighe = proprie.map((riga) => ({ riga, esito: esitoVociDiRiga(riga, files) }));
  const etichettaValore = ({ valore }: { valore: ValoreMatrice }) => `${valore.padre ? `${valore.padre}: ` : ""}${valore.valore} (${valore.riga})`;
  return {
    modulo,
    valori: {
      totale: valori.length,
      verificati: esitiValori.filter((item) => item.esito === "verificato").length,
      mancanti: esitiValori.filter((item) => item.esito === "da_fare").map(etichettaValore),
      aperti: esitiValori.filter((item) => item.esito === "aperto").map(etichettaValore),
    },
    righe: {
      totale: proprie.length,
      verificate: esitiRighe.filter((item) => item.esito === "verificato").length,
      mancanti: esitiRighe.filter((item) => item.esito === "da_fare").map((item) => item.riga.id),
      aperte: esitiRighe.filter((item) => item.esito === "aperto").map((item) => item.riga.id),
    },
  };
}
