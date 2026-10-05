import assert from "node:assert/strict";
import { test } from "node:test";
import { classHitDice, calculatedMaxHp, displayedMaxHp } from "../lib/classProgression.ts";
import { domainErrors } from "../lib/domain.ts";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";

test("all classes have a hit die and subclass begins at level three", () => {
  assert.equal(Object.keys(classHitDice).length, 12);
  const sheet = emptySheet();
  sheet.classe = "Ranger";
  sheet.sottoclasse = "Cacciatore";
  assert.match(domainErrors(sheet).join(" "), /Sottoclasse disponibile/);
  sheet.livello = "3";
  assert.deepEqual(domainErrors(sheet), []);
});

test("legacy calculated HP is materialized and its controls are removed", () => {
  const sheet = emptySheet();
  sheet.classe = "Ranger";
  sheet.livello = "3";
  sheet.puntiFeritaMax = "20";
  sheet.caratteristiche.find((item) => item.abbr === "COS").valore = "16";
  assert.equal(displayedMaxHp(normalizeSheet(sheet)), "20");
  sheet.puntiFeritaMaxModo = "classe";
  assert.equal(calculatedMaxHp(sheet), null);
  sheet.incrementiPf = [{ value: 6, method: "fisso" }, { value: 8, method: "tiro" }];
  assert.equal(calculatedMaxHp(sheet).value, 33);
  const normalized = normalizeSheet(sheet);
  assert.equal(normalized.puntiFeritaMax, "33");
  assert.equal(Object.hasOwn(normalized, "puntiFeritaMaxModo"), false);
  assert.equal(Object.hasOwn(normalized, "incrementiPf"), false);
  sheet.incrementiPf[0].value = 7;
  assert.equal(calculatedMaxHp(sheet), null);
});
