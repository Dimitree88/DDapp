import assert from "node:assert/strict";
import { test } from "node:test";
import rules from "../lib/manuale-2024-domains.json" with { type: "json" };
import { classSavingThrows, grantClassProficiencies } from "../lib/classSavingThrows.ts";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";
import { isWeaponProficient } from "../lib/weaponProficiencyRules.ts";
import { weaponByName } from "../lib/weaponDetails.ts";

test("every catalog class grants its two saving throw proficiencies", () => {
  assert.deepEqual(Object.keys(classSavingThrows).sort(), Object.keys(rules.classi).sort());
  for (const name of Object.keys(rules.classi)) {
    const sheet = emptySheet();
    sheet.classe = name;
    const granted = grantClassProficiencies(sheet);
    assert.deepEqual(granted.caratteristiche.filter((item) => item.tsCompetente).map((item) => item.abbr), classSavingThrows[name], name);
    assert.equal(granted.fontiCompetenze.filter((record) => record.tipo === "tiroSalvezza").length, 2, name);
    assert.deepEqual(domainErrors(granted), [], name);
    assert.deepEqual(grantClassProficiencies(granted), granted, name);
    assert.deepEqual(normalizeSheet(normalizeSheet(granted)), normalizeSheet(granted), name);
  }
});

test("Druidic and Thieves' Cant are granted by their class feature", () => {
  for (const [className, language] of [["Druido", "Druidico"], ["Ladro", "Gergo ladresco"]]) {
    const sheet = normalizeSheet({ ...emptySheet(), classe: className });
    assert.ok(sheet.lingue.includes(language));
    assert.ok(sheet.fontiCompetenze.some((record) => record.tipo === "lingua" && record.valore === language && record.fonte === `Classe: ${className}`));
    assert.deepEqual(normalizeSheet(sheet), sheet);
  }
});

test("class grants keep an existing extra proficiency", () => {
  const sheet = emptySheet();
  sheet.classe = "Ranger";
  sheet.caratteristiche.find((item) => item.abbr === "COS").tsCompetente = true;
  const granted = grantClassProficiencies(sheet);
  assert.deepEqual(granted.caratteristiche.filter((item) => item.tsCompetente).map((item) => item.abbr), ["FOR", "DES", "COS"]);
});

test("fixed class weapon, armor and tool grants follow core traits", () => {
  const ranger = grantClassProficiencies({ ...emptySheet(), classe: "Ranger" });
  assert.deepEqual(ranger.competenzeArmi, ["Armi semplici", "Armi da guerra"]);
  assert.deepEqual(ranger.competenzeArmatura, { leggere: true, medie: true, pesanti: false, scudi: true });
  const monk = grantClassProficiencies({ ...emptySheet(), classe: "Monaco" });
  assert.ok(monk.competenzeArmi.includes("Armi da guerra leggere"));
  assert.ok(isWeaponProficient(monk, weaponByName("Spada corta")));
  assert.ok(!isWeaponProficient(monk, weaponByName("Stocco")));
  const rogue = grantClassProficiencies({ ...emptySheet(), classe: "Ladro" });
  assert.ok(rogue.competenzeArmi.includes("Armi da guerra accurate o leggere"));
  assert.ok(isWeaponProficient(rogue, weaponByName("Stocco")));
  assert.ok(!isWeaponProficient(rogue, weaponByName("Spadone")));
  assert.deepEqual(rogue.competenzeStrumenti, ["Arnesi da scasso"]);
  assert.deepEqual(grantClassProficiencies({ ...emptySheet(), classe: "Druido" }).competenzeStrumenti, ["Borsa da erborista"]);
});
