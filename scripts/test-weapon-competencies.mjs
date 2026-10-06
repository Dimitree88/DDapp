import assert from "node:assert/strict";
import { test } from "node:test";
import { grantClassProficiencies } from "../lib/classSavingThrows.ts";
import { emptySheet } from "../lib/sheet.ts";
import { weaponCompetencyDetails } from "../lib/weaponCompetencies.ts";

test("class weapon proficiency shows its origin", () => {
  const sheet = grantClassProficiencies({ ...emptySheet(), classe: "Druido" });
  assert.match(weaponCompetencyDetails(sheet, "Armi semplici"), /Classe: Druido/);
});

test("a weapon proficiency granted by another source shows its origin", () => {
  const sheet = grantClassProficiencies({ ...emptySheet(), classe: "Druido" });
  sheet.competenzeArmi.push("Armi da guerra");
  sheet.fontiCompetenze.push({ tipo: "arma", valore: "Armi da guerra", fonte: "Privilegio verificato" });
  assert.match(weaponCompetencyDetails(sheet, "Armi da guerra"), /Privilegio verificato/);
});
