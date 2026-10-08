import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { bloccoIncantesimo, manuale } from "../lib/manuale-2024/index.ts";
import { moduliBlocchiIncantesimi } from "./adeguamento-2024/copertura.ts";
import blocchi from "../lib/manuale-2024/incantesimi/blocchi.json" with { type: "json" };
import { spellDetails, spellNames } from "../lib/spells.ts";

const indice = JSON.parse(readFileSync("docs/adeguamento-2024/indice-incantesimi.json", "utf8"));

test("I00 registers 25 spell blocks with their files, state and empty voci", () => {
  assert.equal(moduliBlocchiIncantesimi.length, 25);
  for (const blocco of blocchi.blocchi) {
    const file = manuale.file(`incantesimi/${blocco.id}`);
    assert.ok(file, `manca il file del blocco ${blocco.id}`);
    assert.equal(file.modulo, blocco.id);
    assert.deepEqual(file.voci, [], `${blocco.id}: le voci spettano al task del blocco`);
    const stato = JSON.parse(readFileSync(`docs/adeguamento-2024/stato/${blocco.id}.json`, "utf8"));
    assert.equal(stato.id, blocco.id);
  }
});

test("I00 index covers every spell of the app, each block within 20 voci", () => {
  const perChiave = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  let totale = 0;
  const visti = new Set();
  for (const blocco of blocchi.blocchi) {
    const elenco = indice.blocchi[blocco.id];
    assert.ok(Array.isArray(elenco), `indice mancante per ${blocco.id}`);
    assert.ok(elenco.length <= 20, `${blocco.id} oltre 20 voci (${elenco.length})`);
    for (const voce of elenco) {
      assert.equal(voce.livello, blocco.livello, `${voce.nome}: livello diverso dal blocco`);
      assert.equal(bloccoIncantesimo(voce.livello, voce.nome), blocco.id, `${voce.nome}: blocco di appartenenza errato`);
      assert.ok(voce.pagina >= 239 && voce.pagina <= 343, `${voce.nome}: pagina ${voce.pagina} fuori dal capitolo 7`);
      visti.add(perChiave(voce.nome));
      totale++;
    }
  }
  assert.equal(totale, 391);
  // Confronto in entrambe le direzioni con il catalogo dell'app.
  for (const nome of spellNames) assert.ok(visti.has(perChiave(nome)), `${nome} assente dall'indice`);
});

test("I00 assigns every app spell to a block by level", () => {
  for (const nome of spellNames) {
    const livello = spellDetails(nome)?.livello;
    assert.ok(Number.isInteger(livello), `${nome}: livello sconosciuto`);
    assert.ok(bloccoIncantesimo(livello, nome), `${nome}: nessun blocco`);
  }
});
