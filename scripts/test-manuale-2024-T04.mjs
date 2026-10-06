import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrerequisiti } from "./adeguamento-2024/verifica-talenti.ts";
import { manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { featByName } from "../lib/featCatalog.ts";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };

const DOMINIO = "talenti/doni-epici";

test("T04 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("T04");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("T04 has the twelve Epic Boons of pp. 210-211 in both directions", () => {
  const voci = manuale.voci(DOMINIO);
  assert.deepEqual(voci.map((voce) => voce.nome).sort(), [...regole.talenti.donoEpico].sort());
  for (const voce of voci) {
    assert.equal(voce.categoria, "Dono epico", voce.nome);
    assert.match(voce.prerequisito, /^19° livello o superiore/, voce.nome);
    assert.equal(voce.ripetibile, false, voce.nome);
    assert.equal(featByName(voce.nome)?.category, "donoEpico", voce.nome);
    const testo = voceManuale(DOMINIO, voce.nome).descrizione;
    assert.match(testo, /fino a un massimo di 30\./, voce.nome);
  }
});

test("T04 printed prerequisites match the app prerequisite logic", () => {
  for (const voce of manuale.voci(DOMINIO)) assert.deepEqual(differenzePrerequisiti(voce), [], voce.nome);
});
