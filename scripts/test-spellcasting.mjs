import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";
import { availableClassSpells, spellSlots, spellcastingStats } from "../lib/spellcasting.ts";

test("class slots and pact slots follow the level progression", () => {
  const sheet = emptySheet();
  sheet.classe = "Mago";
  assert.deepEqual(spellSlots(sheet).map((slot) => slot.maximum), [2]);
  sheet.livello = "5";
  assert.deepEqual(spellSlots(sheet).map((slot) => slot.maximum), [4, 3, 2]);
  sheet.classe = "Ranger";
  assert.deepEqual(spellSlots(sheet).map((slot) => slot.maximum), [4, 2]);
  sheet.classe = "Warlock";
  assert.deepEqual(spellSlots(sheet).map((slot) => slot.maximum), [0, 0, 2]);
});

test("spell options and DC use the declared class and level", () => {
  const sheet = emptySheet();
  sheet.classe = "Ranger";
  sheet.caratteristiche.find((item) => item.abbr === "SAG").valore = "16";
  assert.equal(spellcastingStats(sheet).dc, 13);
  assert.ok(availableClassSpells(sheet).includes("Cura ferite"));
  assert.ok(!availableClassSpells(sheet).includes("Palla di fuoco"));
  sheet.incantesimi = [{ nome: "Cura ferite", fonte: "classe", stato: "preparato" }];
  assert.deepEqual(domainErrors(sheet), []);
  sheet.slotSpesi = { "1": 3 };
  assert.match(domainErrors(sheet).join(" "), /Slot/);
});

test("legacy spells remain unclassified", () => {
  const sheet = emptySheet();
  sheet.incantesimi = [{ nome: "CURA FERITE" }];
  assert.deepEqual(normalizeSheet(sheet).incantesimi, [{ nome: "Cura ferite" }]);
});
