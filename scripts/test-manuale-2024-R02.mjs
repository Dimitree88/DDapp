import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { buildTemplatePdf } from "../lib/exportTemplatePdf.ts";
import { grantFunctionalDetails, featFunctionalDetails } from "../lib/functionalDetails.ts";
import { grantedPrivileges } from "../lib/characterGrants.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const template = new Uint8Array(await readFile(root + "public/scheda-template.pdf"));
const font = new Uint8Array(await readFile(root + "public/pdf-font.otf"));

function barbaro() {
  const base = emptySheet();
  return normalizeSheet({
    ...base,
    livello: "5",
    classe: "Barbaro",
    sottoclasse: "Cammino del Berserker",
    specie: "Nano",
    background: "Soldato",
    allineamento: "Caotico neutrale",
    puntiFeritaMax: "47",
    velocita: "7,5",
    taglia: "Media",
    caratteristiche: base.caratteristiche.map((c) =>
      ({ ...c, valore: c.abbr === "FOR" ? "16" : c.abbr === "COS" ? "15" : "12" })),
    competenzeArmi: ["Semplici", "Da guerra"],
    armi: [{ nome: "Ascia bipenne", quantita: "1", bonus: "", note: "" }],
    equipaggiamento: [{ nome: "Corazza di maglia", dettaglio: "" }, { nome: "Razioni", quantita: "10", dettaglio: "" }],
    talenti: [{ nome: "Robusto", scelte: "" }],
    incantesimi: [],
  });
}

test("R02 the character sheet export stays within the two-page template", async () => {
  const bytes = await buildTemplatePdf("Thorin", barbaro(), template, font);
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 2, "l'export non deve aggiungere una terza pagina");
});

test("R02 legacy sheets migrate on read and export without error", async () => {
  // Scheda vecchia: regole dentro i dati, campi stringa, note legacy.
  const legacy = {
    ...emptySheet(),
    livello: "3",
    classe: "Ranger",
    classeArmatura: "14 (12 cuoio borchiato + 2 Destrezza)",
    scudo: "no",
    ispirazioneEroica: "sì (da Umano)",
    lingue: "Comune, Draconico",
    competenzeArmi: "Semplici; Da guerra",
    abilita: [{ nome: "MEDICINA", caratteristica: "SAG", competente: true, bonus: "+5", note: "da Eremita" }],
    privilegi: [{ titolo: "Livello 2", descrizione: "Stile di combattimento (scelto Tiro)." }],
    talenti: [{ nome: "Lavoro manuale", descrizione: "Competenza in 3 strumenti: falegname, fabbro, inventore." }],
  };
  const sheet = normalizeSheet(legacy);
  // La migrazione è idempotente e non reintroduce campi legacy.
  assert.deepEqual(normalizeSheet(sheet), sheet);
  const bytes = await buildTemplatePdf("Legacy", sheet, template, font);
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 2);
});

test("R02 export box summaries come from the 2024 manual, not invented text", () => {
  const sheet = barbaro();
  // Talento: nessun promemoria operativo per «Robusto» → testo dal manuale.
  const robusto = featFunctionalDetails("Robusto", sheet);
  assert.ok(robusto.full, "testo integrale del talento assente");
  assert.match(robusto.full, /punti ferita massimi/);
  assert.ok(robusto.summary, "sintesi del talento assente");

  // Ogni privilegio concesso dalla classe ha una sintesi derivata dal manuale.
  const grants = grantedPrivileges(sheet).filter((g) => !g.source.startsWith("Specie:") && !g.source.startsWith("Lignaggio:"));
  assert.ok(grants.length > 0);
  for (const grant of grants) {
    const { summary, full } = grantFunctionalDetails(grant, sheet);
    // full proviene dal manuale quando la voce è verificata; la sintesi non
    // deve mai essere una stringa vuota se c'è contenuto.
    if (full) assert.ok(full.length > 10, `${grant.name}: testo manuale troppo corto`);
    if (summary !== null) assert.ok(summary.trim().length > 0, `${grant.name}: sintesi vuota`);
  }
});

test("R02 introduces no persisted manual data: stored sheet is personal-only", () => {
  // Le sintesi del manuale sono derivate a render/export, mai salvate.
  const sheet = barbaro();
  const salvabile = JSON.stringify(normalizeSheet(sheet));
  assert.ok(!salvabile.includes("punti ferita massimi"), "il testo del manuale non deve finire nei dati salvati");
});
