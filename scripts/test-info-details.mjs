import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../lib/incantesimi-srd-2024.json" with { type: "json" };
import rules from "../lib/regole-srd-2024.json" with { type: "json" };
import { spellDetails } from "../lib/spells.ts";
import { languageDetails } from "../lib/languageDetails.ts";
import { weaponDetails } from "../lib/weaponDetails.ts";

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

test("language help shows only distinctive details", () => {
  assert.equal(languageDetails("Comune"), null);
  assert.equal(languageDetails("Abissale"), null);
  for (const name of ["Draconico", "Nanico", "Elfico", "Gigante", "Gnomesco", "Goblin", "Halfling", "Orchesco", "Druidico", "Gergo ladresco", "Primordiale"]) {
    const info = languageDetails(name);
    assert.ok(info?.meaning, name);
    assert.ok(!/lingua (standard|rara)|leggere e scrivere/i.test(info.meaning), name);
    assert.ok(info.page >= 22, name);
  }
  assert.match(languageDetails("Primordiale").meaning, /Aquan, Auran, Ignan e Terran/);
  assert.match(languageDetails("Druidico").meaning, /messaggi nascosti/);
});

test("weapon proficiency help identifies the actual weapons and their type", () => {
  for (const name of rules.armi.semplici) assert.match(weaponDetails("Armi semplici"), new RegExp(name));
  for (const name of rules.armi.daGuerra) assert.match(weaponDetails("Armi da guerra"), new RegExp(name));
  assert.equal(weaponDetails("Pugnale"), "Arma semplice da mischia.");
  assert.equal(weaponDetails("Arco lungo"), "Arma da guerra a distanza.");
});
