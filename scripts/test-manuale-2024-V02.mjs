import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { etichettaManuale, manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { abilityModifier, passivePerception } from "../lib/abilityBonus.ts";
import { carryingCapacity } from "../lib/inventoryWeight.ts";
import { emptySheet } from "../lib/sheet.ts";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };
import entita from "../lib/manuale-2024-entities.json" with { type: "json" };

test("V02 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("V02");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("V02 catalogs match the manual lists in both directions", () => {
  const nomi = (dominio) => manuale.voci(dominio).map((voce) => voce.nome.toLocaleLowerCase("it")).sort();
  const minuscole = (elenco) => elenco.map((nome) => nome.toLocaleLowerCase("it")).sort();
  assert.deepEqual(nomi("caratteristiche"), minuscole(emptySheet().caratteristiche.map((item) => item.nome)));
  assert.deepEqual(nomi("abilita"), minuscole(emptySheet().abilita.map((item) => item.nome)));
  assert.deepEqual(nomi("taglie"), minuscole(regole.taglie));
  assert.deepEqual(nomi("lingue"), minuscole([...regole.lingue.standard, ...regole.lingue.rare]));
  assert.deepEqual(nomi("condizioni"), minuscole(entita.conditions));
  for (const abilita of emptySheet().abilita) assert.equal(voceManuale("abilita", abilita.nome)?.voce.caratteristica, abilita.caratteristica, abilita.nome);
  assert.deepEqual(manuale.voci("lingue").filter((voce) => voce.gruppo === "standard").map((voce) => voce.nome.toLocaleLowerCase("it")).sort(), minuscole(regole.lingue.standard));
});

test("V02 modifier table of p. 10 matches the applied formula", () => {
  const tabella = voceManuale("regole/caratteristiche", "Modificatore di caratteristica").voce.tabelle.find((item) => item.titolo === "Modificatori di caratteristica");
  for (const [intervallo, modificatore] of tabella.righe) {
    const [da, a = da] = intervallo.split("-").map(Number);
    for (let punteggio = da; punteggio <= a; punteggio++) assert.equal(abilityModifier(String(punteggio)), modificatore === "+0" ? "0" : modificatore, String(punteggio));
  }
});

test("V02 passive Perception and carrying capacity follow pp. 40 and 363", () => {
  const scheda = emptySheet();
  scheda.livello = "1";
  scheda.caratteristiche = scheda.caratteristiche.map((item) => item.abbr === "SAG" ? { ...item, valore: "15" } : item.abbr === "FOR" ? { ...item, valore: "12" } : item);
  scheda.abilita = scheda.abilita.map((item) => item.nome === "PERCEZIONE" ? { ...item, competente: true } : item);
  assert.equal(passivePerception(scheda), "14");
  const tabella = voceManuale("regole/caratteristiche", "Capacità di trasporto").voce.tabelle[0];
  for (const [taglie, massimo] of tabella.righe) {
    for (const taglia of taglie.split("/")) {
      assert.equal(carryingCapacity({ ...scheda, taglia }), 12 * Number(massimo.match(/× ([\d,]+)/)[1].replace(",", ".")), taglia);
    }
  }
});

test("V02 labels and conditions show manual text without extraction artifacts", () => {
  for (const nome of ["Lingue", "Taglia base", "Abilità", "Condizioni"]) assert.ok(etichettaManuale(nome)?.descrizione?.length > 100, nome);
  for (const voce of manuale.voci("condizioni")) {
    const testo = voceManuale("condizioni", voce.nome).descrizione;
    assert.match(testo, /^Quando il tuo personaggio ha la condizione/, voce.nome);
    assert.doesNotMatch(testo, /\bO\b|ingrado|qi indebolimento/, voce.nome);
  }
});
