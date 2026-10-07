import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { emptySheet } from "../lib/sheet.ts";
import { spellSlots, spellcastingAbility } from "../lib/spellcasting.ts";

test("C09 covers the Paladin, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C09");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Paladino").privilegi.length, 17);
  assert.deepEqual(sottoclassiDi("Paladino").map((voce) => voce.privilegi.length), [5, 5, 6, 5]);
});

test("C09 traits table p. 131 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Paladino"), []);
  assert.equal(voceClasse("Paladino").caratteristicaPrimaria, "Forza e Carisma");
  assert.equal(spellcastingAbility.Paladino, "CAR");
});

test("C09 progression table p. 132 matches proficiency bonus, Channel Divinity and half-caster slots", () => {
  assert.deepEqual(differenzeProgressione("Paladino"), []);
  const tabella = voceClasse("Paladino").tabelle.find((item) => item.titolo === "Privilegi del paladino");
  const colonna = (nome) => tabella.righe.map((riga) => riga[tabella.colonne.indexOf(nome)]);
  assert.deepEqual(colonna("Incanalare divinità"), ["—", "—", ...Array(8).fill("2"), ...Array(10).fill("3")]);
  // Slot da mezzo incantatore: la tabella coincide con spellcasting.ts#spellSlots.
  tabella.righe.forEach((riga, indice) => {
    const attesi = spellSlots({ ...emptySheet(), classe: "Paladino", livello: String(indice + 1) }).map((slot) => String(slot.maximum));
    const stampati = ["1", "2", "3", "4", "5"].map((n) => riga[tabella.colonne.indexOf(n)]).filter((cella) => cella !== "—");
    assert.deepEqual(stampati, attesi, `livello ${indice + 1}`);
  });
});

test("C09 features and oath spells match pp. 130-139", () => {
  assert.deepEqual(differenzePrivilegi("Paladino"), []);
  assert.match(privilegioManuale("Incantesimi", { classe: "Paladino", livello: 1 }).descrizione, /Carisma è la caratteristica da incantatore/);
  assert.doesNotMatch(privilegioManuale("Stile di Combattimento", { classe: "Paladino", livello: 2 }).descrizione, /· 3\n|4 · 3/);
  assert.doesNotMatch(privilegioManuale("Abiurare Nemici", { classe: "Paladino", livello: 9 }).descrizione, /GIURAMENTI IN FRANTI/);
  for (const nome of ["Giuramento degli Antichi", "Giuramento di Devozione", "Giuramento di Gloria", "Giuramento di Vendetta"]) {
    const incantesimi = sottoclassiDi("Paladino").find((voce) => voce.nome === nome).privilegi.find((item) => item.nome.startsWith("Incantesimi del"));
    assert.deepEqual(incantesimi.tabelle[0].righe.map((riga) => riga[0]), ["3", "5", "9", "13", "17"], nome);
  }
  assert.match(voceManuale("classi/paladino", "Giuramento di Vendetta").descrizione, /^Punisci i malvagi a ogni costo\n\nChi presta/);
});
