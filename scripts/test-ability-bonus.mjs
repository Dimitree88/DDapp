import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { abilityBonus, abilityModifier, passivePerception, proficiencyBonus, savingThrowBonus } from "../lib/abilityBonus.ts";

test("ability bonus follows modifier, proficiency and mastery", () => {
  const sheet = emptySheet();
  sheet.caratteristiche.find((item) => item.abbr === "SAG").valore = "16";
  const insight = sheet.abilita.find((item) => item.nome === "INTUIZIONE");
  assert.equal(abilityBonus(sheet, insight), "+3");
  insight.competente = true;
  assert.equal(abilityBonus(sheet, insight), "+5");
  insight.maestria = true;
  assert.equal(abilityBonus(sheet, insight), "+7");
  sheet.livello = "5";
  assert.equal(abilityBonus(sheet, insight), "+9");
  sheet.caratteristiche.find((item) => item.abbr === "SAG").valore = "";
  assert.equal(abilityBonus(sheet, insight), "");
});

test("derived scores, saving throws, and passive perception", () => {
  const sheet = emptySheet();
  assert.equal(abilityModifier("9"), "-1");
  assert.equal(abilityModifier("10"), "0");
  assert.equal(abilityModifier("16"), "+3");
  assert.equal(abilityModifier("31"), "");
  assert.equal(proficiencyBonus("1"), "+2");
  assert.equal(proficiencyBonus("5"), "+3");
  assert.equal(proficiencyBonus("20"), "+6");
  const wisdom = sheet.caratteristiche.find((item) => item.abbr === "SAG");
  wisdom.valore = "16";
  assert.equal(savingThrowBonus(sheet, wisdom), "+3");
  wisdom.tsCompetente = true;
  assert.equal(savingThrowBonus(sheet, wisdom), "+5");
  const perception = sheet.abilita.find((item) => item.nome === "PERCEZIONE");
  perception.competente = true;
  assert.equal(passivePerception(sheet), "15");
});

test("normalization discards saved bonuses from older sheets", () => {
  const old = emptySheet();
  old.abilita[0].bonus = "+99";
  old.bonusCompetenza = "+2";
  old.percezionePassiva = "13";
  old.caratteristiche[0].modificatore = "-1";
  old.caratteristiche[0].tsBonus = "+1";
  const normalized = normalizeSheet(old);
  assert.equal(Object.hasOwn(normalized.abilita[0], "bonus"), false);
  assert.equal(Object.hasOwn(normalized, "bonusCompetenza"), false);
  assert.equal(Object.hasOwn(normalized, "percezionePassiva"), false);
  assert.equal(Object.hasOwn(normalized.caratteristiche[0], "modificatore"), false);
  assert.equal(Object.hasOwn(normalized.caratteristiche[0], "tsBonus"), false);
  assert.equal(normalized.abilita[0].maestria, false);
});
