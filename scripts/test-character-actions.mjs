import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet } from "../lib/sheet.ts";
import { applyDamage, applyHealing, finishLongRest, finishShortRest } from "../lib/characterActions.ts";

test("damage uses temporary HP first; healing respects max and clears death saves", () => {
  const sheet = emptySheet();
  sheet.puntiFerita = "10";
  sheet.puntiFeritaMax = "15";
  sheet.puntiFeritaTemporanei = "3";
  sheet.tiriMorte = { successi: 1, fallimenti: 2 };
  const damaged = applyDamage(sheet, 5);
  assert.equal(damaged.puntiFerita, "8");
  assert.equal(damaged.puntiFeritaTemporanei, "0");
  const healed = applyHealing(damaged, 20);
  assert.equal(healed.puntiFerita, "15");
  assert.deepEqual(healed.tiriMorte, { successi: 0, fallimenti: 0 });
  assert.equal(applyDamage({ ...sheet, puntiFerita: "0" }, 1), null);
});

test("rest updates only resources with unconditional rules", () => {
  const sheet = emptySheet();
  sheet.classe = "Warlock";
  sheet.puntiFerita = "5";
  sheet.puntiFeritaMax = "12";
  sheet.puntiFeritaTemporanei = "4";
  sheet.dadiVitaSpesi = "1";
  sheet.slotSpesi = { "1": 1 };
  sheet.risorse = [
    { nome: "Breve", fonte: "Privilegio", massimo: 2, spesi: 1, ricarica: "breve" },
    { nome: "Lungo", fonte: "Privilegio", massimo: 3, spesi: 2, ricarica: "lungo" },
    { nome: "Manuale", fonte: "DM", massimo: 1, spesi: 1, ricarica: "manuale" },
  ];
  assert.deepEqual(finishShortRest(sheet).slotSpesi, {});
  assert.deepEqual(finishShortRest(sheet).risorse.map((resource) => resource.spesi), [0, 2, 1]);
  const rested = finishLongRest(sheet);
  assert.equal(rested.puntiFerita, "12");
  assert.equal(rested.puntiFeritaTemporanei, "0");
  assert.equal(rested.dadiVitaSpesi, "0");
  assert.deepEqual(rested.slotSpesi, {});
  assert.deepEqual(rested.risorse.map((resource) => resource.spesi), [0, 0, 1]);
  assert.equal(finishLongRest({ ...sheet, puntiFerita: "0" }), null);
});
