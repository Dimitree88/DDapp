import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { etichettaManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { initiativeBonus, proficiencyBonus } from "../lib/abilityBonus.ts";
import { calculatedMaxHp, classHitDice, fixedHitPointGain } from "../lib/classProgression.ts";
import { emptySheet } from "../lib/sheet.ts";

test("V05 covers every assigned label and rule with verified manual entries", () => {
  const copertura = coperturaModulo("V05");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("V05 general labels open their manual definition with printed pages", () => {
  for (const [nome, riferimento] of [
    ["Classe", "p. 33"], ["Sottoclasse", "pp. 36, 49"], ["Livello", "pp. 36, 41, 42"], ["PE", "pp. 36, 41, 370"],
    ["Dadi Vita", "pp. 41, 365"], ["Velocità", "p. 377"], ["Ispirazione eroica", "pp. 13, 367"], ["Privilegi", "pp. 40, 42"], ["Talenti", "p. 199"],
  ]) {
    const etichetta = etichettaManuale(nome);
    assert.equal(etichetta?.riferimento, `Manuale del Giocatore 2024, ${riferimento}`, nome);
    assert.ok(etichetta.descrizione.length > 100 && !/\bO PE\b|UESTO|interessa\?ti/.test(etichetta.descrizione), nome);
  }
});

test("V05 proficiency bonus table of p. 41 matches the applied formula", () => {
  const tabella = voceManuale("regole/generali", "Bonus di competenza").voce.tabelle[0];
  assert.equal(tabella.righe.length, 20);
  for (const [livello, , bonus] of tabella.righe) assert.equal(proficiencyBonus(livello), bonus, `livello ${livello}`);
});

test("V05 hit point tables of pp. 40 and 42 match class hit dice and fixed gains", () => {
  const [primo, fissi] = voceManuale("regole/generali", "Punti ferita massimi").voce.tabelle;
  const valore = (cella) => Number(cella.split(" ")[0]);
  for (const [indice, riga] of primo.righe.entries()) {
    const classi = riga[0].replace(/ o /g, ", ").split(", ").map((nome) => nome[0].toUpperCase() + nome.slice(1));
    for (const classe of classi) {
      assert.equal(classHitDice[classe], valore(riga[1]), classe);
      assert.equal(fixedHitPointGain(classHitDice[classe]), valore(fissi.righe[indice][1]), classe);
    }
  }
  const barbaro = { ...emptySheet(), classe: "Barbaro", livello: "3", puntiFeritaMaxModo: "classe", incrementiPf: [{ value: 7, method: "fisso" }, { value: 7, method: "fisso" }] };
  barbaro.caratteristiche = barbaro.caratteristiche.map((item) => item.abbr === "COS" ? { ...item, valore: "14" } : item);
  assert.equal(calculatedMaxHp(barbaro)?.value, 12 + 2 + 2 * (7 + 2));
});

test("V05 initiative uses the Dexterity modifier as stated on p. 41", () => {
  const scheda = emptySheet();
  scheda.caratteristiche = scheda.caratteristiche.map((item) => item.abbr === "DES" ? { ...item, valore: "14" } : item);
  assert.equal(initiativeBonus(scheda), "+2");
  assert.match(voceManuale("regole/generali", "Iniziativa").descrizione, /modificatore di Destrezza/);
});
