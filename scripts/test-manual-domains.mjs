import assert from "node:assert/strict";
import { test } from "node:test";
import { availableFeatChoices, featGrants, grantedPrivileges } from "../lib/characterGrants.ts";
import { domainErrors } from "../lib/domain.ts";
import { emptySheet } from "../lib/sheet.ts";
import { availableClassSpells } from "../lib/spellcasting.ts";
import { backgroundToolProficiency } from "../lib/backgroundToolProficiencies.ts";

test("new Manuale 2024 identity choices pass domain validation", () => {
  const sheet = emptySheet();
  Object.assign(sheet, { classe: "Druido", livello: "3", sottoclasse: "Circolo del Mare", specie: "Aasimar", taglia: "Piccola", background: "Artigiano" });
  assert.deepEqual(domainErrors(sheet), []);
  assert.ok(grantedPrivileges(sheet).some((grant) => grant.name === "Mani curative"));
  assert.equal(featGrants(sheet)[0].name, "Lavoro manuale");
  assert.ok(availableFeatChoices(sheet).includes("Lavoro manuale"));
});

test("new background grants and fixed tools use the Manuale 2024", () => {
  const sheet = emptySheet();
  sheet.background = "Marinaio";
  assert.equal(featGrants(sheet)[0].name, "Lottatore da taverna");
  assert.equal(backgroundToolProficiency("Marinaio"), "Strumenti da navigatore");
  sheet.background = "Guida";
  assert.equal(featGrants(sheet)[0].detail, "Lista: Druido");
});

test("new spell options obey class and slot level", () => {
  const sheet = emptySheet();
  sheet.classe = "Druido";
  sheet.livello = "3";
  assert.ok(availableClassSpells(sheet).includes("Richiama bestia"));
  assert.ok(!availableClassSpells(sheet).includes("Armatura di Agathys"));
  assert.ok(!availableClassSpells(sheet).includes("Richiama elementale"));
});

test("general feat prerequisites filter the dropdown", () => {
  const sheet = emptySheet();
  sheet.classe = "Guerriero";
  sheet.livello = "4";
  assert.ok(!availableFeatChoices(sheet).includes("Adepto elementale"));
  assert.ok(!availableFeatChoices(sheet).includes("Maestro degli scudi"));
  sheet.competenzeArmatura.scudi = true;
  assert.ok(availableFeatChoices(sheet).includes("Maestro degli scudi"));
});
