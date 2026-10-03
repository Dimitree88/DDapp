import assert from "node:assert/strict";
import { test } from "node:test";
import { domainErrors } from "../lib/domain.ts";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { numericDraftValid, numericValueValid } from "../lib/numeric.ts";

test("the catalog accepts migrated 2024 options and rejects names outside it", () => {
  const sheet = {
    ...emptySheet(),
    classe: "Ranger",
    sottoclasse: "Cacciatore",
    specie: "Elfo",
    lignaggio: "Elfo alto",
    background: "Eremita",
    allineamento: "Legale neutrale",
    taglia: "Media",
    lingue: ["Comune", "Sottocomune"],
    competenzeArmi: ["Armi semplici"],
    armi: [{ nome: "Arco corto", quantita: "1", bonus: "", danno: "", gittata: "", provenienza: "", note: "" }],
    talenti: [{ nome: "Guaritore", descrizione: "" }],
  };
  assert.deepEqual(domainErrors(sheet), []);
  assert.match(domainErrors({ ...sheet, specie: "Elfo Alto" }).join(" "), /Specie/);
  assert.match(domainErrors({ ...sheet, lingue: ["Sottocomune mercanti"] }).join(" "), /Lingua/);
});

test("legacy metric speed becomes numeric text without a unit", () => {
  assert.equal(normalizeSheet({ ...emptySheet(), velocita: "9 m" }).velocita, "9");
  const unusual = normalizeSheet({ ...emptySheet(), velocita: "volo 18 m" });
  assert.equal(unusual.velocita, "");
  assert.equal(Object.hasOwn(unusual, "noteVelocita"), false);
});

test("only levels 1 through 20 can be saved", () => {
  const sheet = emptySheet();
  sheet.livello = "20";
  assert.deepEqual(domainErrors(sheet), []);
  sheet.livello = "21";
  assert.match(domainErrors(sheet).join(" "), /Livello/);
});

test("numeric fields reject letters and symbols while signed fields accept a sign", () => {
  const sheet = emptySheet();
  sheet.puntiFerita = "12a";
  sheet.iniziativa = "+2!";
  sheet.caratteristiche[0].valore = "1d8";
  sheet.abilita[0].bonus = "++2";
  sheet.monete.oro = "3.5";
  assert.equal(domainErrors(sheet).filter((error) => /Punti ferita|Iniziativa|FOR valore|ATLETICA bonus|Monete oro/.test(error)).length, 5);
  assert.equal(numericDraftValid("+", "signed"), true);
  assert.equal(numericValueValid("+", "signed"), false);
  assert.equal(numericValueValid("-1", "signed"), true);
  assert.equal(numericValueValid("2D8", "dice"), true);
  assert.equal(numericValueValid("2D8x", "dice"), false);
});
