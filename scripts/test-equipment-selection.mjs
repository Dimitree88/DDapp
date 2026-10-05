import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatedArmorClass } from "../lib/armorClass.ts";
import { isArmorEquipment, replaceOtherEquipment, selectHeldShield, selectWornArmor } from "../lib/equipmentSelection.ts";
import { inventoryWeight } from "../lib/inventoryWeight.ts";
import { emptySheet } from "../lib/sheet.ts";

test("choosing leather armor and a shield gives Erin's possible AC 14", () => {
  const sheet = emptySheet();
  sheet.caratteristiche.find((item) => item.abbr === "DES").valore = "12";
  sheet.competenzeArmatura.scudi = true;
  sheet.equipaggiamento = selectWornArmor(sheet, "armatura-di-cuoio");
  Object.assign(sheet, selectHeldShield(sheet, true));
  assert.equal(calculatedArmorClass(sheet).value, 14);
  assert.equal(sheet.equipaggiamento.length, 2);
  sheet.equipaggiamento = selectWornArmor(sheet, "armatura-di-cuoio");
  assert.equal(sheet.equipaggiamento.length, 2);
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
  assert.deepEqual(sheet.equipaggiamento.filter(isArmorEquipment).map((item) => item.nome), ["Armatura di cuoio borchiato", "Armatura di cuoio"]);
  assert.equal(inventoryWeight(sheet).knownKg, 11.5);
});
