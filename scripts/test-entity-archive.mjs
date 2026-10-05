import assert from "node:assert/strict";
import { test } from "node:test";
import { entityArchive, manualClassSubclasses, manualFeatsByCategory } from "../lib/entityArchive.ts";

test("Manuale 2024 index is represented without duplicate values", () => {
  assert.equal(entityArchive.classes.values.length, 12);
  assert.equal(entityArchive.subclasses.values.length, 48);
  assert.equal(entityArchive.backgrounds.values.length, 16);
  assert.equal(entityArchive.species.values.length, 10);
  assert.equal(entityArchive.feats.values.length, 75);
  assert.equal(entityArchive.conditions.values.length, 15);
  assert.equal(entityArchive.mounts.values.length, 8);
  assert.equal(entityArchive.vehicles.values.length, 12);
  assert.ok(entityArchive.spells.values.includes("Armatura di Agathys"));
  assert.ok(!entityArchive.equipment.values.includes("Pozione di guarigione"));
  assert.ok(entityArchive.magicItems.values.includes("Pozione di guarigione"));
  for (const [kind, group] of Object.entries(entityArchive)) {
    assert.equal(new Set(group.values).size, group.values.length, `${kind}: duplicated value`);
  }
  for (const [className, subclasses] of Object.entries(manualClassSubclasses)) {
    assert.equal(subclasses.length, 4, `${className}: expected four subclasses`);
  }
  assert.deepEqual(Object.values(manualFeatsByCategory).flat().length, entityArchive.feats.values.length);
});

test("existing character choices remain representable in the archive", () => {
  for (const value of ["Druido", "Circolo della Terra", "Guida", "Elfo", "Iniziato alla magia"]) {
    assert.ok(Object.values(entityArchive).some((group) => group.values.includes(value)), value);
  }
});
