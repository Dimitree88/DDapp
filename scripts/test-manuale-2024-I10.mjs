import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { etichettaManuale, manuale, voceManuale } from "../lib/manuale-2024/index.ts";

test("I10 covers the spell rules rows of the matrix", () => {
  const copertura = coperturaModulo("I10");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(copertura.righe.totale, 4);
  assert.equal(copertura.righe.verificate, 4);
});

test("I10 spell rules come from chapter 7 with page and formula", () => {
  assert.match(etichettaManuale("Incantesimi")?.descrizione ?? "", /La descrizione di ogni incantesimo/);
  const cd = voceManuale("regole/incantesimi", "CD e attacco con incantesimo");
  assert.match(cd.descrizione, /CD del tiro salvezza sull'incantesimo = 8/);
  assert.match(cd.descrizione, /Modificatore di attacco dell'incantesimo/);
  assert.match(cd.voce.formula, /8 \+ modificatore di caratteristica da incantatore \+ bonus di competenza/);
  const slot = voceManuale("regole/incantesimi", "Slot incantesimo");
  assert.match(slot.descrizione, /Ogni incantesimo ha un livello compreso tra 0 e 9/);
  assert.match(slot.descrizione, /Completare un riposo lungo ripristina tutti gli slot/);
  assert.match(voceManuale("regole/incantesimi", "Preparare gli incantesimi").descrizione, /^Se il personaggio possiede una lista di incantesimi/);
  for (const voce of manuale.voci("regole/incantesimi")) assert.ok(voce.verifica.stato === "verificata");
});
