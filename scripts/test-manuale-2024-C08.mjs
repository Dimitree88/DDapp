import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { spellcastingAbility } from "../lib/spellcasting.ts";

test("C08 covers the Monk, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C08");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Monaco").privilegi.length, 22);
  assert.deepEqual(sottoclassiDi("Monaco").map((voce) => voce.privilegi.length), [5, 4, 6, 4]);
});

test("C08 traits table p. 123 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Monaco"), []);
  assert.equal(voceClasse("Monaco").caratteristicaPrimaria, "Destrezza e Saggezza");
  assert.equal(spellcastingAbility.Monaco, undefined);
  assert.deepEqual(voceClasse("Monaco").competenze.strumentiAScelta, { numero: 1, tipi: ["artigiano", "musicale"] });
});

test("C08 progression table p. 124 matches martial arts die, discipline points and movement", () => {
  assert.deepEqual(differenzeProgressione("Monaco"), []);
  const tabella = voceClasse("Monaco").tabelle.find((item) => item.titolo === "Privilegi del monaco");
  const colonna = (nome) => tabella.righe.map((riga) => riga[tabella.colonne.indexOf(nome)]);
  assert.deepEqual(colonna("Arti marziali"), [...Array(4).fill("1d6"), ...Array(6).fill("1d8"), ...Array(6).fill("1d10"), ...Array(4).fill("1d12")]);
  assert.deepEqual(colonna("Punti concentrazione"), ["—", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"]);
  assert.equal(colonna("Movimento senza armatura")[0], "—");
  assert.equal(colonna("Movimento senza armatura")[19], "+9 m");
});

test("C08 features and subclasses match pp. 122-129", () => {
  assert.deepEqual(differenzePrivilegi("Monaco"), []);
  const conc = privilegioManuale("Concentrazione da Monaco", { classe: "Monaco", livello: 2 });
  assert.doesNotMatch(conc.descrizione, /PRIVILEGI DEL MONACO|1d8 · 10|· \+2/);
  assert.match(conc.descrizione, /Difesa paziente\./);
  assert.match(conc.descrizione, /Raffica di colpi\. Il monaco può spendere 1 punto concentrazione per sferrare/);
  assert.match(privilegioManuale("Arti Marziali", { classe: "Monaco", livello: 1 }).descrizione, /\n- Armi da mischia semplici\n- Armi da mischia da guerra con la proprietà leggera\n\n/);
  for (const [nome, inizio] of [["Guerriero degli Elementi", "Sferra colpi e raffiche di potere elementale"], ["Guerriero della Misericordia", "Manipola le forze della vita e della morte"], ["Guerriero dell'Ombra", "Poni il potere delle ombre al servizio della furtività e del sotterfugio"]]) {
    assert.match(voceManuale("classi/monaco", nome).descrizione, new RegExp(`^${inizio.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n\\n`), nome);
  }
});
