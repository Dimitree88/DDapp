import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { etichettaManuale, manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };

test("V01 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("V01");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("V01 alignments match the nine options of p. 39 in both directions", () => {
  const voci = manuale.voci("allineamenti");
  assert.deepEqual(voci.map((voce) => voce.nome).sort(), [...regole.allineamenti].sort());
  for (const nome of regole.allineamenti) {
    const risultato = voceManuale("allineamenti", nome);
    assert.equal(risultato?.riferimento, "Manuale del Giocatore 2024, p. 39", nome);
    assert.ok(risultato.descrizione && risultato.descrizione.length > 80, nome);
    const altri = regole.allineamenti.filter((altro) => altro !== nome && !nome.includes(altro));
    assert.ok(!altri.some((altro) => risultato.descrizione.startsWith(altro)), nome);
  }
  assert.equal(voceManuale("allineamenti", "CN")?.voce.nome, "Caotico neutrale");
  assert.equal(voceManuale("allineamenti", "Senza allineamento"), null);
});

test("V01 the Allineamento label shows the glossary definition and the creation step", () => {
  const etichetta = etichettaManuale("Allineamento");
  assert.equal(etichetta?.riferimento, "Manuale del Giocatore 2024, pp. 39, 361");
  assert.equal(etichetta.descrizione.split("\n\n").length, 5);
});
