import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { crafterFeatTools } from "../lib/featToolProficiencies.ts";
import { featByName } from "../lib/featCatalog.ts";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };

test("T01 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("T01");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("T01 has the ten Origin feats of pp. 200-202 in both directions", () => {
  const voci = manuale.voci("talenti/origini");
  assert.deepEqual(voci.map((voce) => voce.nome).sort(), [...regole.talenti.origini].sort());
  for (const voce of voci) {
    assert.equal(voce.categoria, "Origini", voce.nome);
    assert.equal(voce.prerequisito, undefined, voce.nome);
    assert.equal(featByName(voce.nome)?.category, "origini", voce.nome);
    const testo = voceManuale("talenti/origini", voce.nome).descrizione;
    assert.ok(testo.length > 80 && !testo.startsWith("Talento"), voce.nome);
    assert.equal(voce.ripetibile, /\n\nRipetibile\./.test(testo), voce.nome);
  }
  assert.deepEqual(voci.filter((voce) => voce.ripetibile).map((voce) => voce.nome).sort(), ["Abile", "Iniziato alla magia"]);
});

test("T01 Lavoro manuale tools follow the Fabbricazione rapida table of p. 201", () => {
  const tabella = voceManuale("talenti/origini", "Lavoro manuale").voce.tabelle[0];
  assert.deepEqual(tabella.righe.map(([strumento]) => strumento).sort(), [...crafterFeatTools].sort());
});
