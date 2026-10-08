import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { manuale, voceManuale } from "../lib/manuale-2024/index.ts";

const ID = "I0-01";

test(`${ID} covers its spells with verified entries`, () => {
  const copertura = coperturaModulo(ID);
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  const file = manuale.file(`incantesimi/${ID}`);
  assert.equal(file.voci.length, 17);
  for (const voce of file.voci) {
    assert.equal(voce.tipo, "incantesimo");
    assert.equal(voce.livello, 0);
    assert.ok(voce.pagina >= 239 && voce.pagina <= 343, voce.nome);
    const descrizione = manuale.perId(voce.id)?.descrizione ?? "";
    assert.ok(descrizione.length > 30 && !/·|\|/.test(descrizione), `${voce.nome}: descrizione da controllare`);
  }
});

test(`${ID} spell data and descriptions match the PDF`, () => {
  const amicizia = voceManuale(`incantesimi/${ID}`, "Amicizia");
  assert.equal(amicizia.voce.scuola, "Ammaliamento");
  assert.deepEqual(amicizia.voce.classi, ["bardo", "mago", "stregone", "warlock"]);
  assert.match(amicizia.descrizione, /^L'incantatore emana magicamente un sentimento di amicizia/);
  assert.match(voceManuale(`incantesimi/${ID}`, "Guida").descrizione, /tocca una creatura consenziente|prova di caratteristica/i);
  assert.equal(voceManuale(`incantesimi/${ID}`, "Elementalismo").voce.scuola, "Trasmutazione");
});
