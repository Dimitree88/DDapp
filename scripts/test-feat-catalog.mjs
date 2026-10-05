import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";
import { availableFeats, featCatalog, featByName } from "../lib/featCatalog.ts";
import { availableFeatChoices } from "../lib/characterGrants.ts";
import { featPrerequisitesMet } from "../lib/featPrerequisites.ts";

test("feat tiers and extra sources are explicit", () => {
  assert.equal(new Set(featCatalog.map((feat) => feat.id)).size, featCatalog.length);
  assert.equal(featByName("Guaritore").source, "Manuale del Giocatore 2024");
  assert.equal(availableFeats(1).includes("Dono del fato"), false);
  assert.equal(availableFeats(19).includes("Dono del fato"), true);
  const sheet = emptySheet();
  sheet.talenti = [{ nome: "Dono del fato", scelte: "" }];
  assert.match(domainErrors(sheet).join(" "), /livello 19/);
  sheet.livello = "19";
  assert.deepEqual(domainErrors(sheet), []);
});

test("level nineteen permits another qualified feat and fighting styles require their class feature", () => {
  const sheet = emptySheet();
  sheet.classe = "Mago";
  sheet.livello = "19";
  assert.ok(availableFeatChoices(sheet).includes("Dono del fato"));
  assert.ok(availableFeatChoices(sheet).includes("Guaritore"));
  assert.equal(featPrerequisitesMet(sheet, "Tiro"), false);
  sheet.classe = "Guerriero";
  assert.equal(featPrerequisitesMet(sheet, "Tiro"), true);
  sheet.livello = "4";
  assert.ok(availableFeatChoices(sheet).includes("Tiro"));
  sheet.classe = "Mago";
  assert.ok(!availableFeatChoices(sheet).includes("Tiro"));
});
