import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";

test("converts legacy armor, checkboxes and spell flags without changing other data", () => {
  const old = {
    ...emptySheet(),
    classeArmatura: "14 (12 cuoio borchiato + 2 Destrezza)",
    scudo: "no",
    ispirazioneEroica: "sì (da Umano)",
    lingue: "Comune, Draconico",
    competenzeArmi: "Semplici; Da guerra",
    incantesimi: [{
      livello: "1", nome: "Passo veloce", tempo: "Azione", gittata: "Contatto",
      componenti: "V, S, M (pizzico di terriccio)", durata: "1 ora", crm: "C", note: "testo completo",
    }],
  };
  delete old.noteClasseArmatura;
  const sheet = normalizeSheet(old);
  assert.equal(sheet.classeArmatura, 14);
  assert.equal(sheet.noteClasseArmatura, "12 cuoio borchiato + 2 Destrezza");
  assert.equal(sheet.scudo, false);
  assert.equal(sheet.ispirazioneEroica, true);
  assert.deepEqual(sheet.lingue, ["Comune", "Draconico"]);
  assert.deepEqual(sheet.competenzeArmi, ["Semplici", "Da guerra"]);
  assert.deepEqual(
    [sheet.incantesimi[0].concentrazione, sheet.incantesimi[0].rituale, sheet.incantesimi[0].materiali],
    [true, false, true],
  );
  assert.equal(sheet.incantesimi[0].componenti, old.incantesimi[0].componenti);
  assert.equal(sheet.incantesimi[0].note, old.incantesimi[0].note);
  assert.deepEqual(normalizeSheet(sheet), sheet);
});

test("keeps an unrecognized armor value in the notes", () => {
  const sheet = normalizeSheet({ ...emptySheet(), classeArmatura: "CA variabile" });
  assert.equal(sheet.classeArmatura, null);
  assert.equal(sheet.noteClasseArmatura, "CA variabile");
});
