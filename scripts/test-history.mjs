import assert from "node:assert/strict";
import { test } from "node:test";
import { diffSheet, groupHistoryByDay, historyTimestampMs } from "../lib/history.ts";
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

test("reads timestamps written in seconds or milliseconds", () => {
  assert.equal(historyTimestampMs(1791038063), 1791038063000);
  assert.equal(historyTimestampMs(1791037596000), 1791037596000);
});

test("groups by Rome day and separates changes more than ten minutes apart", () => {
  const entries = [
    { occurredAt: "2026-10-03T14:30:00.000Z" },
    { occurredAt: "2026-10-03T14:21:00.000Z" },
    { occurredAt: "2026-10-03T14:10:00.000Z" },
    { occurredAt: "2026-10-02T21:30:00.000Z" },
  ];
  const days = groupHistoryByDay(entries);
  assert.deepEqual(days.map((day) => day.day), ["2026-10-03", "2026-10-02"]);
  assert.deepEqual(days[0].timeGroups.map((group) => group.entries.length), [2, 1]);
});
