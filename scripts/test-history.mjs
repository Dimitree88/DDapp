import assert from "node:assert/strict";
import { test } from "node:test";
import { diffSheet } from "../lib/history.ts";
import { emptySheet } from "../lib/sheet.ts";

test("records only fields whose saved value changed", () => {
  const before = emptySheet();
  const after = structuredClone(before);
  after.classe = "Ranger";
  after.classeArmatura = 14;
  after.caratteristiche[0].valore = "16";
  assert.deepEqual(diffSheet(before, after), [
    { field: "Classe", before: "—", after: "Ranger" },
    { field: "Classe armatura", before: "—", after: "14" },
    { field: "Caratteristiche · FORZA · Valore", before: "—", after: "16" },
  ]);
  assert.deepEqual(diffSheet(after, structuredClone(after)), []);
});

test("records an added item without marking shifted items as modified", () => {
  const before = emptySheet();
  before.lingue = ["Comune", "Elfico"];
  const after = structuredClone(before);
  after.lingue.splice(1, 0, "Draconico");
  assert.deepEqual(diffSheet(before, after), [
    { field: "Lingue · aggiunta", before: "—", after: "Draconico" },
  ]);
});
