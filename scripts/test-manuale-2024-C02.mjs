import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { spellcastingAbility } from "../lib/spellcasting.ts";

test("C02 covers the Bard, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C02");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Bardo").privilegi.length, 12);
  assert.deepEqual(sottoclassiDi("Bardo").map((voce) => voce.privilegi.length), [4, 4, 4, 4]);
});

test("C02 traits table p. 59 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Bardo"), []);
  assert.deepEqual(voceClasse("Bardo").competenze.strumentiAScelta, { numero: 3, tipi: ["musicale"] });
  assert.equal(spellcastingAbility.Bardo, "CAR");
  assert.match(privilegioManuale("Incantesimi", { classe: "Bardo", livello: 1 }).descrizione, /Carisma è la caratteristica da incantatore/);
});

test("C02 progression table p. 60 matches proficiency bonus, features, slots and bardic die", () => {
  assert.deepEqual(differenzeProgressione("Bardo"), []);
  const tabella = voceClasse("Bardo").tabelle.find((item) => item.titolo === "Privilegi del bardo");
  const colonna = (nome) => tabella.righe.map((riga) => riga[tabella.colonne.indexOf(nome)]);
  assert.deepEqual(colonna("Dado bardico"), [...Array(4).fill("D6"), ...Array(5).fill("D8"), ...Array(5).fill("D10"), ...Array(6).fill("D12")]);
  assert.match(privilegioManuale("Ispirazione Bardica", { classe: "Bardo", livello: 1 }).descrizione, /un d8 al 5° livello, un d10 al 10° livello e un d12 al 15° livello/);
  assert.deepEqual(colonna("Trucchetti"), [...Array(3).fill("2"), ...Array(6).fill("3"), ...Array(11).fill("4")]);
  assert.deepEqual(colonna("Incantesimi preparati").map(Number), [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22]);
});

test("C02 features have page, level and clean text from pp. 59-67", () => {
  assert.deepEqual(differenzePrivilegi("Bardo"), []);
  assert.match(privilegioManuale("Maestria", { classe: "Bardo", livello: 2 }).descrizione, /Al livello 9, il bardo ottiene maestria in altre due/);
  assert.doesNotMatch(privilegioManuale("Sottoclasse del Bardo", { classe: "Bardo", livello: 3 }).descrizione, /REPERTORIO/);
  assert.match(voceManuale("classi/bardo", "Collegio del Fascino").descrizione, /^Tessi l'ammaliante magia fatata\n\nIl Collegio del Fascino/);
  assert.match(privilegioManuale("Elusione Trainante", { classe: "Bardo", sottoclasse: "Collegio della Danza", livello: 14 }).descrizione, /può condividere questo beneficio/);
});
