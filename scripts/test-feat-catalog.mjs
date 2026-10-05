import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";
import { availableFeats, featCatalog, featByName } from "../lib/featCatalog.ts";

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
