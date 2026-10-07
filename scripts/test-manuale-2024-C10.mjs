import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { emptySheet } from "../lib/sheet.ts";
import { spellSlots, spellcastingAbility } from "../lib/spellcasting.ts";

test("C10 covers the Ranger, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C10");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Ranger").privilegi.length, 17);
  assert.deepEqual(sottoclassiDi("Ranger").map((voce) => voce.privilegi.length), [5, 6, 4, 6]);
});

test("C10 traits table p. 141 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Ranger"), []);
  assert.equal(voceClasse("Ranger").caratteristicaPrimaria, "Destrezza e Saggezza");
  assert.equal(spellcastingAbility.Ranger, "SAG");
  assert.equal(voceClasse("Ranger").competenze.abilita.numero, 3);
});

test("C10 progression table p. 142 matches favored enemy and half-caster slots", () => {
  assert.deepEqual(differenzeProgressione("Ranger"), []);
  const tabella = voceClasse("Ranger").tabelle.find((item) => item.titolo === "Privilegi del ranger");
  const colonna = (nome) => tabella.righe.map((riga) => riga[tabella.colonne.indexOf(nome)]);
  assert.deepEqual(colonna("Nemici prescelti"), [...Array(4).fill("2"), ...Array(4).fill("3"), ...Array(4).fill("4"), ...Array(4).fill("5"), ...Array(4).fill("6")]);
  tabella.righe.forEach((riga, indice) => {
    const attesi = spellSlots({ ...emptySheet(), classe: "Ranger", livello: String(indice + 1) }).map((slot) => String(slot.maximum));
    const stampati = ["1", "2", "3", "4", "5"].map((n) => riga[tabella.colonne.indexOf(n)]).filter((cella) => cella !== "—");
    assert.deepEqual(stampati, attesi, `livello ${indice + 1}`);
  });
});

test("C10 features and subclass spell tables match pp. 140-149", () => {
  assert.deepEqual(differenzePrivilegi("Ranger"), []);
  // Il Compagno Primordiale è la sola descrizione: le schede delle bestie (pp. 147-148) sono escluse.
  assert.doesNotMatch(privilegioManuale("Compagno Primordiale", { classe: "Ranger", sottoclasse: "Signore delle Bestie", livello: 3 }).descrizione, /FoR 6|CA 13|volo 18 metri/);
  for (const [nome, sotto] of [["Cacciatore delle Tenebre", "Cacciatore delle Tenebre"], ["Viandante Fatato", "Viandante Fatato"]]) {
    const incantesimi = sottoclassiDi("Ranger").find((voce) => voce.nome === sotto).privilegi.find((item) => item.nome.startsWith("Incantesimi del"));
    assert.deepEqual(incantesimi.tabelle[0].righe.map((riga) => riga[0]), ["3", "5", "9", "13", "17"], nome);
  }
  assert.match(voceManuale("classi/ranger", "Viandante Fatato").descrizione, /^Padroneggia la gioia e la furia fatata\n\nGrazie/);
});
