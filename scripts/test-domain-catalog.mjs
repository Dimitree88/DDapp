import assert from "node:assert/strict";
import { test } from "node:test";
import { domainErrors } from "../lib/domain.ts";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";

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
  assert.equal(unusual.noteVelocita, "volo 18 m");
});
