import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { privilegeOptions } from "../lib/characterGrants.ts";
import { spellcastingAbility } from "../lib/spellcasting.ts";

test("C03 covers the Cleric, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C03");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Chierico").privilegi.length, 11);
  assert.deepEqual(sottoclassiDi("Chierico").map((voce) => voce.privilegi.length), [5, 5, 5, 5]);
});

test("C03 traits table p. 69 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Chierico"), []);
  assert.equal(spellcastingAbility.Chierico, "SAG");
  assert.match(privilegioManuale("Incantesimi", { classe: "Chierico", livello: 1 }).descrizione, /Saggezza è la caratteristica da incantatore/);
});

test("C03 progression table p. 70 matches proficiency bonus, features, slots and Channel Divinity", () => {
  assert.deepEqual(differenzeProgressione("Chierico"), []);
  const tabella = voceClasse("Chierico").tabelle.find((item) => item.titolo === "Privilegi del chierico");
  const colonna = (nome) => tabella.righe.map((riga) => riga[tabella.colonne.indexOf(nome)]);
  assert.deepEqual(colonna("Incanalare divinità"), ["—", ...Array(4).fill("2"), ...Array(12).fill("3"), ...Array(3).fill("4")]);
  assert.deepEqual(colonna("Trucchetti"), [...Array(3).fill("3"), ...Array(6).fill("4"), ...Array(11).fill("5")]);
  assert.deepEqual(colonna("Incantesimi preparati").map(Number), [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22]);
  assert.match(privilegioManuale("Incanalare Divinità", { classe: "Chierico", livello: 2 }).descrizione, /usare Incanalare Divinità due volte/);
});

test("C03 features, choices and domain spells match pp. 69-77", () => {
  assert.deepEqual(differenzePrivilegi("Chierico"), []);
  const ordine = privilegioManuale("Ordine divino", { classe: "Chierico", livello: 1 }).descrizione;
  for (const opzione of privilegeOptions["Ordine divino"]) assert.match(ordine, new RegExp(`\\n\\n${opzione}\\. `));
  for (const sottoclasse of sottoclassiDi("Chierico")) {
    const incantesimi = sottoclasse.privilegi.find((item) => item.nome === `Incantesimi del ${sottoclasse.nome}`);
    assert.deepEqual(incantesimi.tabelle[0].righe.map((riga) => riga[0]), ["3", "5", "7", "9"], sottoclasse.nome);
    assert.match(voceManuale("classi/chierico", sottoclasse.nome).descrizione, /^[A-Z][^\n]+\n\n(La guerra|Il Dominio)/);
  }
  assert.match(privilegioManuale("Colpi Benedetti Migliorati", { classe: "Chierico", livello: 14 }).descrizione, /aumentano a 2d8/);
});
