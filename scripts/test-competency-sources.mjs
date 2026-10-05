import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";
import { grantCompetencies, setCheckboxCompetency } from "../lib/competencySources.ts";

test("normalizing a sheet preserves existing competence sources without changing choices", () => {
  const sheet = emptySheet();
  sheet.competenzeArmi = ["Armi semplici"];
  sheet.fontiCompetenze = [{ tipo: "arma", valore: "Armi semplici", fonte: "Classe" }];
  assert.deepEqual(domainErrors(sheet), []);
  assert.deepEqual(normalizeSheet(sheet).fontiCompetenze, sheet.fontiCompetenze);
  assert.match(domainErrors({ ...sheet, competenzeArmi: [] }).join(" "), /competenza non registrata/);
});

test("checked proficiencies can be unchecked and stay unchecked after saving", () => {
  const ranger = normalizeSheet({ ...emptySheet(), classe: "Ranger" });
  const withoutSave = normalizeSheet({ ...ranger, ...setCheckboxCompetency(ranger, "tiroSalvezza", "FOR", false) });
  assert.equal(withoutSave.caratteristiche.find((item) => item.abbr === "FOR").tsCompetente, false);
  assert.ok(!withoutSave.fontiCompetenze.some((record) => record.tipo === "tiroSalvezza" && record.valore === "FOR"));
  const withoutArmor = normalizeSheet({ ...withoutSave, ...setCheckboxCompetency(withoutSave, "armatura", "medie", false) });
  assert.equal(withoutArmor.competenzeArmatura.medie, false);
  assert.deepEqual(domainErrors(withoutArmor), []);
  const trained = { ...withoutArmor, ...grantCompetencies(withoutArmor, [{ tipo: "abilita", valore: "ATLETICA", fonte: "Scelta" }]) };
  const withoutSkill = normalizeSheet({ ...trained, ...setCheckboxCompetency(trained, "abilita", "ATLETICA", false) });
  assert.equal(withoutSkill.abilita.find((item) => item.nome === "ATLETICA").competente, false);
  assert.ok(!withoutSkill.fontiCompetenze.some((record) => record.tipo === "abilita" && record.valore === "ATLETICA"));
  assert.deepEqual(domainErrors(withoutSkill), []);
});

test("a declared source grants its competence once and preserves manual choices", () => {
  const sheet = emptySheet();
  const sources = [
    { tipo: "abilita", valore: sheet.abilita[0].nome, fonte: "Classe" },
    { tipo: "tiroSalvezza", valore: "FOR", fonte: "Classe" },
    { tipo: "arma", valore: "Armi semplici", fonte: "Classe" },
    { tipo: "armatura", valore: "leggere", fonte: "Classe" },
    { tipo: "strumento", valore: "Borsa da erborista", fonte: "Background" },
    { tipo: "lingua", valore: "Elfico", fonte: "Specie" },
  ];
  const granted = { ...sheet, ...grantCompetencies(sheet, sources) };
  assert.equal(granted.abilita[0].competente, true);
  assert.equal(granted.caratteristiche.find((item) => item.abbr === "FOR").tsCompetente, true);
  assert.deepEqual(granted.competenzeArmi, ["Armi semplici"]);
  assert.equal(granted.competenzeArmatura.leggere, true);
  assert.deepEqual(granted.competenzeStrumenti, ["Borsa da erborista"]);
  assert.deepEqual(granted.lingue, ["Elfico"]);
  assert.deepEqual(domainErrors(granted), []);
  assert.deepEqual({ ...granted, ...grantCompetencies(granted, sources) }, granted);
  assert.deepEqual(grantCompetencies(granted, []), { fontiCompetenze: [] });
  assert.deepEqual(grantCompetencies(sheet, [{ tipo: "lingua", valore: "Elfico", fonte: "" }]), {
    fontiCompetenze: [{ tipo: "lingua", valore: "Elfico", fonte: "" }],
  });
});
