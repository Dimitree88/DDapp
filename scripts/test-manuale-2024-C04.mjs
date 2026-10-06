import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { differenzePrivilegi, differenzeProgressione, differenzeTratti, sottoclassiDi, voceClasse } from "./adeguamento-2024/verifica-classe.ts";
import { privilegioManuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { privilegeOptions } from "../lib/characterGrants.ts";
import { grantClassLanguages } from "../lib/classSavingThrows.ts";
import { emptySheet } from "../lib/sheet.ts";
import { spellcastingAbility } from "../lib/spellcasting.ts";

test("C04 covers the Druid, its subclasses and every feature with verified entries", () => {
  const copertura = coperturaModulo("C04");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
  assert.equal(voceClasse("Druido").privilegi.length, 13);
  assert.deepEqual(sottoclassiDi("Druido").map((voce) => voce.privilegi.length), [5, 5, 5, 5]);
});

test("C04 traits table p. 79 and Druidic p. 80 match the app class data", () => {
  assert.deepEqual(differenzeTratti("Druido"), []);
  assert.equal(spellcastingAbility.Druido, "SAG");
  assert.ok(grantClassLanguages({ ...emptySheet(), classe: "Druido" }).lingue.includes("Druidico"));
  assert.match(privilegioManuale("Druidico", { classe: "Druido", livello: 1 }).descrizione, /^Un druido conosce il druidico/);
});

test("C04 progression table p. 80 matches proficiency bonus, features, slots and Wild Shape", () => {
  assert.deepEqual(differenzeProgressione("Druido"), []);
  const tabella = voceClasse("Druido").tabelle.find((item) => item.titolo === "Privilegi del druido");
  const colonna = (nome) => tabella.righe.map((riga) => riga[tabella.colonne.indexOf(nome)]);
  assert.deepEqual(colonna("Forma selvatica"), ["—", ...Array(4).fill("2"), ...Array(11).fill("3"), ...Array(4).fill("4")]);
  assert.deepEqual(colonna("Trucchetti"), [...Array(3).fill("2"), ...Array(6).fill("3"), ...Array(11).fill("4")]);
  const forma = privilegioManuale("Forma Selvatica", { classe: "Druido", livello: 2 });
  assert.deepEqual(forma.voce.tabelle[0].righe, [["2", "4", "1/4", "No"], ["4", "6", "1/2", "No"], ["8", "8", "1", "Sì"]]);
  assert.doesNotMatch(forma.descrizione, /FORME BESTIALI|·/);
});

test("C04 features, choices and circle tables match pp. 79-89", () => {
  assert.deepEqual(differenzePrivilegi("Druido"), []);
  const ordine = privilegioManuale("Ordine primordiale", { classe: "Druido", livello: 1 }).descrizione;
  for (const opzione of privilegeOptions["Ordine primordiale"]) assert.match(ordine, new RegExp(`\\n\\n${opzione}\\. `));
  assert.match(ordine, /^Il chierico si dedica/, "refuso stampato a p. 80, conservato");
  const terra = privilegioManuale("Incantesimi del Circolo della Terra", { classe: "Druido", sottoclasse: "Circolo della Terra", livello: 3 });
  assert.deepEqual(terra.voce.tabelle.map((tabella) => tabella.titolo), ["Terra arida", "Terra polare", "Terra temperata", "Terra tropicale"]);
  assert.match(privilegioManuale("Interdizione della Natura", { classe: "Druido", sottoclasse: "Circolo della Terra", livello: 10 }).descrizione, /^È immune alla condizione avvelenato ed è dotato di resistenza/);
  assert.equal(voceManuale("classi/druido", "Circolo delle Stelle").voce.privilegi[0].tabelle[0].righe.length, 6);
});
