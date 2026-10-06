import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { etichettaManuale, manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { armorCatalog } from "../lib/armorCatalog.ts";
import { calculatedArmorClass } from "../lib/armorClass.ts";
import { emptySheet } from "../lib/sheet.ts";

const DOMINIO = "equipaggiamento/armature";
const CATEGORIE = { leggera: "leggere", media: "medie", pesante: "pesanti", scudo: "scudi" };

test("E02 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("E02");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("E02 the Armature table of p. 219 matches the app catalog in both directions", () => {
  const armature = manuale.voci(DOMINIO).filter((voce) => voce.tipo === "armatura");
  assert.deepEqual(armature.map((voce) => voce.nome).sort(), armorCatalog.map((armor) => armor.name).sort());
  for (const voce of armature) {
    const app = armorCatalog.find((armor) => armor.name === voce.nome);
    assert.equal(app.category, CATEGORIE[voce.categoria], voce.nome);
    assert.equal(app.baseAc, Math.abs(Number(voce.classeArmatura.split(" ")[0])), voce.nome);
    assert.equal(app.dexterity, voce.classeArmatura.includes("(max 2)") ? "max2" : voce.classeArmatura.includes("Des") ? "full" : "none", voce.nome);
    assert.equal(app.strength, voce.forza, voce.nome);
    assert.equal(Boolean(app.stealthDisadvantage), voce.svantaggioFurtivita, voce.nome);
    assert.equal(app.weightKg, voce.pesoKg, voce.nome);
    assert.equal(app.costGp, voce.costoMo, voce.nome);
  }
});

test("E02 Armor Class follows pp. 12, 41 and 219", () => {
  const scheda = (dex, armatura, competenze = { leggere: true, medie: true, pesanti: true, scudi: true }, scudo = false) => {
    const sheet = { ...emptySheet(), competenzeArmatura: competenze };
    sheet.caratteristiche = sheet.caratteristiche.map((item) => item.abbr === "DES" ? { ...item, valore: String(dex) } : item);
    sheet.equipaggiamento = [
      ...(armatura ? [{ nome: armatura, dettaglio: "", catalogId: armorCatalog.find((armor) => armor.name === armatura).id, indossato: true }] : []),
      ...(scudo ? [{ nome: "Scudo", dettaglio: "", catalogId: "scudo", impugnato: true }] : []),
    ];
    return calculatedArmorClass(sheet)?.value;
  };
  assert.equal(scheda(14, null), 12);
  assert.equal(scheda(16, "Armatura di cuoio"), 14);
  assert.equal(scheda(18, "Mezza armatura"), 17);
  assert.equal(scheda(18, "Cotta di maglia"), 16);
  assert.equal(scheda(10, "Armatura a piastre", undefined, true), 20);
  assert.equal(scheda(10, "Armatura a piastre", { leggere: true, medie: true, pesanti: true, scudi: false }, true), 18);
  const regola = voceManuale("regole/classe-armatura", "CA");
  assert.match(regola.descrizione, /CA base = 10 \+ il modificatore di Destrezza/);
  assert.ok(etichettaManuale("Competenze armatura")?.descrizione.includes("non può lanciare incantesimi"));
});
