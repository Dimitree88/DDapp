import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";

test("legacy resource recharge labels become editable text without a closed domain", () => {
  const resource = { nome: "Riserva", fonte: "Privilegio", massimo: 2, spesi: 0, ricarica: "breve" };
  const sheet = normalizeSheet({ ...emptySheet(), risorse: [resource] });
  assert.equal(sheet.risorse[0].ricarica, "Riposo breve");
  sheet.risorse[0].ricarica = "Quando termina una scena";
  assert.deepEqual(domainErrors(sheet), []);
  assert.deepEqual(normalizeSheet(sheet), sheet);
});

test("moves legacy rules out of character data while preserving personal choices", () => {
  const old = {
    ...emptySheet(),
    classeArmatura: "14 (12 cuoio borchiato + 2 Destrezza)",
    scudo: "no",
    ispirazioneEroica: "sì (da Umano)",
    lingue: "Comune, Draconico",
    competenzeArmi: "Semplici; Da guerra",
    noteLingue: "Draconico (da Eremita)",
    abilita: [{ nome: "MEDICINA", caratteristica: "SAG", competente: true, bonus: "+5", note: "da Eremita" }],
    armi: [{ nome: "Arco corto", quantita: "", bonus: "+4", danno: "1d6 perforante (+2 da talento Tiro)", gittata: "24 m", provenienza: "da Ranger", note: "" }],
    equipaggiamento: [{ nome: "Borsa da erborista", dettaglio: "CD 10 per identificare una pianta; creazione: antitossina", provenienza: "da Eremita" }],
    privilegi: [{ titolo: "Livello 2 (competenza +2)", descrizione: "Esploratore esperto (scelto +2 a un'abilità); stile di combattimento (scelto Tiro)." }],
    talenti: [{ nome: "Lavoro manuale", descrizione: "Provenienza: da Umano\nCompetenza in 3 strumenti da artigiano scelti: falegname, fabbro, inventore. Fabbricazione rapida." }],
    incantesimi: [{ nome: "Marchio del Cacciatore", livello: "1", tempo: "Azione bonus (2 volte senza spendere slot)", gittata: "27 m", note: "regola" }],
  };
  const sheet = normalizeSheet(old);
  assert.equal(sheet.classeArmatura, 14);
  assert.equal(Object.hasOwn(sheet, "noteClasseArmatura"), false);
  assert.equal(sheet.scudo, false);
  assert.equal(sheet.ispirazioneEroica, true);
  assert.deepEqual(sheet.lingue, ["Comune", "Draconico"]);
  assert.deepEqual(sheet.competenzeArmi, ["Semplici", "Da guerra"]);
  assert.equal(sheet.noteLingue, "");
  assert.deepEqual(sheet.abilita[0], { nome: "MEDICINA", caratteristica: "SAG", competente: true, maestria: false });
  assert.deepEqual(sheet.armi[0], { nome: "Arco corto", quantita: "1", bonus: "+4", note: "Bonus al tiro per colpire: +2 da talento Tiro" });
  assert.deepEqual(sheet.equipaggiamento[0], { nome: "Borsa da erborista", dettaglio: "" });
  assert.deepEqual(sheet.privilegi, [
    { titolo: "Esploratore esperto", scelte: "Abilità scelta non indicata" },
    { titolo: "Stile di combattimento", scelte: "Tiro" },
    { titolo: "Nemico prescelto", scelte: "Marchio del Cacciatore: 2 volte senza spendere slot" },
  ]);
  assert.deepEqual(sheet.talenti[0], { nome: "Lavoro manuale", scelte: "falegname, fabbro, inventore" });
  assert.deepEqual(sheet.incantesimi[0], { nome: "Marchio del cacciatore" });
  assert.deepEqual(normalizeSheet(sheet), sheet);
});

test("drops the removed armor note field from older sheets", () => {
  const sheet = normalizeSheet({ ...emptySheet(), classeArmatura: "CA variabile", noteClasseArmatura: "Vecchia nota" });
  assert.equal(sheet.classeArmatura, null);
  assert.equal(Object.hasOwn(sheet, "noteClasseArmatura"), false);
});

test("removes retired combat fields from saved sheets", () => {
  const old = {
    ...emptySheet(),
    puntiFeritaTemporanei: "5",
    dadiVitaSpesi: "2",
    tiriMorte: { successi: 1, fallimenti: 2 },
    condizioni: ["Prono"],
    puntiFeritaMaxModo: "manuale",
    incrementiPf: [],
    classeArmaturaModo: "manuale",
    velocitaModo: "manuale",
    modificatoriVelocita: [],
  };
  const sheet = normalizeSheet(old);
  for (const key of ["puntiFeritaTemporanei", "dadiVitaSpesi", "tiriMorte", "condizioni", "puntiFeritaMaxModo", "incrementiPf", "classeArmaturaModo", "velocitaModo", "modificatoriVelocita"]) {
    assert.equal(Object.hasOwn(sheet, key), false, key);
  }
  assert.deepEqual(normalizeSheet(sheet), sheet);
});
