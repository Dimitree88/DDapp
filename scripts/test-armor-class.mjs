import assert from "node:assert/strict";
import { test } from "node:test";
import { armorCatalog } from "../lib/armorCatalog.ts";
import { calculatedArmorClass, displayedArmorClass } from "../lib/armorClass.ts";
import { domainErrors } from "../lib/domain.ts";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";

test("all twelve SRD armors and shield have distinct IDs", () => {
  assert.equal(armorCatalog.length, 13);
  assert.equal(new Set(armorCatalog.map((item) => item.id)).size, 13);
  assert.deepEqual(armorCatalog.filter((item) => item.category === "scudi").map((item) => item.name), ["Scudo"]);
});

test("old AC remains visible when Destrezza is missing", () => {
  const old = emptySheet();
  old.classeArmatura = 17;
  delete old.classeArmaturaModo;
  old.scudo = true;
  old.equipaggiamento = [{ nome: "Armatura di cuoio", dettaglio: "" }];
  const sheet = normalizeSheet(old);
  assert.equal(displayedArmorClass(sheet), "17");
  assert.equal(calculatedArmorClass(sheet), null);
  assert.equal(sheet.equipaggiamento[0].indossato, undefined);
});

test("worn armor and held shield determine AC automatically", () => {
  const sheet = emptySheet();
  sheet.caratteristiche.find((item) => item.abbr === "DES").valore = "16";
  sheet.caratteristiche.find((item) => item.abbr === "FOR").valore = "12";
  sheet.competenzeArmatura.scudi = true;
  sheet.equipaggiamento = [
    { nome: "Giaco di maglia", catalogId: "giaco-di-maglia", dettaglio: "", indossato: true, quantita: "1" },
    { nome: "Scudo", catalogId: "scudo", dettaglio: "", impugnato: true },
  ];
  assert.equal(calculatedArmorClass(sheet).value, 17);
  assert.equal(displayedArmorClass(sheet), "17");
  assert.deepEqual(domainErrors(sheet), []);
  sheet.competenzeArmatura.scudi = false;
  assert.equal(calculatedArmorClass(sheet).value, 15);
  assert.match(calculatedArmorClass(sheet).warnings.join(" "), /senza competenza/);
  sheet.equipaggiamento.push({ nome: "Cotta di maglia", catalogId: "cotta-di-maglia", dettaglio: "", indossato: true });
  assert.match(domainErrors(sheet).join(" "), /sola armatura/);
});

test("normalization removes historical magic bonuses from armor and shield", () => {
  const sheet = emptySheet();
  sheet.caratteristiche.find((item) => item.abbr === "DES").valore = "14";
  sheet.competenzeArmatura.scudi = true;
  sheet.equipaggiamento = [
    { nome: "Armatura di cuoio", catalogId: "armatura-di-cuoio", dettaglio: "", indossato: true, bonusMagico: 1 },
    { nome: "Scudo", catalogId: "scudo", dettaglio: "", impugnato: true, bonusMagico: 2 },
  ];
  const normalized = normalizeSheet(sheet);
  assert.equal(calculatedArmorClass(normalized).value, 15);
  assert.deepEqual(normalized.equipaggiamento.map((item) => Object.hasOwn(item, "bonusMagico")), [false, false]);
  assert.deepEqual(domainErrors(normalized), []);
  normalized.equipaggiamento[1].impugnato = false;
  assert.equal(calculatedArmorClass(normalized).value, 13);
});

test("automatic AC updates with Destrezza and ignores a saved manual override", () => {
  const sheet = emptySheet();
  sheet.classeArmatura = 19;
  sheet.caratteristiche.find((item) => item.abbr === "DES").valore = "14";
  assert.equal(displayedArmorClass(sheet), "12");
  sheet.scudo = true;
  sheet.competenzeArmatura.scudi = true;
  assert.equal(displayedArmorClass(sheet), "14");
  sheet.classeArmaturaOverride = 18;
  assert.equal(displayedArmorClass(sheet), "14");
  const normalized = normalizeSheet(sheet);
  assert.equal("classeArmaturaOverride" in normalized, false);
  sheet.caratteristiche.find((item) => item.abbr === "DES").valore = "16";
  assert.equal(displayedArmorClass(sheet), "15");
});
