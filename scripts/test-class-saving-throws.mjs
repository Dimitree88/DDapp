import assert from "node:assert/strict";
import { test } from "node:test";
import rules from "../lib/regole-srd-2024.json" with { type: "json" };
import { classSavingThrows, grantClassProficiencies } from "../lib/classSavingThrows.ts";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";

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
    assert.deepEqual(normalizeSheet(granted), granted, name);
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
  assert.ok(monk.competenzeArmi.includes("Spada corta"));
  assert.ok(!monk.competenzeArmi.includes("Stocco"));
  const rogue = grantClassProficiencies({ ...emptySheet(), classe: "Ladro" });
  assert.ok(rogue.competenzeArmi.includes("Stocco"));
  assert.ok(!rogue.competenzeArmi.includes("Spadone"));
  assert.deepEqual(rogue.competenzeStrumenti, ["Arnesi da scasso"]);
  assert.deepEqual(grantClassProficiencies({ ...emptySheet(), classe: "Druido" }).competenzeStrumenti, ["Borsa da erborista"]);
});
