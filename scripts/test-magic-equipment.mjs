import assert from "node:assert/strict";
import { test } from "node:test";
import { isMagicEquipment, isMagicGearId, replaceEquipmentGroup } from "../lib/equipmentSelection.ts";

test("existing potions and scrolls appear only in the magic group", () => {
  const potion = { nome: "Pozione di guarigione", catalogId: "srd52:gear:pozione-guarigione", dettaglio: "" };
  const rope = { nome: "Corda", catalogId: "srd52:gear:corda", dettaglio: "" };
  assert.equal(isMagicEquipment(potion), true);
  assert.equal(isMagicEquipment(rope), false);
  assert.equal(isMagicGearId(potion.catalogId), true);
  assert.equal(isMagicGearId(rope.catalogId), false);
  assert.deepEqual(replaceEquipmentGroup([potion, rope], [], false), [potion]);
  assert.deepEqual(replaceEquipmentGroup([potion, rope], [], true), [rope]);
});

test("a custom magic item is classified only after being added", () => {
  const item = { nome: "Anello trovato in gioco", dettaglio: "", magico: true };
  assert.equal(isMagicEquipment(item), true);
});
