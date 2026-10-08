import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { manuale, voceManuale } from "../lib/manuale-2024/index.ts";

const ID = "I0-02";

test(`${ID} covers its spells with verified entries`, () => {
  const copertura = coperturaModulo(ID);
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  const f = manuale.file(`incantesimi/${ID}`);
  assert.equal(f.voci.length, 17);
  for (const voce of f.voci) {
    assert.equal(voce.tipo, "incantesimo");
    assert.equal(voce.livello, 0);
    assert.ok(voce.pagina >= 239 && voce.pagina <= 343, voce.nome);
    assert.ok((voce.classi ?? []).length > 0, `${voce.nome}: classi`);
    const d = manuale.perId(voce.id)?.descrizione ?? "";
    assert.ok(d.length > 30 && !/·|\|/.test(d), `${voce.nome}: descrizione da controllare`);
  }
});

test(`${ID} first spell resolves`, () => {
  const v = voceManuale(`incantesimi/${ID}`, "Messaggio");
  assert.ok(v && v.descrizione && v.descrizione.length > 30);
  assert.equal(v.voce.livello, 0);
});
