import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { chiaveRicerca, etichettaManuale, manuale } from "../lib/manuale-2024/index.ts";
import { BLOCCHI_E04 } from "../lib/manuale-2024/domini.ts";
import { gearCatalog } from "../lib/gearCatalog.ts";
import matrice from "../docs/adeguamento-2024/matrice.json" with { type: "json" };

const voci = BLOCCHI_E04.flatMap(({ dominio }) => manuale.voci(dominio).map((voce) => ({ voce, dominio })));
const trova = (nome) => voci.find(({ voce }) => [voce.nome, ...(voce.alias ?? [])].some((item) => chiaveRicerca(item) === chiaveRicerca(nome)));

test("E04 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("E04");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("E04 blocks hold the 82 rows of p. 223 plus 16 variants, at most 25 per file", () => {
  assert.equal(voci.length, 98);
  assert.equal(voci.filter(({ voce }) => !voce.varianteDi).length, 82);
  for (const { dominio } of BLOCCHI_E04) {
    const quante = voci.filter((item) => item.dominio === dominio).length;
    assert.equal(quante, matrice.confini.E04.conteggi[dominio], dominio);
    assert.ok(quante <= 25, dominio);
  }
});

test("E04 app adventuring gear matches weight, cost and quantity of the manual", () => {
  const app = gearCatalog.filter((gear) => !gear.tool);
  for (const gear of app) {
    const trovato = trova(gear.name);
    assert.ok(trovato, gear.name);
    const { voce } = trovato;
    const quantita = voce.quantitaPrezzo ?? 1;
    assert.equal(gear.priceQuantity, voce.quantitaPrezzo, gear.name);
    assert.equal(gear.costGp ?? null, voce.costoMo, gear.name);
    if (voce.pesoKg === null) assert.equal(gear.weightKg, undefined, gear.name);
    else assert.ok(Math.abs(gear.weightKg - voce.pesoKg / quantita) < 1e-9, gear.name);
  }
  const senzaApp = voci.filter(({ voce }) => !app.some((gear) => trova(gear.name)?.voce === voce)).map(({ voce }) => voce.nome);
  assert.deepEqual(senzaApp, ["Munizioni"]);
});

test("E04 every main item has its description and the label explains the table", () => {
  for (const { voce, dominio } of voci.filter(({ voce }) => !voce.varianteDi)) {
    const testo = manuale.voce(dominio, voce.nome)?.descrizione ?? "";
    assert.ok(testo.length > 20 && !/\n\n[^\p{L}]*$/u.test(testo) && !/\(\d.*M[OAR]\)/.test(testo), voce.nome);
  }
  assert.match(etichettaManuale("Oggetti").descrizione, /ordine alfabetico/);
});
