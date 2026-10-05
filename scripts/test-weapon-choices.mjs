import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { availableWeaponMasteries, proficientWeaponNames, weaponMasteryLimit } from "../lib/weaponChoices.ts";

test("Ephemer can choose two masteries from proficient weapons", () => {
  const ephemer = normalizeSheet({ ...emptySheet(), classe: "Ranger", livello: "2" });
  assert.equal(weaponMasteryLimit(ephemer), 2);
  assert.ok(availableWeaponMasteries(ephemer).includes("Arco lungo"));
  assert.ok(availableWeaponMasteries(ephemer).includes("Spada corta"));
  assert.deepEqual(availableWeaponMasteries(ephemer), proficientWeaponNames(ephemer));
});

test("Druid has proficient weapons but no class weapon mastery", () => {
  const erin = normalizeSheet({ ...emptySheet(), classe: "Druido", livello: "2" });
  assert.equal(weaponMasteryLimit(erin), 0);
  assert.ok(proficientWeaponNames(erin).includes("Pugnale"));
  assert.ok(!proficientWeaponNames(erin).includes("Spada lunga"));
});

test("Barbarian mastery is melee only and class limits scale", () => {
  const barbarian = normalizeSheet({ ...emptySheet(), classe: "Barbaro", livello: "1" });
  assert.equal(weaponMasteryLimit(barbarian), 2);
  assert.ok(availableWeaponMasteries(barbarian).includes("Spada lunga"));
  assert.ok(!availableWeaponMasteries(barbarian).includes("Arco lungo"));
  assert.equal(weaponMasteryLimit({ ...barbarian, livello: "4" }), 3);
  assert.equal(weaponMasteryLimit({ ...barbarian, livello: "10" }), 4);
  assert.equal(weaponMasteryLimit({ ...barbarian, classe: "Guerriero", livello: "16" }), 6);
});
