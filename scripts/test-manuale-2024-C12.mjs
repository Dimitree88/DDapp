import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { etichettaManuale, privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { emptySheet } from "../lib/sheet.ts";
import { spellSlots, spellcastingAbility } from "../lib/spellcasting.ts";

test("C12 covers the Warlock, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C12");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Warlock").privilegi.length, 9);
  assert.deepEqual(sottoclassiDi("Warlock").map((voce) => voce.privilegi.length), [5, 7, 5, 5]);
});

test("C12 traits table p. 165 matches the app class data", () => {
  assert.deepEqual(differenzeTratti("Warlock"), []);
  assert.equal(voceClasse("Warlock").caratteristicaPrimaria, "Carisma");
  assert.equal(spellcastingAbility.Warlock, "CAR");
});

test("C12 progression table p. 166 matches invocations, cantrips and pact-magic slots", () => {
  assert.deepEqual(differenzeProgressione("Warlock"), []);
  const tabella = voceClasse("Warlock").tabelle.find((item) => item.titolo === "Privilegi del warlock");
  const colonna = (nome) => tabella.righe.map((riga) => riga[tabella.colonne.indexOf(nome)]);
  assert.deepEqual(colonna("Suppliche occulte"), ["1", "3", "3", "3", "5", "5", "6", "6", "7", "7", "7", "8", "8", "8", "9", "9", "9", "10", "10", "10"]);
  // Magia del Patto: la colonna Slot/Livello coincide con spellcasting.ts#spellSlots (warlock).
  tabella.righe.forEach((riga, indice) => {
    const pool = spellSlots({ ...emptySheet(), classe: "Warlock", livello: String(indice + 1) });
    const alto = pool.filter((slot) => slot.maximum > 0).at(-1);
    assert.equal(riga[tabella.colonne.indexOf("Slot incantesimo")], String(alto.maximum), `slot L${indice + 1}`);
    assert.equal(riga[tabella.colonne.indexOf("Livello slot")], String(alto.level), `liv L${indice + 1}`);
  });
});

test("C12 features, invocations and patron spells match pp. 164-175", () => {
  assert.deepEqual(differenzePrivilegi("Warlock"), []);
  assert.match(etichettaManuale("Opzioni di suppliche occulte").descrizione, /ARMATURA DELLE OMBRE/);
  assert.match(etichettaManuale("Suppliche occulte").descrizione, /warlock di 2° livello o superiore/);
  for (const [sotto, titolo] of [["Patrono Celestiale", "Incantesimi Celestiali"], ["Patrono Grande Antico", "Incantesimi del Grande Antico"], ["Patrono Immondo", "Incantesimi Immondi"], ["Patrono Signore Fatato", "Incantesimi del Signore Fatato"]]) {
    const voce = sottoclassiDi("Warlock").find((item) => item.nome === sotto).privilegi.find((item) => item.nome === titolo);
    assert.deepEqual(voce.tabelle[0].righe.map((riga) => riga[0]), ["3", "5", "7", "9"], sotto);
  }
  // Discrepanza nota app/manuale: la voce «Benedizione dell'Occulto» ha il testo del manuale («dell'Oscuro»).
  assert.match(privilegioManuale("Benedizione dell'Occulto", { classe: "Warlock", sottoclasse: "Patrono Immondo", livello: 3 }).descrizione, /quantità di punti ferita temporanei/);
  assert.match(voceManuale("classi/warlock", "Patrono Immondo").descrizione, /^Stringi un patto con i Piani Inferiori\n\n/);
});
