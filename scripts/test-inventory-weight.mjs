import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { gearByName, gearCatalog } from "../lib/gearCatalog.ts";
import { carryingCapacity, inventoryWeight } from "../lib/inventoryWeight.ts";
import { domainErrors } from "../lib/domain.ts";

test("gear has stable unique IDs and explicit unknown weights", () => {
  assert.equal(new Set(gearCatalog.map((item) => item.id)).size, gearCatalog.length);
  assert.equal(gearByName("Torcia")?.weightKg, 0.5);
  assert.equal(gearByName("Carta")?.weightKg, undefined);
  assert.equal(gearByName("Frecce")?.weightKg, 0.025);
  assert.equal(gearByName("Frecce")?.priceQuantity, 20);
  assert.equal(gearByName("Borsa da erborista")?.weightKg, 1.5);
});

test("inventory weight counts linked gear and weapons without guessing legacy objects", () => {
  const sheet = emptySheet();
  sheet.equipaggiamento = [
    { nome: "Torcia", catalogId: gearByName("Torcia").id, quantita: "3", dettaglio: "" },
    { nome: "Libro di filosofia", dettaglio: "" },
  ];
  sheet.armi = [{ nome: "Arco corto", quantita: "1", bonus: "", note: "" }];
  assert.deepEqual(domainErrors(sheet), []);
  const weight = inventoryWeight(sheet);
  assert.equal(weight.knownKg, 2.5);
  assert.deepEqual(weight.unknownItems, ["Libro di filosofia"]);
  assert.equal(normalizeSheet(sheet).equipaggiamento[0].catalogId, gearByName("Torcia").id);
  sheet.taglia = "Media";
  sheet.caratteristiche.find((item) => item.abbr === "FOR").valore = "10";
  assert.equal(carryingCapacity(sheet), 75);
});
