import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { emptySheet } from "../lib/sheet.ts";
import { weaponMasteryLimit } from "../lib/weaponChoices.ts";

test("C01 covers the Barbarian, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C01");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Barbaro").privilegi.length, 20);
  assert.deepEqual(sottoclassiDi("Barbaro").map((voce) => voce.privilegi.length), [4, 4, 5, 5]);
});

test("C01 traits table p. 51 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Barbaro"), []);
  assert.equal(voceClasse("Barbaro").caratteristicaPrimaria, "Forza");
});

test("C01 progression table p. 52 matches proficiency bonus, features and weapon mastery", () => {
  assert.deepEqual(differenzeProgressione("Barbaro"), []);
  const tabella = voceClasse("Barbaro").tabelle.find((item) => item.titolo === "Privilegi del barbaro");
  assert.deepEqual(tabella.righe.map((riga) => riga[3]), ["2", "2", "3", "3", "3", "4", "4", "4", "4", "4", "4", "5", "5", "5", "5", "5", "6", "6", "6", "6"]);
  assert.deepEqual(tabella.righe.map((riga) => riga[4]), [...Array(8).fill("+2"), ...Array(7).fill("+3"), ...Array(5).fill("+4")]);
  tabella.righe.forEach((riga, indice) => assert.equal(weaponMasteryLimit({ ...emptySheet(), classe: "Barbaro", livello: String(indice + 1) }), Number(riga[5]), `livello ${indice + 1}`));
});

test("C01 features have page, level and clean text from pp. 51-57", () => {
  assert.deepEqual(differenzePrivilegi("Barbaro"), []);
  assert.match(privilegioManuale("Colpo Brutale Migliorato", { classe: "Barbaro", livello: 13 }).descrizione, /^Il barbaro ha affinato/);
  assert.match(privilegioManuale("Colpo Brutale Migliorato", { classe: "Barbaro", livello: 17 }).descrizione, /aumentano a 2d10/);
  assert.match(privilegioManuale("Ira", { classe: "Barbaro", livello: 1 }).descrizione, /colonna Ire della tabella Privilegi del barbaro/);
  assert.match(privilegioManuale("Frenesia", { classe: "Barbaro", sottoclasse: "Cammino del Berserker", livello: 3 }).descrizione, /^Se il personaggio usa Attacco irruento/);
  assert.match(voceManuale("classi/barbaro", "Cammino dell'Albero del Mondo").descrizione, /^Risali alle radici e ai rami del multiverso\n\nI barbari/);
  assert.equal(privilegioManuale("Ira degli Dèi", { classe: "Barbaro", sottoclasse: "Cammino dello Zelota", livello: 10 }), null);
});
