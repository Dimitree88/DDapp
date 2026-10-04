import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { abilityBonus } from "../lib/abilityBonus.ts";

test("ability bonus follows modifier, proficiency and mastery", () => {
  const sheet = emptySheet();
  sheet.caratteristiche.find((item) => item.abbr === "SAG").modificatore = "+3";
  const insight = sheet.abilita.find((item) => item.nome === "INTUIZIONE");
  assert.equal(abilityBonus(sheet, insight), "+3");
  insight.competente = true;
  assert.equal(abilityBonus(sheet, insight), "+5");
  insight.maestria = true;
  assert.equal(abilityBonus(sheet, insight), "+7");
  sheet.bonusCompetenza = "+3";
  assert.equal(abilityBonus(sheet, insight), "+9");
  sheet.caratteristiche.find((item) => item.abbr === "SAG").modificatore = "";
  assert.equal(abilityBonus(sheet, insight), "");
});

test("normalization discards saved bonuses from older sheets", () => {
  const old = emptySheet();
  old.abilita[0].bonus = "+99";
  const normalized = normalizeSheet(old);
  assert.equal(Object.hasOwn(normalized.abilita[0], "bonus"), false);
  assert.equal(normalized.abilita[0].maestria, false);
});
