import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { spellcastingAbility } from "../lib/spellcasting.ts";

test("C06 covers the Rogue, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C06");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Ladro").privilegi.length, 18);
  assert.deepEqual(sottoclassiDi("Ladro").map((voce) => voce.privilegi.length), [5, 5, 5, 5]);
});

test("C06 traits table p. 101 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Ladro"), []);
  assert.equal(voceClasse("Ladro").caratteristicaPrimaria, "Destrezza");
  assert.equal(spellcastingAbility.Ladro, undefined);
  assert.match(privilegioManuale("Attacco Furtivo", { classe: "Ladro", livello: 1 }).descrizione, /della tabella Privilegi del ladro\.$/);
});

test("C06 progression table p. 102 matches proficiency bonus and sneak attack dice", () => {
  assert.deepEqual(differenzeProgressione("Ladro"), []);
  const tabella = voceClasse("Ladro").tabelle.find((item) => item.titolo === "Privilegi del ladro");
  const furtivo = tabella.righe.map((riga) => riga[tabella.colonne.indexOf("Attacco furtivo")]);
  assert.deepEqual(furtivo, ["1d6", "1d6", "2d6", "2d6", "3d6", "3d6", "4d6", "4d6", "5d6", "5d6", "6d6", "6d6", "7d6", "7d6", "8d6", "8d6", "9d6", "9d6", "10d6", "10d6"]);
});

test("C06 features and subclass tables match pp. 100-109", () => {
  assert.deepEqual(differenzePrivilegi("Ladro"), []);
  // Mistificatore Arcano: incantatore da 1/3, stessa tabella del Cavaliere Mistico.
  const incantesimi = privilegioManuale("Incantesimi", { classe: "Ladro", sottoclasse: "Mistificatore Arcano", livello: 3 });
  assert.equal(incantesimi.voce.tabelle[0].righe.length, 18);
  assert.doesNotMatch(incantesimi.descrizione, /· 2 · 3|INCANTESIMI DEL MIST/);
  // Lama Spirituale: dadi di energia; la tabella sta tra i due paragrafi.
  const psionico = privilegioManuale("Potere Psionico", { classe: "Ladro", sottoclasse: "Lama Spirituale", livello: 3 });
  assert.deepEqual(psionico.voce.tabelle[0].righe.map((riga) => riga[1]), ["D6", "D8", "D8", "D10", "D10", "D12"]);
  assert.match(psionico.descrizione, /^Il personaggio attinge a una fonte di energia psionica dentro di sé/);
  assert.doesNotMatch(psionico.descrizione, /Dl2|DADO DI ENERGIA/);
  assert.match(voceManuale("classi/ladro", "Assassino").descrizione, /^Padroneggia l'oscura arte della morte\n\nL'addestramento/);
});
