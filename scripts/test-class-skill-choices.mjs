import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { addClassSkillChoice, availableClassSkillChoices, classSkillChoices, remainingClassSkillChoices } from "../lib/classSkillChoices.ts";
import rules from "../lib/manuale-2024-domains.json" with { type: "json" };

test("all twelve class skill choices use the Manual's starting trait tables", () => {
  assert.deepEqual(Object.keys(classSkillChoices).sort(), Object.keys(rules.classi).sort());
  for (const [name, details] of Object.entries(classSkillChoices)) {
    assert.ok(details.names.length >= details.count, name);
    assert.equal(new Set(details.names).size, details.names.length, name);
    assert.ok(details.names.every((skill) => emptySheet().abilita.some((item) => item.nome === skill)), name);
  }
});

test("class skill choices record a source and stop at the class limit", () => {
  const ranger = normalizeSheet({ ...emptySheet(), classe: "Ranger", background: "Guida" });
  assert.equal(remainingClassSkillChoices(ranger), 3);
  assert.equal(availableClassSkillChoices(ranger).includes("FURTIVITÀ"), false);
  for (const name of ["ATLETICA", "INDAGARE", "PERCEZIONE"]) Object.assign(ranger, addClassSkillChoice(ranger, name));
  assert.equal(remainingClassSkillChoices(ranger), 0);
  assert.deepEqual(addClassSkillChoice(ranger, "NATURA"), {});
  assert.equal(ranger.fontiCompetenze.filter((record) => record.tipo === "abilita" && record.fonte === "Classe: Ranger").length, 3);
  assert.deepEqual(normalizeSheet(ranger), ranger);
});
