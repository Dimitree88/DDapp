import assert from "node:assert/strict";
import { test } from "node:test";
import { domainErrors } from "../lib/domain.ts";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";

test("new state fields are explicit and older sheets stay unchanged", () => {
  const old = emptySheet();
  delete old.puntiFeritaTemporanei;
  delete old.dadiVitaSpesi;
  delete old.tiriMorte;
  delete old.condizioni;
  const normalized = normalizeSheet(old);
  assert.equal(normalized.puntiFeritaTemporanei, undefined);
  assert.equal(normalized.tiriMorte, undefined);
  assert.deepEqual(domainErrors(normalized), []);
});

test("spent hit dice, death saves and conditions respect their limits", () => {
  const sheet = emptySheet();
  sheet.dadiVita = "3d10";
  sheet.dadiVitaSpesi = "2";
  sheet.tiriMorte = { successi: 2, fallimenti: 1 };
  sheet.condizioni = ["Prono"];
  assert.deepEqual(domainErrors(sheet), []);
  sheet.dadiVitaSpesi = "4";
  sheet.tiriMorte.successi = 4;
  sheet.condizioni.push("Prono");
  assert.match(domainErrors(sheet).join(" "), /Dadi vita spesi oltre il massimo/);
  assert.match(domainErrors(sheet).join(" "), /Tiri salvezza contro morte/);
  assert.match(domainErrors(sheet).join(" "), /Condizioni duplicate/);
});
