import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { etichettaManuale, manuale, privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { speciesSizes } from "../lib/creationRules.ts";
import { speciesSpeed } from "../lib/speed.ts";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };

test("V04 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("V04");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("V04 species and lineages match pp. 186-197 in both directions", () => {
  assert.deepEqual(manuale.voci("specie").map((voce) => voce.nome).sort(), [...regole.specie].sort());
  const lignaggi = Object.entries(regole.lignaggi).flatMap(([specie, elenco]) => elenco.map((nome) => `${specie}/${nome}`)).sort();
  assert.deepEqual(manuale.voci("lignaggi").map((voce) => `${voce.specie}/${voce.nome}`).sort(), lignaggi);
  for (const voce of manuale.voci("lignaggi").filter((item) => item.specie !== "Gnomo")) assert.equal(voce.tabelle[0].righe.length, 1, voce.nome);
});

test("V04 size and speed of each species match the app creation rules", () => {
  const taglie = (testo) => ["Minuscola", "Piccola", "Media", "Grande"].filter((taglia) => testo.startsWith(`${taglia} (`) || testo.includes(` o ${taglia} (`)).sort();
  for (const voce of manuale.voci("specie")) {
    assert.deepEqual(taglie(voce.taglia), [...speciesSizes[voce.nome]].sort(), voce.nome);
    assert.equal(Number(voce.velocita.replace(" metri", "").replace(",", ".")), speciesSpeed[voce.nome], voce.nome);
    assert.equal(voce.tipoCreatura, "Umanoide");
  }
  assert.match(voceManuale("lignaggi", "Elfo dei boschi").voce.tabelle[0].righe[0][1], /aumenta a 10,5 metri/);
});

test("V04 traits are found in their species and lineage context with level and text", () => {
  assert.equal(privilegioManuale("Scurovisione", { specie: "Nano" })?.descrizione, "Ha scurovisione fino a un raggio di 36 metri.");
  assert.equal(privilegioManuale("Scurovisione", { specie: "Elfo" })?.descrizione, "Il personaggio ha scurovisione fino a un raggio di 18 metri.");
  assert.equal(privilegioManuale("Volo draconico", { specie: "Dragonide", livello: 4 }), null);
  assert.equal(privilegioManuale("Volo draconico", { specie: "Dragonide", livello: 5 })?.voce.livello, 5);
  for (const voce of manuale.voci("specie")) {
    for (const tratto of voce.tratti) {
      const testo = privilegioManuale(tratto.nome, { specie: voce.nome })?.descrizione ?? "";
      assert.ok(testo.length > 30 && !/·|^[a-z]|\n-$/.test(testo), `${voce.nome}: ${tratto.nome}`);
    }
  }
  for (const nome of ["Specie", "Lignaggio"]) assert.ok(etichettaManuale(nome)?.descrizione?.length > 200, nome);
});
