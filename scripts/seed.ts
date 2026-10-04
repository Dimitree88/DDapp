import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { characters } from "../lib/db/schema";
import { emptySheet, type Sheet } from "../lib/sheet";
import { hashPin } from "../lib/auth";

const EPHEMER_ID = "ephemer";
const EPHEMER_PIN = "0000";

function ephemerSheet(): Sheet {
  const sheet = emptySheet();
  Object.assign(sheet, {
    livello: "2", classe: "Ranger", puntiFerita: "16", puntiFeritaMax: "16",
    classeArmatura: 14, iniziativa: "+2", bonusCompetenza: "+2",
    percezionePassiva: "15", dadiVita: "2d10", ispirazioneEroica: true,
    puntiEsperienza: "0", specie: "Umano", background: "Eremita",
    allineamento: "Caotico neutrale", velocita: "9", taglia: "Media",
    lingue: ["Comune", "Draconico", "Primordiale", "Sottocomune"],
    noteLingue: "Mercanti",
  });
  const scores = [
    ["9", "-1", "+1", true], ["15", "+2", "+4", true],
    ["11", "0", "0", false], ["14", "+2", "+2", false],
    ["16", "+3", "+3", false], ["13", "+1", "+1", false],
  ] as const;
  sheet.caratteristiche = sheet.caratteristiche.map((item, index) => ({
    ...item, valore: scores[index][0], modificatore: scores[index][1],
    tsBonus: scores[index][2], tsCompetente: scores[index][3],
  }));
  const proficient = new Set(["FURTIVITÀ", "NATURA", "RELIGIONE", "INTUIZIONE", "MEDICINA", "PERCEZIONE", "PERSUASIONE"]);
  sheet.abilita = sheet.abilita.map((item) => ({
    ...item, competente: proficient.has(item.nome), maestria: item.nome === "INTUIZIONE",
  }));
  sheet.competenzeArmi = ["Armi semplici", "Armi da guerra"];
  sheet.competenzeArmatura = { leggere: true, medie: true, pesanti: false, scudi: true };
  sheet.armi = [
    { nome: "Arco corto", quantita: "", bonus: "+4", note: "Bonus al tiro per colpire: +2 da talento Tiro" },
    { nome: "Spada corta", quantita: "", bonus: "+1", note: "" },
    { nome: "Scimitarra", quantita: "", bonus: "+1", note: "" },
    { nome: "Bastone ferrato", quantita: "", bonus: "+1", note: "" },
  ];
  sheet.equipaggiamento = [
    { nome: "Armatura di cuoio borchiato", dettaglio: "" },
    { nome: "Focus druidico (rametto di vischio)", dettaglio: "" },
    { nome: "Giaciglio x2", dettaglio: "" },
    { nome: "Abiti da viaggiatore", dettaglio: "" },
    { nome: "Lampada a olio", dettaglio: "3 + 2 ampolle" },
    { nome: "Borsa da erborista", dettaglio: "" },
    { nome: "Libro di filosofia", dettaglio: '"X NEVER MARKS THE SPOT"' },
    { nome: "Pozione di guarigione", dettaglio: "+5 punti ferita" },
    { nome: "Razioni giornaliere", dettaglio: "x9" },
    { nome: "Corda", dettaglio: "" },
    { nome: "Acciarino e pietra focaia", dettaglio: "" },
    { nome: "Torce", dettaglio: "x10" },
    { nome: "Otre", dettaglio: "" },
    { nome: "Frecce x16", dettaglio: "" },
    { nome: "Frecce d'argento x4", dettaglio: "Bonus: +1" },
  ];
  sheet.privilegi = [
    { titolo: "Padronanza d'armi", scelte: "arco e spada" },
    { titolo: "Esploratore esperto", scelte: "Maestria: Intuizione" },
    { titolo: "Stile di combattimento", scelte: "Tiro" },
    { titolo: "Nemico prescelto", scelte: "Marchio del Cacciatore: 2 volte senza spendere slot" },
  ];
  sheet.talenti = [
    { nome: "Guaritore", scelte: "" },
    { nome: "Lavoro manuale", scelte: "falegname, fabbro, inventore" },
    { nome: "Tiro", scelte: "" },
  ];
  sheet.incantesimi = [
    { nome: "CURA FERITE" }, { nome: "PASSO VELOCE" }, { nome: "MARCHIO DEL CACCIATORE" },
  ];
  sheet.monete.oro = "45";
  return sheet;
}

async function main() {
  const existing = await db.select().from(characters).where(eq(characters.id, EPHEMER_ID));
  if (existing.length > 0) {
    console.log("Ephemer esiste già, salto il seed.");
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

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
