import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { addToolCompetency, removeToolCompetency, toolCompetencyDetails } from "../lib/toolCompetencies.ts";

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

test("manual tool proficiency can be added and removed with its source", () => {
  const sheet = normalizeSheet({ ...emptySheet(), classe: "Ranger" });
  Object.assign(sheet, addToolCompetency(sheet, "Arnesi da scasso"));
  assert.match(toolCompetencyDetails(sheet, "Arnesi da scasso"), /Aggiunta manuale/);
  Object.assign(sheet, removeToolCompetency(sheet, "Arnesi da scasso"));
  assert.equal(sheet.competenzeStrumenti.includes("Arnesi da scasso"), false);
  assert.equal(sheet.fontiCompetenze.some((record) => record.tipo === "strumento" && record.valore === "Arnesi da scasso"), false);
});
