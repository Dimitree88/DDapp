import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { etichettaManuale, manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { weaponCatalog } from "../lib/weaponDetails.ts";
import { masteryEffects } from "../lib/weaponMastery.ts";
import { isWeaponProficient, WEAPON_PROFICIENCIES } from "../lib/weaponProficiencyRules.ts";
import { emptySheet } from "../lib/sheet.ts";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };

const DOMINIO = "equipaggiamento/armi";
const voci = (tipo) => manuale.voci(DOMINIO).filter((voce) => voce.tipo === tipo);

test("E01 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("E01");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("E01 the 38 weapons of the table on p. 215 match the app catalog field by field", () => {
  const armi = voci("arma");
  assert.equal(armi.length, 38);
  assert.deepEqual(armi.map((arma) => arma.nome).sort(), [...regole.armi.semplici, ...regole.armi.daGuerra].sort());
  for (const arma of armi) {
    const app = weaponCatalog.find((item) => item.name === arma.nome);
    assert.ok(app, arma.nome);
    const riga = arma.tabelle[0].righe[0];
    assert.equal(app.category, arma.categoria === "semplice" ? "semplici" : "daGuerra", arma.nome);
    assert.equal(app.kind, arma.attacco, arma.nome);
    assert.equal(app.damage, arma.danni, arma.nome);
    assert.equal(app.properties, riga[2], arma.nome);
    assert.equal(app.mastery.toLowerCase(), arma.padronanza.toLowerCase(), arma.nome);
    assert.equal(app.weightKg ?? null, arma.pesoKg, arma.nome);
    assert.ok(Math.abs(app.costGp - arma.costoMo) < 1e-9, arma.nome);
    const gittata = /gittata (\d+)\/(\d+)/.exec(riga[2]);
    assert.deepEqual(app.rangeMeters ? [...app.rangeMeters] : null, gittata ? [Number(gittata[1]), Number(gittata[2])] : null, arma.nome);
    assert.equal(app.versatileDie, /Versatile \(([^)]+)\)/i.exec(riga[2])?.[1], arma.nome);
    assert.equal(Boolean(app.finesse), /Accurata/i.test(riga[2]), arma.nome);
    assert.equal(Boolean(app.thrown), /Lancio/i.test(riga[2]), arma.nome);
  }
});

test("E01 properties, masteries and categories follow pp. 213-215", () => {
  assert.equal(voci("proprietaArma").length, 10);
  assert.deepEqual(voci("padronanza").map((voce) => voce.nome.toLowerCase()).sort(), Object.keys(masteryEffects).map((nome) => nome.toLowerCase()).sort());
  for (const voce of [...voci("proprietaArma"), ...voci("padronanza")]) assert.ok(voceManuale(DOMINIO, voce.nome).descrizione.length > 60, voce.nome);
  assert.deepEqual(voci("categoria").map((voce) => voce.nome).sort(), [...WEAPON_PROFICIENCIES].sort());
  for (const categoria of voci("categoria")) {
    const scheda = { ...emptySheet(), competenzeArmi: [categoria.nome] };
    const coperte = weaponCatalog.filter((arma) => isWeaponProficient(scheda, arma)).map((arma) => arma.name).sort();
    const attese = categoria.tabelle[0].righe.map(([nome]) => nome).sort();
    assert.deepEqual(coperte, attese, categoria.nome);
  }
  for (const nome of ["Competenze armi", "Padronanze scelte", "Armi"]) assert.ok(etichettaManuale(nome)?.descrizione?.length > 100, nome);
});

test("E01 the weapon attack rule of pp. 12 and 41 states the applied formula", () => {
  const regola = voceManuale("regole/attacchi", "Attacco con un'arma");
  assert.match(regola.descrizione, /Bonus di attacco in mischia = il modificatore di Forza \+ il bonus di competenza/);
  assert.equal(regola.voce.calcolo, "lib/weaponAttack.ts#weaponAttack");
});
