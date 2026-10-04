import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../lib/incantesimi-srd-2024.json" with { type: "json" };
import rules from "../lib/regole-srd-2024.json" with { type: "json" };
import { spellDetails } from "../lib/spells.ts";
import { languageDetails } from "../lib/languageDetails.ts";
import { weaponDetails } from "../lib/weaponDetails.ts";
import { valueDetails } from "../lib/valueDetails.ts";
import { equipmentDetails } from "../lib/equipmentDetails.ts";
import { recordedValueDetails } from "../lib/recordedValueDetails.ts";
import { emptySheet } from "../lib/sheet.ts";

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
  for (const name of [...rules.armi.semplici, ...rules.armi.daGuerra]) {
    assert.match(weaponDetails(name), /Danni: .*\. Proprietà: .*\. Padronanza: /, name);
  }
  assert.match(weaponDetails("Pugnale"), /Arma semplice da mischia\. Danni: 1d4 perforanti/);
  assert.match(weaponDetails("Arco lungo"), /Arma da guerra a distanza\. Danni: 1d8 perforanti/);
});

test("every catalog value opens a specific explanation", () => {
  const choices = {
    allineamento: rules.allineamenti,
    classe: Object.keys(rules.classi),
    sottoclasse: Object.values(rules.classi).flat(),
    specie: rules.specie,
    lignaggio: Object.values(rules.lignaggi).flat(),
    background: rules.background,
    taglia: rules.taglie,
    talento: Object.values(rules.talenti).flat(),
    livello: rules.livelliPersonaggio,
    armatura: ["Leggere", "Medie", "Pesanti", "Scudi"],
  };
  for (const [kind, values] of Object.entries(choices)) {
    for (const value of values) assert.ok(valueDetails(kind, value)?.meaning, `${kind}: ${value}`);
  }
  assert.match(valueDetails("allineamento", "Caotico neutrale").meaning, /libertà personale/);
  assert.equal(valueDetails("allineamento", "Inventato"), null);
});

test("owned object help combines catalog facts and personal details", () => {
  assert.match(equipmentDetails("Armatura di cuoio borchiato").meaning, /CA 12/);
  assert.match(equipmentDetails("Torce", "x10").meaning, /Dettaglio personale: x10/);
  assert.deepEqual(equipmentDetails("Oggetto inventato", ""), null);
});

test("recorded values explain the selected character state", () => {
  const sheet = emptySheet();
  sheet.puntiFerita = "16";
  sheet.puntiFeritaMax = "20";
  sheet.classeArmatura = 14;
  assert.match(recordedValueDetails(sheet, "pf").meaning, /16 punti ferita attuali su 20 massimi/);
  assert.match(recordedValueDetails(sheet, "ca").meaning, /almeno 14/);
  assert.equal(recordedValueDetails(sheet, "pfMassimi").meaning.includes("20"), true);
});
