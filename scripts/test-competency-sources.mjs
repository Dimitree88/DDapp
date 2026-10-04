import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";

test("competence sources annotate existing choices without granting them implicitly", () => {
  const sheet = emptySheet();
  sheet.competenzeArmi = ["Armi semplici"];
  sheet.fontiCompetenze = [{ tipo: "arma", valore: "Armi semplici", fonte: "Classe" }];
  assert.deepEqual(domainErrors(sheet), []);
  assert.deepEqual(normalizeSheet(sheet).fontiCompetenze, sheet.fontiCompetenze);
  assert.match(domainErrors({ ...sheet, competenzeArmi: [] }).join(" "), /competenza non registrata/);
});
