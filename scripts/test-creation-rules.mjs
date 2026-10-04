import assert from "node:assert/strict";
import { test } from "node:test";
import { creationErrors } from "../lib/creationRules.ts";
import { emptySheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";

const formed = () => {
  const sheet = emptySheet();
  Object.assign(sheet, { classe: "Ladro", specie: "Umano", background: "Criminale", taglia: "Media", creazioneCompletata: true });
  return sheet;
};

test("a formed character keeps its class and origin", () => {
  const sheet = formed();
  const changed = structuredClone(sheet);
  changed.background = "Soldato";
  changed.specie = "Elfo";
  assert.deepEqual(creationErrors(sheet, changed), ["specie", "background"]);
});

test("level gains remain possible while acquired choices stay protected", () => {
  const sheet = formed();
  sheet.lingue = ["Comune"];
  sheet.abilita[0].competente = true;
  sheet.talenti = [{ nome: "Allerta", scelte: "" }];
  const advanced = structuredClone(sheet);
  advanced.livello = "4";
  advanced.lingue.push("Elfico");
  advanced.abilita[1].competente = true;
  advanced.talenti.push({ nome: "Abile", scelte: "" });
  assert.deepEqual(creationErrors(sheet, advanced), []);
  advanced.lingue.shift();
  advanced.abilita[0].competente = false;
  advanced.talenti.shift();
  assert.deepEqual(creationErrors(sheet, advanced), ["lingua Comune", "competenza ATLETICA", "talento Allerta"]);
});

test("subclass can be chosen later and is fixed once selected", () => {
  const sheet = formed();
  const chosen = structuredClone(sheet);
  chosen.sottoclasse = "Furfante";
  assert.deepEqual(creationErrors(sheet, chosen), []);
  assert.deepEqual(creationErrors(chosen, sheet), ["sottoclasse"]);
});

test("base size follows the species options", () => {
  const sheet = formed();
  sheet.specie = "Gnomo";
  sheet.taglia = "Media";
  assert.match(domainErrors(sheet).join(" "), /Taglia Media non prevista per Gnomo/);
  sheet.taglia = "Piccola";
  assert.doesNotMatch(domainErrors(sheet).join(" "), /Taglia/);
});
