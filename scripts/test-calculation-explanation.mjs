import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet } from "../lib/sheet.ts";
import { calculationExplanation } from "../lib/calculationExplanation.ts";
import { weaponRange } from "../lib/weaponAttack.ts";
import { characterView } from "../lib/masterView.ts";
import { creatureAbilityExplanation, creatureActionStats } from "../lib/creature.ts";

const fighter = () => {
  const sheet = emptySheet();
  sheet.classe = "Guerriero";
  sheet.livello = "5";
  sheet.caratteristiche.find((item) => item.abbr === "FOR").valore = "16";
  sheet.caratteristiche.find((item) => item.abbr === "DES").valore = "14";
  sheet.competenzeArmi = ["Armi semplici", "Armi da guerra"];
  sheet.armi = [
    { nome: "Spada lunga", quantita: "1", bonus: "", note: "", modo: "dueMani" },
    { nome: "Alabarda", quantita: "1", bonus: "", note: "" },
    { nome: "Arco lungo", quantita: "1", bonus: "", note: "" },
    { nome: "Pugnale", quantita: "1", bonus: "", note: "", modo: "lancio" },
  ];
  return sheet;
};

test("weapon attack and damage explain the p. 41 formula", () => {
  const sheet = fighter();
  const attack = calculationExplanation(sheet, { kind: "weaponAttack", index: 0 });
  assert.equal(attack.result, "+6");
  assert.equal(attack.page, 41);
  assert.match(attack.formula, /FOR \+3 \+ competenza \+3 = \+6/);
  const damage = calculationExplanation(sheet, { kind: "weaponDamage", index: 0 });
  assert.equal(damage.result, "1d10 +3 taglienti");
  assert.ok(damage.details.some((detail) => detail.value.includes("versatile")));
});

test("reach and range follow pp. 26, 213 and 214", () => {
  const sheet = fighter();
  assert.equal(weaponRange(sheet.armi[0]).value, "1,5 m");
  assert.equal(calculationExplanation(sheet, { kind: "weaponRange", index: 1 }).result, "3 m");
  assert.equal(calculationExplanation(sheet, { kind: "weaponRange", index: 1 }).page, 214);
  const bow = calculationExplanation(sheet, { kind: "weaponRange", index: 2 });
  assert.equal(bow.result, "45/180 m");
  assert.equal(bow.page, 213);
  assert.equal(weaponRange(sheet.armi[3]).label, "Gittata");
  assert.equal(weaponRange({ ...sheet.armi[3], modo: undefined }).thrown, "6/18 m");
});

test("spell DC and attack explain the p. 238 formulas", () => {
  const sheet = emptySheet();
  sheet.classe = "Mago";
  sheet.livello = "5";
  sheet.caratteristiche.find((item) => item.abbr === "INT").valore = "16";
  assert.equal(calculationExplanation(sheet, { kind: "spellDc" }).result, "14");
  assert.equal(calculationExplanation(sheet, { kind: "spellAttack" }).result, "+6");
  sheet.caratteristiche.find((item) => item.abbr === "CAR").valore = "12";
  assert.equal(calculationExplanation(sheet, { kind: "spellDc", ability: "CAR" }).result, "12");
  assert.equal(calculationExplanation(emptySheet(), { kind: "spellDc" }), null);
});

test("speed explains the species base and the armor penalty", () => {
  const sheet = emptySheet();
  sheet.specie = "Umano";
  sheet.velocita = "6";
  sheet.equipaggiamento = [{ nome: "Cotta di maglia", dettaglio: "", catalogId: "cotta-di-maglia", indossato: true }];
  sheet.caratteristiche.find((item) => item.abbr === "FOR").valore = "12";
  const speed = calculationExplanation(sheet, { kind: "speed" });
  assert.equal(speed.result, "6 m");
  assert.match(speed.formula, /- 3 m \(armatura\) = 6 m/);
});

test("master view carries explanations and attack summaries", () => {
  const view = characterView("pg", "Prova", fighter());
  assert.equal(view.calc["weapon:0:attack"].result, "+6");
  assert.ok(view.calc["save:FOR"]);
  assert.deepEqual(view.attacks[1], { index: 1, name: "Alabarda", attack: "+6", damage: "1d10+3", damageType: "taglienti", range: { label: "Portata", value: "3 m" }, mastery: null, warnings: [] });
});

test("creature actions and abilities are split for quick reading", () => {
  const stats = creatureActionStats({ name: "Morso", attackType: "Tiro per colpire in mischia", hitBonus: 4, reachMeters: 1.5, hitDamage: 4, damageFormula: "1d4 + 2", damageType: "contundenti" });
  assert.deepEqual(stats, { hit: "+4", save: null, reach: "1,5 m", range: null, damage: { average: 4, formula: "1d4 + 2", type: "contundenti" } });
  const camel = creatureAbilityExplanation({ abbr: "COS", score: 17, save: 5 });
  assert.equal(camel.result, "MOD +3 · SALV +5");
});
