import assert from "node:assert/strict";
import { test } from "node:test";
import { calculatedArmorClass } from "../lib/armorClass.ts";
import { selectHeldShield, selectWornArmor } from "../lib/equipmentSelection.ts";
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
});
