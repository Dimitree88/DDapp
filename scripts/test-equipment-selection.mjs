import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatedArmorClass } from "../lib/armorClass.ts";
import { addCatalogEquipment, addOwnedArmor, isArmorEquipment, removeOwnedArmor, replaceOtherEquipment, selectHeldShield, selectWornArmor } from "../lib/equipmentSelection.ts";
import { gearByName } from "../lib/gearCatalog.ts";
import { inventoryWeight } from "../lib/inventoryWeight.ts";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";

test("choosing leather armor and a shield gives Erin's possible AC 14", () => {
  const sheet = emptySheet();
  sheet.caratteristiche.find((item) => item.abbr === "DES").valore = "12";
  sheet.competenzeArmatura.scudi = true;
  sheet.equipaggiamento = addOwnedArmor(sheet.equipaggiamento, "armatura-di-cuoio");
  sheet.equipaggiamento = addOwnedArmor(sheet.equipaggiamento, "armatura-di-cuoio-borchiato");
  sheet.equipaggiamento = addOwnedArmor(sheet.equipaggiamento, "scudo");
  sheet.equipaggiamento = selectWornArmor(sheet, "armatura-di-cuoio");
  Object.assign(sheet, selectHeldShield(sheet, true));
  assert.equal(calculatedArmorClass(sheet).value, 14);
  assert.equal(sheet.equipaggiamento.length, 3);
  sheet.equipaggiamento = selectWornArmor(sheet, "armatura-di-cuoio");
  assert.equal(sheet.equipaggiamento.length, 3);
  sheet.equipaggiamento = selectWornArmor(sheet, "armatura-di-cuoio-borchiato");
  assert.equal(sheet.equipaggiamento.filter((item) => item.indossato).length, 1);
  assert.equal(calculatedArmorClass(sheet).value, 15);
  Object.assign(sheet, selectHeldShield(sheet, false));
  assert.equal(calculatedArmorClass(sheet).value, 13);
  assert.equal(sheet.equipaggiamento.some((item) => item.nome === "Scudo" && !item.impugnato), true);
});

test("legacy armor stays out of other objects but contributes its catalog weight", () => {
  const sheet = emptySheet();
  sheet.equipaggiamento = [
    { nome: "Armatura di cuoio borchiato", dettaglio: "" },
    { nome: "Corda", dettaglio: "" },
  ];
  assert.equal(isArmorEquipment(sheet.equipaggiamento[0]), true);
  assert.deepEqual(sheet.equipaggiamento.filter((item) => !isArmorEquipment(item)).map((item) => item.nome), ["Corda"]);
  assert.equal(inventoryWeight(sheet).knownKg, 6.5);
  assert.deepEqual(inventoryWeight(sheet).unknownItems, ["Corda"]);
  assert.deepEqual(replaceOtherEquipment(sheet.equipaggiamento, []), [sheet.equipaggiamento[0]]);
  sheet.equipaggiamento = selectWornArmor(sheet, "armatura-di-cuoio");
  assert.deepEqual(sheet.equipaggiamento.filter(isArmorEquipment).map((item) => item.nome), ["Armatura di cuoio borchiato"]);
  sheet.equipaggiamento = addOwnedArmor(sheet.equipaggiamento, "armatura-di-cuoio");
  sheet.equipaggiamento = selectWornArmor(sheet, "armatura-di-cuoio");
  assert.equal(inventoryWeight(sheet).knownKg, 11.5);
});

test("equipping does not create armor or a shield", () => {
  const sheet = emptySheet();
  assert.deepEqual(selectWornArmor(sheet, "armatura-di-cuoio"), []);
  assert.deepEqual(selectHeldShield(sheet, true), { scudo: false, equipaggiamento: [] });
  sheet.equipaggiamento = addOwnedArmor([], "armatura-di-cuoio");
  sheet.equipaggiamento = selectWornArmor(sheet, "armatura-di-cuoio");
  assert.equal(sheet.equipaggiamento.length, 1);
  assert.equal(sheet.equipaggiamento[0].indossato, true);
  assert.deepEqual(removeOwnedArmor(sheet.equipaggiamento, 0), sheet.equipaggiamento);
  sheet.equipaggiamento = selectWornArmor(sheet, null);
  assert.deepEqual(removeOwnedArmor(sheet.equipaggiamento, 0), []);
});

test("a shield must be registered before use and stays owned when put away", () => {
  const sheet = emptySheet();
  sheet.equipaggiamento = addOwnedArmor([], "scudo");
  sheet.equipaggiamento = addOwnedArmor(sheet.equipaggiamento, "scudo");
  assert.equal(sheet.equipaggiamento[0].quantita, "2");
  Object.assign(sheet, selectHeldShield(sheet, true));
  assert.equal(sheet.equipaggiamento[0].impugnato, true);
  sheet.equipaggiamento = removeOwnedArmor(sheet.equipaggiamento, 0);
  assert.equal(sheet.equipaggiamento[0].quantita, "1");
  assert.equal(removeOwnedArmor(sheet.equipaggiamento, 0)[0].impugnato, true);
  Object.assign(sheet, selectHeldShield(sheet, false));
  assert.deepEqual(removeOwnedArmor(sheet.equipaggiamento, 0), []);
});

test("adding a catalog object increases its existing quantity", () => {
  const arrows = gearByName("Frecce");
  const existing = [{ nome: "Frecce", catalogId: arrows.id, quantita: "16", dettaglio: "" }];
  assert.deepEqual(addCatalogEquipment(existing, arrows.id), [{ ...existing[0], quantita: "17" }]);
  assert.equal(existing[0].quantita, "16");
});

test("an object with personal details stays separate from a newly added copy", () => {
  const book = gearByName("Libro");
  const existing = [{ nome: "Libro", catalogId: book.id, quantita: "1", dettaglio: "Di filosofia" }];
  assert.deepEqual(addCatalogEquipment(existing, book.id), [existing[0], { nome: "Libro", catalogId: book.id, dettaglio: "", quantita: "1" }]);
  const sheet = emptySheet();
  sheet.equipaggiamento = addCatalogEquipment(existing, book.id);
  assert.equal(normalizeSheet(sheet).equipaggiamento.length, 2);
});

test("the druidic focus and its listed forms are available in the object catalog", () => {
  assert.equal(gearByName("Focus druidico")?.costGp, undefined);
  assert.equal(gearByName("Focus druidico (rametto di vischio)")?.costGp, 1);
  assert.equal(gearByName("Focus druidico (bastone di legno)")?.weightKg, 2);
  assert.equal(gearByName("Focus druidico (bacchetta in legno di tasso)")?.costGp, 10);
});

test("legacy arrows show as catalog objects with a separate quantity", () => {
  const sheet = emptySheet();
  sheet.equipaggiamento = [{ nome: "Frecce x16", dettaglio: "" }, { nome: "Frecce", catalogId: gearByName("Frecce").id, quantita: "1", dettaglio: "" }];
  const normalized = normalizeSheet(sheet);
  assert.deepEqual(normalized.equipaggiamento, [{ nome: "Frecce", catalogId: gearByName("Frecce").id, quantita: "17", dettaglio: "" }]);
  assert.deepEqual(normalizeSheet(normalized).equipaggiamento, normalized.equipaggiamento);
});
