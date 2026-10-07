import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { etichettaManuale, privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { emptySheet } from "../lib/sheet.ts";
import { weaponMasteryLimit } from "../lib/weaponChoices.ts";
import { spellcastingAbility } from "../lib/spellcasting.ts";

test("C05 covers the Fighter, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C05");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Guerriero").privilegi.length, 15);
  assert.deepEqual(sottoclassiDi("Guerriero").map((voce) => voce.privilegi.length), [6, 6, 5, 6]);
});

test("C05 traits table p. 91 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Guerriero"), []);
  assert.equal(voceClasse("Guerriero").caratteristicaPrimaria, "Forza o Destrezza");
  assert.equal(spellcastingAbility.Guerriero, undefined);
});

test("C05 progression table p. 92 matches proficiency bonus, features and weapon mastery", () => {
  assert.deepEqual(differenzeProgressione("Guerriero"), []);
  const tabella = voceClasse("Guerriero").tabelle.find((item) => item.titolo === "Privilegi del guerriero");
  const colonna = (nome) => tabella.righe.map((riga) => riga[tabella.colonne.indexOf(nome)]);
  assert.deepEqual(colonna("Recuperare energie"), [...Array(3).fill("2"), ...Array(6).fill("3"), ...Array(11).fill("4")]);
  tabella.righe.forEach((riga, indice) => assert.equal(weaponMasteryLimit({ ...emptySheet(), classe: "Guerriero", livello: String(indice + 1) }), Number(riga[tabella.colonne.indexOf("Padronanza d'armi")]), `livello ${indice + 1}`));
});

test("C05 features, spells and maneuvers match pp. 90-99", () => {
  assert.deepEqual(differenzePrivilegi("Guerriero"), []);
  assert.doesNotMatch(privilegioManuale("Recuperare Energie", { classe: "Guerriero", livello: 1 }).descrizione, /· 1/);
  // Cavaliere Mistico: la tabella incantesimi sta tra i due paragrafi del privilegio.
  const incantesimi = privilegioManuale("Incantesimi", { classe: "Guerriero", sottoclasse: "Cavaliere Mistico", livello: 3 });
  assert.equal(incantesimi.voce.tabelle[0].righe.length, 18);
  assert.equal(spellcastingAbility.Mago ?? "INT", "INT");
  assert.match(incantesimi.descrizione, /Slot incantesimo\. La tabella Incantesimi del Cavaliere Mistico mostra/);
  assert.doesNotMatch(incantesimi.descrizione, /2 · 3 · 4|INCANTESIMI DEL CAVALIERE/);
  // Guerriero Psionico: tabella dei dadi di energia come dato.
  assert.deepEqual(privilegioManuale("Potere Psionico", { classe: "Guerriero", sottoclasse: "Guerriero Psionico", livello: 3 }).voce.tabelle[0].righe.map((riga) => riga[1]), ["D6", "D8", "D8", "D10", "D10", "D12"]);
  // Le manovre del Maestro di Battaglia sono un'etichetta a parte (pp. 98-99).
  const manovre = etichettaManuale("Opzioni di manovra");
  assert.match(manovre.descrizione, /Attacco adescante\./);
  assert.match(manovre.descrizione, /Valutazione tattica\./);
  assert.match(voceManuale("classi/guerriero", "Campione").descrizione, /^Raggiungi l'eccellenza fisica nel combattimento\n\nIl campione/);
});
