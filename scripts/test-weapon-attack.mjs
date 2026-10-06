import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";
import { displayedWeaponAttack, weaponAttack } from "../lib/weaponAttack.ts";

const sheet = emptySheet();
sheet.livello = "5";
sheet.caratteristiche.find((item) => item.abbr === "FOR").valore = "16";
sheet.caratteristiche.find((item) => item.abbr === "DES").valore = "14";
sheet.competenzeArmi = ["Armi semplici"];

test("proficiency comes from category or individual weapon, once", () => {
  const dagger = { nome: "Pugnale", quantita: "1", bonus: "", note: "" };
  assert.equal(weaponAttack(sheet, dagger).attack, "+6");
  sheet.competenzeArmi.push("Pugnale");
  assert.equal(weaponAttack(sheet, dagger).attack, "+6");
  const sword = { ...dagger, nome: "Spada lunga" };
  assert.equal(weaponAttack(sheet, sword).attack, "+3");
  sheet.competenzeArmi.push("Spada lunga");
  assert.equal(weaponAttack(sheet, sword).attack, "+6");
});

test("finesse, thrown, ranged and versatile use the selected mode", () => {
  const dagger = { nome: "Pugnale", quantita: "1", bonus: "", note: "", caratteristica: "DES", modo: "lancio" };
  assert.equal(weaponAttack(sheet, dagger).attack, "+5");
  assert.equal(weaponAttack(sheet, dagger).damage, "1d4 +2 perforanti");
  const handaxe = { ...dagger, nome: "Ascia", caratteristica: undefined };
  assert.equal(weaponAttack(sheet, handaxe).attack, "+6");
  const bow = { ...dagger, nome: "Arco corto", modo: "base" };
  assert.equal(weaponAttack(sheet, bow).attack, "+5");
  const spear = { ...dagger, nome: "Lancia", modo: "dueMani" };
  assert.equal(weaponAttack(sheet, spear).damage, "1d8 +3 perforanti");
  assert.equal(weaponAttack(sheet, { ...bow, modo: "dueMani" }), null);
});

test("heavy weapons show the relevant Strength or Dexterity disadvantage", () => {
  const weak = structuredClone(sheet);
  weak.caratteristiche.find((item) => item.abbr === "FOR").valore = "12";
  weak.caratteristiche.find((item) => item.abbr === "DES").valore = "11";
  const weapon = { nome: "Spadone", quantita: "1", bonus: "", note: "" };
  assert.match(weaponAttack(weak, weapon).warnings.join(" "), /FOR inferiore a 13/);
  assert.match(weaponAttack(weak, { ...weapon, nome: "Arco lungo" }).warnings.join(" "), /DES inferiore a 13/);
  assert.deepEqual(weaponAttack(sheet, weapon).warnings, []);
});

test("manual attack bonus wins while damage remains derived", () => {
  const weapon = { nome: "Pugnale", quantita: "1", bonus: "+9", note: "", modo: "base", caratteristica: "DES" };
  assert.equal(displayedWeaponAttack(sheet, weapon), "+9");
  assert.equal(weaponAttack(sheet, weapon).attack, "+5");
  const normalized = normalizeSheet({ ...sheet, armi: [weapon] });
  assert.equal(normalized.armi[0].modo, "base");
  assert.equal(normalized.armi[0].caratteristica, "DES");
  assert.deepEqual(domainErrors(normalized), []);
  assert.match(domainErrors({ ...normalized, armi: [{ ...weapon, modo: "dueMani" }] }).join(" "), /modo/);
});

test("mastery is a separate explicit choice and requires proficiency", () => {
  const chosen = { ...sheet, padronanzeArmi: ["Pugnale"] };
  assert.deepEqual(domainErrors(chosen), []);
  assert.match(domainErrors({ ...chosen, competenzeArmi: [] }).join(" "), /manca competenza/);
  assert.match(domainErrors({ ...chosen, padronanzeArmi: ["Pugnale", "Pugnale"] }).join(" "), /duplicate/);
});

test("a historical magic bonus stays recorded without changing Manual attack or damage", () => {
  const weapon = { nome: "Pugnale", quantita: "1", bonus: "", note: "", bonusMagico: 1 };
  assert.equal(weaponAttack(sheet, weapon).attack, "+6");
  assert.equal(weaponAttack(sheet, weapon).damage, "1d4 +3 perforanti");
  assert.equal(normalizeSheet({ ...sheet, armi: [weapon] }).armi[0].bonusMagico, 1);
  assert.deepEqual(domainErrors({ ...sheet, armi: [weapon] }), []);
  assert.match(domainErrors({ ...sheet, armi: [{ ...weapon, bonusMagico: 0 }] }).join(" "), /bonus magico/);
});
