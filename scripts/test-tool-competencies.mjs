import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { addToolCompetency, pendingToolChoiceSources, removeToolCompetency, toolCompetencyDetails } from "../lib/toolCompetencies.ts";
import { crafterFeatTools, musicalTools } from "../lib/featToolProficiencies.ts";
import { setCheckboxCompetency } from "../lib/competencySources.ts";

test("class and background tool grants have a visible origin and stay locked", () => {
  const druid = normalizeSheet({ ...emptySheet(), classe: "Druido", background: "Guida" });
  assert.match(toolCompetencyDetails(druid, "Borsa da erborista"), /Classe: Druido/);
  assert.match(toolCompetencyDetails(druid, "Strumenti da cartografo"), /Background: Guida/);
  assert.deepEqual(removeToolCompetency(druid, "Borsa da erborista"), {});
  assert.deepEqual(removeToolCompetency(druid, "Strumenti da cartografo"), {});
  assert.deepEqual(normalizeSheet(druid), druid);
});

test("Ephemer's Hermit background and Crafter choices grant four tool proficiencies", () => {
  const ephemer = normalizeSheet({ ...emptySheet(), classe: "Ranger", background: "Eremita", talenti: [{ nome: "Lavoro manuale", scelte: "falegname, fabbro, inventore" }] });
  assert.deepEqual(ephemer.competenzeStrumenti, ["Borsa da erborista", "Strumenti da falegname", "Strumenti da fabbro", "Strumenti da inventore"]);
  assert.match(toolCompetencyDetails(ephemer, "Borsa da erborista"), /Background: Eremita/);
  assert.match(toolCompetencyDetails(ephemer, "Strumenti da fabbro"), /Talento: Lavoro manuale/);
  assert.deepEqual(removeToolCompetency(ephemer, "Strumenti da fabbro"), {});
  assert.deepEqual(normalizeSheet(ephemer), ephemer);
});

test("tool proficiency cannot be added without an unfilled grant", () => {
  const sheet = normalizeSheet({ ...emptySheet(), classe: "Ranger" });
  assert.deepEqual(addToolCompetency(sheet, "Arnesi da scasso"), {});
  assert.deepEqual(removeToolCompetency(sheet, "Arnesi da scasso"), {
    competenzeStrumenti: sheet.competenzeStrumenti,
    fontiCompetenze: sheet.fontiCompetenze,
  });
  assert.equal(sheet.competenzeStrumenti.includes("Arnesi da scasso"), false);
  assert.equal(sheet.fontiCompetenze.some((record) => record.tipo === "strumento" && record.valore === "Arnesi da scasso"), false);
});

test("Crafter and Musician use the choices on Manual pages 201 and 202", () => {
  assert.equal(crafterFeatTools.length, 8);
  assert.equal(musicalTools.length, 10);
  const sheet = normalizeSheet({ ...emptySheet(), classe: "Ranger", talenti: [
    { nome: "Lavoro manuale", scelte: "conciatore, muratore, vasaio" },
    { nome: "Musicista", scelte: "Flauto, Liuto, Viola" },
  ] });
  for (const name of ["Strumenti da conciatore", "Strumenti da muratore", "Strumenti da vasaio", "Flauto", "Liuto", "Viola"]) {
    assert.ok(sheet.competenzeStrumenti.includes(name));
    assert.deepEqual(removeToolCompetency(sheet, name), {});
  }
  assert.match(toolCompetencyDetails(sheet, "Liuto"), /Talento: Musicista/);
});

test("chosen background and class tools receive their actual source", () => {
  const bard = normalizeSheet({ ...emptySheet(), classe: "Bardo", background: "Intrattenitore" });
  assert.deepEqual(pendingToolChoiceSources(bard), [
    { source: "Background: Intrattenitore", remaining: 1 },
    { source: "Classe: Bardo", remaining: 3 },
  ]);
  for (const name of ["Flauto", "Liuto", "Viola", "Lira"]) Object.assign(bard, addToolCompetency(bard, name));
  assert.deepEqual(pendingToolChoiceSources(bard), []);
  assert.deepEqual(bard.fontiCompetenze.filter((item) => item.tipo === "strumento").map((item) => item.fonte), [
    "Background: Intrattenitore", "Classe: Bardo", "Classe: Bardo", "Classe: Bardo",
  ]);
  assert.deepEqual(removeToolCompetency(bard, "Flauto"), {});

  const monk = normalizeSheet({ ...emptySheet(), classe: "Monaco", background: "Guardia" });
  Object.assign(monk, addToolCompetency(monk, "Dadi"));
  Object.assign(monk, addToolCompetency(monk, "Strumenti da fabbro"));
  assert.deepEqual(pendingToolChoiceSources(monk), []);
  assert.match(toolCompetencyDetails(monk, "Dadi"), /Background: Guardia/);
  assert.match(toolCompetencyDetails(monk, "Strumenti da fabbro"), /Classe: Monaco/);
});

test("background grants its two fixed skills once and preserves corrections", () => {
  const guard = normalizeSheet({ ...emptySheet(), background: "Guardia" });
  for (const name of ["ATLETICA", "PERCEZIONE"]) {
    assert.equal(guard.abilita.find((skill) => skill.nome === name).competente, true);
    assert.ok(guard.fontiCompetenze.some((record) => record.tipo === "abilita" && record.valore === name && record.fonte === "Background: Guardia"));
  }
  const corrected = normalizeSheet({ ...guard, ...setCheckboxCompetency(guard, "abilita", "ATLETICA", false) });
  assert.equal(corrected.abilita.find((skill) => skill.nome === "ATLETICA").competente, false);
  assert.equal(corrected.abilita.find((skill) => skill.nome === "PERCEZIONE").competente, true);
  assert.deepEqual(normalizeSheet(corrected), corrected);
});
