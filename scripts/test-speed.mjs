import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatedSpeed, displayedSpeed } from "../lib/speed.ts";
import { emptySheet } from "../lib/sheet.ts";

test("historic speed stays manual and species mode uses explicit sources", () => {
  const sheet = emptySheet();
  sheet.velocita = "12";
  sheet.specie = "Elfo";
  sheet.lignaggio = "Elfo dei boschi";
  assert.equal(displayedSpeed(sheet), "12");
  sheet.velocitaModo = "specie";
  assert.equal(calculatedSpeed(sheet).value, 10.5);
  sheet.modificatoriVelocita = [{ value: 3, fonte: "Passo veloce attivo", temporaneo: true }];
  assert.equal(calculatedSpeed(sheet).value, 13.5);
});

test("worn heavy armor applies the strength speed penalty", () => {
  const sheet = emptySheet();
  sheet.specie = "Umano";
  sheet.velocitaModo = "specie";
  sheet.equipaggiamento = [{ nome: "Cotta di maglia", dettaglio: "", catalogId: "cotta-di-maglia", indossato: true }];
  assert.equal(calculatedSpeed(sheet), null);
  sheet.caratteristiche.find((item) => item.abbr === "FOR").valore = "12";
  assert.equal(calculatedSpeed(sheet).value, 6);
  sheet.caratteristiche.find((item) => item.abbr === "FOR").valore = "13";
  assert.equal(calculatedSpeed(sheet).value, 9);
});
