import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo, INIZIO_T02B } from "./adeguamento-2024/copertura.ts";
import { differenzePrerequisiti } from "./adeguamento-2024/verifica-talenti.ts";
import { chiaveOrdinamento, manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };

const DOMINIO = "talenti/generali-a";

test("T02A covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("T02A");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("T02A has the General feats before «Incantatore rituale» (pp. 202-205) in both directions", () => {
  const attesi = regole.talenti.generali.filter((nome) => chiaveOrdinamento(nome) < chiaveOrdinamento(INIZIO_T02B));
  const voci = manuale.voci(DOMINIO);
  assert.deepEqual(voci.map((voce) => voce.nome).sort(), [...attesi].sort());
  for (const voce of voci) {
    assert.equal(voce.categoria, "Generale", voce.nome);
    assert.match(voce.prerequisito, /^4° livello o superiore/, voce.nome);
    const testo = voceManuale(DOMINIO, voce.nome).descrizione;
    assert.ok(testo.length > 80 && !testo.startsWith("Talento") && !/\. [A-Z][a-zà-ù' ]+ [a-zà-ù]+\. [A-Z]/.test(testo.split("\n\n")[1] ?? ""), voce.nome);
  }
  assert.deepEqual(voci.filter((voce) => voce.ripetibile).map((voce) => voce.nome).sort(), ["Adepto elementale", "Aumento dei punteggi di caratteristica"]);
});

test("T02A printed prerequisites match the app prerequisite logic", () => {
  for (const voce of manuale.voci(DOMINIO)) assert.deepEqual(differenzePrerequisiti(voce), [], voce.nome);
});
