import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { etichettaManuale, manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { gearCatalog } from "../lib/gearCatalog.ts";

const DOMINIO = "equipaggiamento/strumenti";
const TIPO = { artigiano: "artigiano", gioco: "gioco", "strumento musicale": "musicale", altro: "altro" };

test("E03 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("E03");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("E03 tools of pp. 220-221 match the app catalog in both directions", () => {
  const selezionabili = manuale.voci(DOMINIO).filter((voce) => voce.tipo === "strumento" && !["Gioco", "Strumento musicale"].includes(voce.nome));
  const app = gearCatalog.filter((gear) => gear.tool);
  assert.deepEqual(selezionabili.map((voce) => voce.nome).sort(), app.map((gear) => gear.name).sort());
  for (const voce of selezionabili) {
    const gear = app.find((item) => item.name === voce.nome);
    assert.equal(gear.weightKg ?? null, voce.pesoKg, voce.nome);
    assert.ok(Math.abs(gear.costGp - voce.costoMo) < 1e-9, voce.nome);
    assert.equal(gear.sourcePage, voce.pagina, voce.nome);
    assert.equal(gear.toolKind, TIPO[voce.categoria], voce.nome);
    if (!voce.varianteDi) assert.match(voceManuale(DOMINIO, voce.nome).descrizione, /^Utilizzo: .+\(CD \d+\)/, voce.nome);
  }
});

test("E03 the tool proficiency label explains the advantage with a matching skill", () => {
  assert.match(etichettaManuale("Competenze negli strumenti").descrizione, /effettuerà la prova con vantaggio/);
  assert.equal(manuale.voci(DOMINIO).filter((voce) => voce.varianteDi === "Strumento musicale").length, 10);
  assert.equal(manuale.voci(DOMINIO).filter((voce) => voce.varianteDi === "Gioco").length, 4);
});
