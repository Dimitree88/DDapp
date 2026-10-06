import assert from "node:assert/strict";
import { test } from "node:test";
import { coperturaModulo } from "./adeguamento-2024/copertura.ts";
import { chiaveRicerca, manuale, voceManuale } from "../lib/manuale-2024/index.ts";
import { coinTotalGold } from "../lib/coins.ts";
import entita from "../lib/manuale-2024-entities.json" with { type: "json" };

test("E05 covers every assigned value with verified manual entries", () => {
  const copertura = coperturaModulo("E05");
  assert.deepEqual([...copertura.valori.mancanti, ...copertura.righe.mancanti], []);
  assert.deepEqual([...copertura.valori.aperti, ...copertura.righe.aperte], []);
});

test("E05 mounts, vehicles, lifestyles and services match pp. 229-231 in both directions", () => {
  const nomi = (dominio, tipi) => manuale.voci(dominio).filter((voce) => tipi.includes(voce.tipo)).map((voce) => chiaveRicerca(voce.nome)).sort();
  const attesi = (elenco) => elenco.map(chiaveRicerca).sort();
  assert.deepEqual(nomi("equipaggiamento/cavalcature-veicoli", ["cavalcatura"]), attesi(entita.mounts));
  assert.deepEqual(nomi("equipaggiamento/cavalcature-veicoli", ["veicolo"]), attesi(entita.vehicles));
  assert.deepEqual(nomi("equipaggiamento/servizi", ["stileDiVita"]), attesi(entita.lifestyles));
  const servizi = manuale.voci("equipaggiamento/servizi").filter((voce) => voce.tipo === "servizio" && voce.tabelle[0].righe.length === 1).map((voce) => chiaveRicerca(voce.nome)).sort();
  assert.deepEqual(servizi, attesi(entita.services));
  for (const voce of manuale.voci("equipaggiamento/servizi").filter((item) => item.tipo === "stileDiVita")) {
    assert.ok(voceManuale("equipaggiamento/servizi", voce.nome).descrizione.length > 40, voce.nome);
  }
});

test("E05 coin values of p. 213 match the app total", () => {
  const tabella = voceManuale("equipaggiamento/monete", "Valore della moneta").voce.tabelle[0].righe;
  assert.deepEqual(tabella.map(([, valore]) => valore), ["1/100", "1/10", "1/2", "1", "10"]);
  assert.equal(coinTotalGold({ rame: "100", argento: "10", electrum: "2", oro: "1", platino: "1" }), "14");
  for (const nome of ["Rame", "Argento", "Electrum", "Oro", "Platino"]) assert.ok(voceManuale("equipaggiamento/monete", nome), nome);
});
