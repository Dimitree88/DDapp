import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { characters } from "../lib/db/schema";
import { emptySheet, type Sheet } from "../lib/sheet";
import { hashPin } from "../lib/auth";

const EPHEMER_ID = "ephemer";
const EPHEMER_PIN = "0000";

function ephemerSheet(): Sheet {
  const s = emptySheet();

  // Stato
  s.livello = "2";
  s.classe = "RANGER";
  s.puntiFerita = "16";
  s.puntiFeritaMax = "16";
  s.classeArmatura = "14 (12 cuoio borchiato + 2 Destrezza)";
  s.scudo = "no";
  s.iniziativa = "+2";
  s.bonusCompetenza = "+2";
  s.percezionePassiva = "15";
  s.dadiVita = "2d10";
  s.ispirazioneEroica = "sì (da Umano)";
  s.puntiEsperienza = "0";

  // Identità
  s.specie = "UMANO — ispirazione eroica, un'abilità, un talento";
  s.background = "EREMITA — talento Guaritore, abilità Medicina e Religione";
  s.allineamento = "CAOTICO NEUTRALE";
  s.velocita = "9 m";
  s.taglia = "M";
  s.lingue =
    "Comune; Draconico (da Eremita); Primordiale (da Liv. 2); Sottocomune mercanti (da Liv. 2)";

  // Caratteristiche
  s.caratteristiche = [
    { nome: "FORZA", abbr: "FOR", valore: "9", modificatore: "-1", tsBonus: "+1", tsCompetente: true },
    { nome: "DESTREZZA", abbr: "DES", valore: "15", modificatore: "+2", tsBonus: "+4", tsCompetente: true },
    { nome: "COSTITUZIONE", abbr: "COS", valore: "11", modificatore: "0", tsBonus: "0", tsCompetente: false },
    { nome: "INTELLIGENZA", abbr: "INT", valore: "14", modificatore: "+2", tsBonus: "+2", tsCompetente: false },
    { nome: "SAGGEZZA", abbr: "SAG", valore: "16", modificatore: "+3", tsBonus: "+3", tsCompetente: false },
    { nome: "CARISMA", abbr: "CAR", valore: "13", modificatore: "+1", tsBonus: "+1", tsCompetente: false },
  ];

  // Abilità
  s.abilita = [
    { nome: "ATLETICA", caratteristica: "FOR", competente: false, bonus: "-1", note: "" },
    { nome: "ACROBAZIA", caratteristica: "DES", competente: false, bonus: "+2", note: "" },
    { nome: "FURTIVITÀ", caratteristica: "DES", competente: true, bonus: "+4", note: "da Ranger" },
    { nome: "RAPIDITÀ DI MANO", caratteristica: "DES", competente: false, bonus: "+2", note: "" },
    { nome: "ARCANO", caratteristica: "INT", competente: false, bonus: "+2", note: "" },
    { nome: "INDAGARE", caratteristica: "INT", competente: false, bonus: "+2", note: "" },
    { nome: "NATURA", caratteristica: "INT", competente: true, bonus: "+4", note: "da Ranger" },
    { nome: "RELIGIONE", caratteristica: "INT", competente: true, bonus: "+4", note: "da Eremita" },
    { nome: "STORIA", caratteristica: "INT", competente: false, bonus: "+2", note: "" },
    { nome: "ADDESTRARE ANIMALI", caratteristica: "SAG", competente: false, bonus: "+3", note: "" },
    { nome: "INTUIZIONE", caratteristica: "SAG", competente: true, bonus: "+5", note: "da Umano" },
    { nome: "MEDICINA", caratteristica: "SAG", competente: true, bonus: "+5", note: "da Eremita" },
    { nome: "PERCEZIONE", caratteristica: "SAG", competente: true, bonus: "+5", note: "da Ranger" },
    { nome: "SOPRAVVIVENZA", caratteristica: "SAG", competente: false, bonus: "+3", note: "" },
    { nome: "INGANNO", caratteristica: "CAR", competente: false, bonus: "+1", note: "" },
    { nome: "INTIMIDIRE", caratteristica: "CAR", competente: false, bonus: "+1", note: "" },
    { nome: "INTRATTENERE", caratteristica: "CAR", competente: false, bonus: "+1", note: "" },
    { nome: "PERSUASIONE", caratteristica: "CAR", competente: true, bonus: "+3", note: "da Liv. 2 (espl. esperto)" },
  ];

  // Competenze
  s.competenzeArmi = "Semplici, Da guerra";
  s.competenzeArmatura = { leggere: true, medie: true, pesanti: false, scudi: true };

  // Armi
  s.armi = [
    { nome: "ARCO CORTO", quantita: "", bonus: "+4", danno: "1d6 perforante (+2 da talento Tiro)", gittata: "24 m, poi svantaggio fino a 96 m", provenienza: "da Ranger", note: "" },
    { nome: "FRECCE", quantita: "16", bonus: "", danno: "", gittata: "", provenienza: "da Ranger (20 iniziali)", note: "" },
    { nome: "FRECCE D'ARGENTO", quantita: "4", bonus: "+1", danno: "", gittata: "", provenienza: "da Sessione #2", note: "" },
    { nome: "SPADA CORTA", quantita: "", bonus: "+1", danno: "1d6 perforante", gittata: "mischia", provenienza: "da Ranger", note: "" },
    { nome: "SCIMITARRA", quantita: "", bonus: "+1", danno: "1d6 tagliente", gittata: "mischia", provenienza: "da Ranger", note: "" },
    { nome: "BASTONE FERRATO", quantita: "", bonus: "+1", danno: "1d6 contundente", gittata: "mischia", provenienza: "da Eremita", note: "" },
  ];

  // Equipaggiamento
  s.equipaggiamento = [
    { nome: "Armatura di cuoio borchiato", dettaglio: "Classe armatura 12", provenienza: "da Ranger" },
    { nome: "Focus druidico (rametto di vischio)", dettaglio: "", provenienza: "da Ranger" },
    { nome: "Sconto 20% su oggetti non magici", dettaglio: "", provenienza: "da Umano (talento Lavoro Manuale)" },
    { nome: "Giaciglio x2", dettaglio: "", provenienza: "1 da Ranger, 1 da Eremita" },
    { nome: "Abiti da viaggiatore", dettaglio: "", provenienza: "da Eremita" },
    { nome: "Lampada a olio", dettaglio: "3 + 2 ampolle", provenienza: "da Eremita + Ranger" },
    { nome: "Borsa da erborista", dettaglio: "CD 10 per identificare una pianta; creazione: antitossina, candela, borsa del guaritore, pozione di guarigione", provenienza: "da Eremita" },
    { nome: "Libro di filosofia", dettaglio: '"X NEVER MARKS THE SPOT"', provenienza: "da Eremita" },
    { nome: "Pozione di guarigione", dettaglio: "+5 punti ferita", provenienza: "da Sessione #1" },
    { nome: "Razioni giornaliere", dettaglio: "x9", provenienza: "da Ranger (dotazione esploratore)" },
    { nome: "Corda", dettaglio: "", provenienza: "da Ranger" },
    { nome: "Acciarino e pietra focaia", dettaglio: "", provenienza: "da Ranger" },
    { nome: "Torce", dettaglio: "x10", provenienza: "da Ranger" },
    { nome: "Otre", dettaglio: "", provenienza: "da Ranger" },
  ];

  // Privilegi
  s.privilegi = [
    {
      titolo: "Livello 1 (competenza +2)",
      descrizione:
        "Incantesimi; nemico prescelto (acquisito incantesimo Marchio del Cacciatore); padronanza d'armi (arco e spada). Nemici prescelti: 2. Incantesimi preparati: 2. Slot: 2 di liv. 1.",
    },
    {
      titolo: "Livello 2 (competenza +2)",
      descrizione:
        "Esploratore esperto (scelto +2 a un'abilità); stile di combattimento (scelto Tiro). Nemici prescelti: 2. Incantesimi preparati: 3. Slot: 2 di liv. 1.",
    },
  ];

  // Talenti
  s.talenti = [
    {
      nome: "GUARITORE (da Eremita)",
      descrizione:
        "Talento Origini. Medico combattente: con una borsa del guaritore puoi consumarne un uso (azione Utilizzo) per curare una creatura entro 1,5 m; questa spende un Dado Vita e recupera PF pari al tiro + il tuo bonus di competenza. Tiro ripetuto per guarigione: se ottieni 1 su un dado di guarigione puoi ripetere il tiro (usi il nuovo risultato).",
    },
    {
      nome: "LAVORO MANUALE (da Umano)",
      descrizione:
        "Competenza in 3 strumenti da artigiano scelti: falegname, fabbro, inventore. Fabbricazione rapida dopo un riposo (se hai gli strumenti adatti e la competenza).",
    },
    {
      nome: "TIRO (da Livello 2)",
      descrizione:
        "Talento stile di combattimento. +2 ai tiri per colpire con le armi a distanza.",
    },
  ];

  // Incantesimi
  s.incantesimi = [
    {
      livello: "1",
      nome: "CURA FERITE",
      tempo: "Azione",
      gittata: "Contatto",
      componenti: "V, S",
      durata: "Istantanea",
      crm: "",
      note: "Una creatura toccata recupera 2d8 + il modificatore da incantatore. +2d8 per ogni slot di livello superiore al 1°.",
    },
    {
      livello: "1",
      nome: "PASSO VELOCE",
      tempo: "Azione",
      gittata: "Contatto",
      componenti: "V, S, M (pizzico di terriccio)",
      durata: "1 ora",
      crm: "",
      note: "La creatura toccata aumenta la velocità di 3 m. Una creatura aggiuntiva per ogni slot di livello superiore al 1°.",
    },
    {
      livello: "1",
      nome: "MARCHIO DEL CACCIATORE",
      tempo: "Azione bonus (2 volte senza spendere slot)",
      gittata: "27 m",
      componenti: "V",
      durata: "Concentrazione, fino a 1 ora",
      crm: "C",
      note: "Marchi una creatura visibile: +1d6 danni da forza ogni volta che la colpisci; vantaggio alle prove di Percezione/Sopravvivenza per trovarla. Se va a 0 PF, sposti il marchio con un'azione bonus. Concentrazione più lunga con slot superiori.",
    },
  ];

  // Monete
  s.monete = { rame: "", argento: "", electrum: "", oro: "45", platino: "" };

  s.note = "";

  return s;
}

async function main() {
  const existing = await db.select().from(characters).where(eq(characters.id, EPHEMER_ID));
  if (existing.length > 0) {
    console.log("EPHEMER esiste già, salto il seed.");
    return;
  }
  await db.insert(characters).values({
    id: EPHEMER_ID,
    name: "Ephemer",
    pinHash: hashPin(EPHEMER_PIN),
    data: ephemerSheet(),
  });
  console.log(`Inserito personaggio "Ephemer" (PIN: ${EPHEMER_PIN}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
