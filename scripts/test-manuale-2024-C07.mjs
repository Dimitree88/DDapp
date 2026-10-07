import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { spellcastingAbility } from "../lib/spellcasting.ts";

test("C07 covers the Wizard, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C07");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Mago").privilegi.length, 10);
  assert.deepEqual(sottoclassiDi("Mago").map((voce) => voce.privilegi.length), [5, 5, 5, 5]);
});

test("C07 traits table p. 111 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Mago"), []);
  assert.equal(voceClasse("Mago").caratteristicaPrimaria, "Intelligenza");
  assert.equal(spellcastingAbility.Mago, "INT");
  assert.deepEqual(voceClasse("Mago").competenze.armature, []);
  assert.match(voceClasse("Mago").testo && privilegioManuale("Incantesimi", { classe: "Mago", livello: 1 }).descrizione, /Intelligenza è la caratteristica da incantatore/);
});

test("C07 progression table p. 113 matches proficiency bonus, cantrips and slots", () => {
  assert.deepEqual(differenzeProgressione("Mago"), []);
  const tabella = voceClasse("Mago").tabelle.find((item) => item.titolo === "Privilegi del mago");
  const colonna = (nome) => tabella.righe.map((riga) => riga[tabella.colonne.indexOf(nome)]);
  assert.deepEqual(colonna("Trucchetti"), [...Array(3).fill("3"), ...Array(6).fill("4"), ...Array(11).fill("5")]);
  assert.deepEqual(colonna("Incantesimi preparati").map(Number), [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25]);
  assert.deepEqual(tabella.righe[19].slice(tabella.colonne.indexOf("1")), ["4", "3", "3", "3", "3", "2", "2", "1", "1"]);
});

test("C07 features and subclasses match pp. 110-121", () => {
  assert.deepEqual(differenzePrivilegi("Mago"), []);
  assert.match(voceManuale("classi/mago", "Mago").descrizione, /^I maghi sono noti per il loro esaustivo studio/);
  for (const [nome, inizio] of [["Abiuratore", "Difendi gli alleati e sgomina i nemici"], ["Divinatore", "Apprendi i segreti del multiverso"], ["Illusionista", "Plasma i tuoi incantesimi per architettare inganni"], ["Invocatore", "Crea effetti elementali esplosivi"]]) {
    assert.match(voceManuale("classi/mago", nome).descrizione, new RegExp(`^${inizio}\\n\\n`), nome);
  }
  assert.match(privilegioManuale("Terzo Occhio", { classe: "Mago", sottoclasse: "Divinatore", livello: 10 }).descrizione, /\n\nScurovisione\. Il personaggio ottiene scurovisione/);
});
