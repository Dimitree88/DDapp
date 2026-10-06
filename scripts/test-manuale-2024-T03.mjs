import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { featByName } from "../lib/featCatalog.ts";
import { featPrerequisitesMet } from "../lib/featPrerequisites.ts";
import { emptySheet } from "../lib/sheet.ts";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };

const DOMINIO = "talenti/stili";

test("T03 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("T03");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("T03 has the ten Fighting Style feats of pp. 209-210 in both directions", () => {
  const voci = manuale.voci(DOMINIO);
  assert.deepEqual(voci.map((voce) => voce.nome).sort(), [...regole.talenti.stileDiCombattimento].sort());
  for (const voce of voci) {
    assert.equal(voce.categoria, "Stile di combattimento", voce.nome);
    assert.equal(voce.prerequisito, "privilegio Stile di combattimento", voce.nome);
    assert.equal(voce.ripetibile, false, voce.nome);
    assert.equal(featByName(voce.nome)?.category, "stileDiCombattimento", voce.nome);
    const testo = voceManuale(DOMINIO, voce.nome).descrizione;
    assert.ok(testo.length > 40 && !testo.startsWith("Talento"), voce.nome);
  }
});

test("T03 the Fighting Style privilege prerequisite is enforced by the app", () => {
  const scheda = (classe, livello, sottoclasse = "") => ({ ...emptySheet(), classe, livello: String(livello), sottoclasse });
  for (const voce of manuale.voci(DOMINIO)) {
    assert.equal(featPrerequisitesMet(scheda("Mago", 20), voce.nome), false, voce.nome);
    assert.equal(featPrerequisitesMet(scheda("Guerriero", 1), voce.nome), true, voce.nome);
    assert.equal(featPrerequisitesMet(scheda("Paladino", 2), voce.nome), true, voce.nome);
    assert.equal(featPrerequisitesMet(scheda("Ranger", 1), voce.nome), false, voce.nome);
  }
});
