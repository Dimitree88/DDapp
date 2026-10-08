import assert from "node:assert/strict";
import { test } from "node:test";
import { esitoRiga, righe } from "./adeguamento-2024/copertura.ts";
import { descrizioneValore } from "../lib/manuale-2024/index.ts";
import { valueDetails } from "../lib/valueDetails.ts";
import { FILE_MANUALE, TESTI_MANUALE } from "../lib/manuale-2024/registro.ts";

// Ogni privilegio, tratto o talento che un personaggio puo acquisire.
function acquisibili() {
  const voci = [];
  for (const [dominio, file] of Object.entries(FILE_MANUALE)) {
    const testi = TESTI_MANUALE[dominio]?.testi ?? {};
    const privilegiDi = (v) =>
      v.tipo === "classe" || v.tipo === "sottoclasse" ? v.privilegi
        : v.tipo === "specie" || v.tipo === "lignaggio" ? v.tratti ?? [] : [];
    for (const v of file.voci) {
      if (dominio.startsWith("talenti/")) voci.push({ dominio, nome: v.nome, voce: v, testo: testi[v.id] });
      for (const p of privilegiDi(v)) voci.push({ dominio, nome: `${v.nome} › ${p.nome}`, voce: p, testo: testi[p.id] });
    }
  }
  return voci;
}

test("R01 the whole matrix is covered (no row left to do or open)", () => {
  const esiti = righe.map((riga) => esitoRiga(riga));
  assert.equal(esiti.filter((e) => e === "da_fare").length, 0);
  assert.equal(esiti.filter((e) => e === "aperto").length, 0);
  assert.ok(esiti.filter((e) => e === "verificato").length >= 64);
});

test("R01 value popups resolve to the verified manual text with page", () => {
  for (const [kind, value, inizio] of [
    ["classe", "Barbaro", /^I barbari sono potenti guerrieri/],
    ["sottoclasse", "Cammino del Berserker", /Incanala l'ira in furia violenta/],
    ["specie", "Elfo", /^Creati dal dio Corellon/],
    ["background", "Accolito", /^Il personaggio ha trascorso/],
    ["talento", "Robusto", /punti ferita massimi/],
    ["allineamento", "Caotico neutrale", /caotic/i],
    ["condizione", "Avvelenato", /condizione/i],
    ["abilita", "Atletica", /Salta/],
    ["lignaggio", "Infernale", /tiefling/i],
  ]) {
    const manuale = descrizioneValore(kind, value);
    assert.ok(manuale?.verificata, `${kind}: ${value} senza voce verificata`);
    assert.match(manuale.descrizione, inizio, `${kind}: ${value}`);
    const popup = valueDetails(kind, value);
    assert.equal(popup.meaning, manuale.descrizione, `${kind}: ${value} popup non dal manuale`);
    assert.ok(popup.page >= 1, `${kind}: ${value} senza pagina`);
  }
});

test("R01 flags every acquirable privilege/trait/talent still without a manual summary", () => {
  const voci = acquisibili();
  assert.ok(voci.length >= 500, `troppi pochi acquisibili: ${voci.length}`);
  const privi = voci.filter((v) => v.voce.verifica.stato !== "verificata" || !v.testo || !v.testo.trim());
  assert.deepEqual(
    privi.map((v) => `${v.dominio} | ${v.nome}`),
    [],
    `acquisibili ancora privi di sintesi dal manuale: ${privi.length}`,
  );
});

test("R01 unknown values still return null (no crash)", () => {
  assert.equal(descrizioneValore("classe", "Inventata"), null);
  assert.equal(descrizioneValore("boh", "x"), null);
  assert.equal(valueDetails("allineamento", "Inventato"), null);
});
