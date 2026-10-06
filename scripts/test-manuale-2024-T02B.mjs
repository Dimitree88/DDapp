import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo, INIZIO_T02B } from "./adeguamento-2024/copertura.ts";
import { differenzePrerequisiti } from "./adeguamento-2024/verifica-talenti.ts";
import { chiaveOrdinamento, manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };

const DOMINIO = "talenti/generali-b";

test("T02B covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("T02B");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("T02B has the General feats from «Incantatore rituale» (pp. 205-209) in both directions", () => {
  const attesi = regole.talenti.generali.filter((nome) => chiaveOrdinamento(nome) >= chiaveOrdinamento(INIZIO_T02B));
  const voci = manuale.voci(DOMINIO);
  assert.deepEqual(voci.map((voce) => voce.nome).sort(), [...attesi].sort());
  for (const voce of voci) {
    assert.equal(voce.categoria, "Generale", voce.nome);
    assert.match(voce.prerequisito, /^4° livello o superiore/, voce.nome);
    const testo = voceManuale(DOMINIO, voce.nome).descrizione;
    assert.ok(testo.length > 80 && !testo.startsWith("Talento"), voce.nome);
  }
  assert.deepEqual(voci.filter((voce) => voce.ripetibile).map((voce) => voce.nome).sort(), []);
});

test("T02B printed prerequisites match the app prerequisite logic", () => {
  for (const voce of manuale.voci(DOMINIO)) assert.deepEqual(differenzePrerequisiti(voce), [], voce.nome);
});
