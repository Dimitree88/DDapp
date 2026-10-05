import assert from "node:assert/strict";
import { test } from "node:test";
import { grantClassProficiencies } from "../lib/classSavingThrows.ts";
import { emptySheet } from "../lib/sheet.ts";
import { addWeaponCompetency, removeWeaponCompetency, weaponCompetencyDetails } from "../lib/weaponCompetencies.ts";

test("class weapon proficiency shows its origin and cannot be removed", () => {
  const sheet = grantClassProficiencies({ ...emptySheet(), classe: "Druido" });
  assert.match(weaponCompetencyDetails(sheet, "Armi semplici"), /Classe: Druido/);
  assert.deepEqual(removeWeaponCompetency(sheet, "Armi semplici"), {});
});

test("an added weapon proficiency records its origin and can be removed", () => {
  const sheet = grantClassProficiencies({ ...emptySheet(), classe: "Druido" });
  Object.assign(sheet, addWeaponCompetency(sheet, "Armi da guerra"));
  assert.equal(sheet.competenzeArmi.filter((name) => name === "Armi da guerra").length, 1);
  assert.match(weaponCompetencyDetails(sheet, "Armi da guerra"), /Aggiunta manuale/);
  Object.assign(sheet, removeWeaponCompetency(sheet, "Armi da guerra"));
  assert.equal(sheet.competenzeArmi.includes("Armi da guerra"), false);
  assert.equal(sheet.fontiCompetenze.some((record) => record.tipo === "arma" && record.valore === "Armi da guerra"), false);
});
