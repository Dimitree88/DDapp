import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { etichettaManuale, privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { spellcastingAbility } from "../lib/spellcasting.ts";

test("C11 covers the Sorcerer, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C11");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Stregone").privilegi.length, 10);
  assert.deepEqual(sottoclassiDi("Stregone").map((voce) => voce.privilegi.length), [6, 5, 5, 5]);
});

test("C11 traits table p. 151 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Stregone"), []);
  assert.equal(voceClasse("Stregone").caratteristicaPrimaria, "Carisma");
  assert.equal(spellcastingAbility.Stregone, "CAR");
  assert.deepEqual(voceClasse("Stregone").competenze.armature, []);
});

test("C11 progression table p. 152 matches sorcery points, cantrips and full-caster slots", () => {
  assert.deepEqual(differenzeProgressione("Stregone"), []);
  const tabella = voceClasse("Stregone").tabelle.find((item) => item.titolo === "Privilegi dello stregone");
  const colonna = (nome) => tabella.righe.map((riga) => riga[tabella.colonne.indexOf(nome)]);
  assert.deepEqual(colonna("Punti stregoneria"), ["—", ...Array.from({ length: 19 }, (_, i) => String(i + 2))]);
  assert.deepEqual(colonna("Trucchetti"), [...Array(3).fill("4"), ...Array(6).fill("5"), ...Array(11).fill("6")]);
  assert.deepEqual(tabella.righe[19].slice(tabella.colonne.indexOf("1")), ["4", "3", "3", "3", "3", "2", "2", "1", "1"]);
});

test("C11 features, metamagic and wild-magic surges match pp. 150-163", () => {
  assert.deepEqual(differenzePrivilegi("Stregone"), []);
  assert.match(privilegioManuale("Incantesimi", { classe: "Stregone", livello: 1 }).descrizione, /Carisma è la caratteristica da incantatore/);
  // Metamagia come etichetta (pp. 153-154), 10 opzioni.
  assert.match(etichettaManuale("Opzioni di metamagia").descrizione, /INCANTESIMO CELATO/);
  assert.match(etichettaManuale("Metamagia").descrizione, /INCANTESIMO TRASMUTATO/);
  // Tabella d100 degli Impulsi di magia selvaggia (25 righe).
  const impulso = privilegioManuale("Impulso di Magia Selvaggia", { classe: "Stregone", sottoclasse: "Stregoneria della Magia Selvaggia", livello: 3 });
  assert.equal(impulso.voce.tabelle[0].righe.length, 25);
  assert.equal(impulso.voce.tabelle[0].righe.at(-1)[0], "97-00");
  for (const [sotto, titolo] of [["Stregoneria Aberrante", "Incantesimi Psionici"], ["Stregoneria Draconica", "Incantesimi Draconici"], ["Stregoneria Meccanica", "Incantesimi Meccanici"]]) {
    const voce = sottoclassiDi("Stregone").find((item) => item.nome === sotto).privilegi.find((item) => item.nome === titolo);
    assert.deepEqual(voce.tabelle[0].righe.map((riga) => riga[0]), ["3", "5", "7", "9"], sotto);
  }
  assert.equal(voceManuale("classi/stregone", "Stregoneria Meccanica").voce.tabelle[0].righe.length, 6);
});
