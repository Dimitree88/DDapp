import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { etichettaManuale, manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { backgroundToolProficiency } from "../lib/backgroundToolProficiencies.ts";
import { featByName } from "../lib/featCatalog.ts";
import regole from "../lib/manuale-2024-domains.json" with { type: "json" };
import backgrounds from "../lib/manuale-2024-backgrounds.json" with { type: "json" };

const minuscolo = (testo) => testo.toLocaleLowerCase("it");

test("V03 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("V03");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("V03 has the sixteen backgrounds of pp. 178-185 in both directions", () => {
  assert.deepEqual(manuale.voci("background").map((voce) => voce.nome).sort(), [...regole.background].sort());
  for (const voce of manuale.voci("background")) {
    const risultato = voceManuale("background", voce.nome);
    assert.ok(risultato.descrizione.length > 150 && !risultato.descrizione.includes("\n"), voce.nome);
    assert.ok(voce.pagina >= 178 && voce.pagina <= 185, voce.nome);
    assert.match(voce.equipaggiamento, /^a scelta tra A e B: \(A\) .+; o \(B\) 50 mo$/, voce.nome);
  }
});

test("V03 app grants match the background data of the manual", () => {
  for (const voce of manuale.voci("background")) {
    const app = backgrounds[voce.nome];
    assert.deepEqual(voce.punteggiCaratteristica, app.abilities, voce.nome);
    assert.deepEqual(voce.competenzeAbilita.map((nome) => nome.toLocaleUpperCase("it")).sort(), [...app.skills].sort(), voce.nome);
    const [talento, lista] = voce.talento.replace(/\)$/, "").split(" (");
    assert.equal(minuscolo(talento), minuscolo(app.feat), voce.nome);
    assert.ok(featByName(app.feat), app.feat);
    assert.equal(lista ? minuscolo(lista) : undefined, app.spellList ? minuscolo(app.spellList) : undefined, voce.nome);
    if (voce.competenzaStrumenti.startsWith("Scegli")) assert.equal(backgroundToolProficiency(voce.nome), null, voce.nome);
    else assert.equal(minuscolo(backgroundToolProficiency(voce.nome)), minuscolo(voce.competenzaStrumenti), voce.nome);
  }
});

test("V03 the Background label explains the parts of a background", () => {
  assert.match(etichettaManuale("Background").descrizione, /Punteggi di caratteristica\. .+Equipaggiamento\./s);
});
