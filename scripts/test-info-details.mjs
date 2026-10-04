import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../lib/incantesimi-srd-2024.json" with { type: "json" };
import rules from "../lib/regole-srd-2024.json" with { type: "json" };
import { spellDetails } from "../lib/spells.ts";
import { languageDetails } from "../lib/languageDetails.ts";

test("every selectable spell has SRD casting details and an exact source page", () => {
  for (const name of catalog.incantesimi) {
    const spell = spellDetails(name);
    assert.ok(spell, name);
    assert.ok(spell.scuola && spell.tempo && spell.gittata && spell.componenti && spell.durata, name);
    assert.ok(spell.pagina >= 121 && spell.pagina <= 202, name);
  }
  assert.equal(spellDetails("CURA FERITE")?.livello, 1);
  assert.equal(spellDetails("Marchio del cacciatore")?.durata, "concentrazione, fino a 1 ora");
});

test("every selectable language has its own help text", () => {
  for (const name of [...rules.lingue.standard, ...rules.lingue.rare]) {
    const info = languageDetails(name);
    assert.ok(info?.meaning.includes(name), name);
    assert.ok(info?.page >= 22, name);
  }
  assert.match(languageDetails("Primordiale").meaning, /Aquan, Auran, Ignan e Terran/);
  assert.match(languageDetails("Druidico").meaning, /messaggi nascosti/);
});
