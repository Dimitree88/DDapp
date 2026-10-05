import assert from "node:assert/strict";
import { test } from "node:test";
import catalog from "../lib/incantesimi-srd-2024.json" with { type: "json" };
import rules from "../lib/regole-srd-2024.json" with { type: "json" };
import { canonicalSpellName, spellDetails, spellNames } from "../lib/spells.ts";
import { languageDetails } from "../lib/languageDetails.ts";
import { weaponCatalog, weaponDetails, weaponNames } from "../lib/weaponDetails.ts";
import { valueDetails } from "../lib/valueDetails.ts";
import { equipmentDetails } from "../lib/equipmentDetails.ts";
import { recordedValueDetails } from "../lib/recordedValueDetails.ts";
import { emptySheet } from "../lib/sheet.ts";

test("selectable spell names use the manual and retain known details", () => {
  for (const name of catalog.incantesimi) {
    if (canonicalSpellName(name) !== name) continue;
    const spell = spellDetails(name);
    assert.ok(spell, name);
    assert.ok(spell.scuola && spell.tempo && spell.gittata && spell.componenti && spell.durata, name);
    assert.ok(spell.pagina >= 121 && spell.pagina <= 202, name);
  }
  for (const [oldName, manualName] of [
    ["Aura magica dell'arcanista", "Aura magica di Nystul"],
    ["Capanna", "Capanna di Leomund"],
    ["Freccia acida", "Freccia acida di Melf"],
    ["Mano arcana", "Mano magica"],
    ["Salto", "Saltare"],
    ["Sfera congelante", "Sfera congelante di Otiluke"],
    ["Sfera elastica", "Sfera elastica di Otiluke"],
    ["Spada arcana", "Spada di Mordenkainen"],
  ]) {
    assert.ok(!spellNames.includes(oldName), oldName);
    assert.ok(spellNames.includes(manualName), manualName);
    assert.equal(canonicalSpellName(oldName), manualName);
    assert.ok(spellDetails(manualName), manualName);
  }
  for (const name of ["Aura di vitalità", "Fonte di luce lunare", "Freccia folgorante", "Frusta di spine", "Rombo di tuono", "Tempesta radiosa di Jallarzi"]) {
    assert.ok(spellNames.includes(name), name);
    assert.ok(spellDetails(name), name);
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

test("weapon catalog covers each selectable weapon with stable metadata", () => {
  const catalogNames = [...rules.armi.semplici, ...rules.armi.daGuerra];
  assert.deepEqual(new Set(weaponNames), new Set(catalogNames));
  assert.equal(weaponCatalog.length, catalogNames.length);
  assert.equal(new Set(weaponCatalog.map((weapon) => weapon.id)).size, weaponCatalog.length);
  for (const weapon of weaponCatalog) {
    assert.ok(weapon.id && weapon.damage && weapon.properties && weapon.mastery, weapon.name);
    assert.ok(rules.armi[weapon.category].includes(weapon.name), weapon.name);
    assert.equal(weapon.source, "Manuale del Giocatore 2024");
    assert.equal(weapon.pages, "215-216");
    assert.ok(weapon.costGp > 0, weapon.name);
    assert.ok(weapon.weightKg === undefined || weapon.weightKg > 0, weapon.name);
    assert.equal(Boolean(weapon.finesse), /Accurata/i.test(weapon.properties), weapon.name);
    assert.equal(Boolean(weapon.thrown), /Lancio \(/i.test(weapon.properties), weapon.name);
    assert.equal(weapon.versatileDie, /Versatile \(([^)]+)\)/i.exec(weapon.properties)?.[1], weapon.name);
  }
  assert.equal(weaponCatalog.find((weapon) => weapon.name === "Pugnale")?.kind, "mischia");
  assert.deepEqual(weaponCatalog.find((weapon) => weapon.name === "Pugnale")?.rangeMeters, [6, 18]);
  assert.equal(weaponCatalog.find((weapon) => weapon.name === "Arco lungo")?.kind, "distanza");
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
  for (const kind of ["classe", "sottoclasse", "specie", "lignaggio", "background", "talento", "allineamento", "taglia", "armatura"]) {
    for (const value of choices[kind]) assert.ok(valueDetails(kind, value)?.page, `${kind}: ${value}`);
  }
  assert.equal(equipmentDetails("Pozione di guarigione")?.page, 227);
  assert.equal(equipmentDetails("Torcia")?.page, 228);
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
  assert.match(recordedValueDetails(sheet, "ca").meaning, /Classe Armatura: 14\. Valore storico/);
  assert.equal(recordedValueDetails(sheet, "pfMassimi").meaning.includes("20"), true);
});
