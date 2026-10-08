import assert from "node:assert/strict";
import { test } from "node:test";
import { emptySheet, normalizeSheet } from "../lib/sheet.ts";
import { grantedPrivileges } from "../lib/characterGrants.ts";
import { grantFunctionalDetails } from "../lib/functionalDetails.ts";
import { esitoRiga, righe } from "./adeguamento-2024/copertura.ts";
import { FILE_MANUALE } from "../lib/manuale-2024/registro.ts";

// Specie e lignaggi usati nelle schede (da lib/characterGrants.ts).
const SPECIE = ["Aasimar", "Dragonide", "Elfo", "Gnomo", "Goliath", "Halfling", "Nano", "Orco", "Tiefling", "Umano"];
const LIGNAGGI = {
  Elfo: ["Drow", "Elfo alto", "Elfo dei boschi"],
  Gnomo: ["Gnomo delle foreste", "Gnomo delle rocce"],
  Tiefling: ["Abissale", "Ctonio", "Infernale"],
};

// Ogni coppia classe/sottoclasse del manuale.
function coppieClasseSottoclasse() {
  const coppie = [];
  for (const [dominio, file] of Object.entries(FILE_MANUALE)) {
    if (!dominio.startsWith("classi/")) continue;
    const classe = file.voci.find((v) => v.tipo === "classe")?.nome;
    const sottoclassi = file.voci.filter((v) => v.tipo === "sottoclasse").map((v) => v.nome);
    if (classe) for (const sottoclasse of ["", ...sottoclassi]) coppie.push({ classe, sottoclasse });
  }
  return coppie;
}

function scheda({ classe = "", sottoclasse = "", specie = "", lignaggio = "", livello = "20" }) {
  const base = emptySheet();
  return normalizeSheet({
    ...base, livello, classe, sottoclasse, specie, lignaggio,
    caratteristiche: base.caratteristiche.map((c) => ({ ...c, valore: "14" })),
  });
}

// Un privilegio concesso è "coperto" se la sintesi mostrata deriva da fonti
// condivise (manuale o promemoria operativo), non da una nota personale.
function privilegiScoperti(sheet) {
  const scoperti = [];
  for (const grant of grantedPrivileges(sheet)) {
    if (grant.name.includes("a scelta")) continue; // scelte risolte altrove
    const { summary } = grantFunctionalDetails(grant, sheet);
    if (!summary || !summary.trim()) scoperti.push(`${grant.source} › ${grant.name}`);
  }
  return scoperti;
}

test("Q01 matrix coverage is complete (0 da_fare, 0 aperto)", () => {
  const esiti = righe.map((riga) => esitoRiga(riga));
  assert.equal(esiti.filter((e) => e === "da_fare").length, 0);
  assert.equal(esiti.filter((e) => e === "aperto").length, 0);
  assert.equal(esiti.filter((e) => e === "verificato").length, 64);
  assert.equal(esiti.filter((e) => e === "app").length, 16);
});

test("Q01 every class/subclass at level 20 resolves its privileges from shared sources", () => {
  const coppie = coppieClasseSottoclasse();
  assert.equal(coppie.length, 12 + 48, "attese 12 classi + 48 sottoclassi");
  const scoperti = [];
  for (const { classe, sottoclasse } of coppie) {
    scoperti.push(...privilegiScoperti(scheda({ classe, sottoclasse })));
  }
  assert.deepEqual([...new Set(scoperti)], [], "privilegi senza sintesi condivisa");
});

test("Q01 every species and lineage trait resolves from shared sources", () => {
  const scoperti = [];
  for (const specie of SPECIE) {
    scoperti.push(...privilegiScoperti(scheda({ specie })));
    for (const lignaggio of LIGNAGGI[specie] ?? []) {
      scoperti.push(...privilegiScoperti(scheda({ specie, lignaggio })));
    }
  }
  assert.deepEqual([...new Set(scoperti)], [], "tratti senza sintesi condivisa");
});

test("Q01 privilege summaries do not depend on a per-character written note", () => {
  // La scheda non ha privilegi/talenti scritti: la sintesi deve comunque esserci.
  const sheet = scheda({ classe: "Barbaro", sottoclasse: "Cammino del Berserker" });
  assert.deepEqual(sheet.privilegi, []);
  const grant = grantedPrivileges(sheet).find((g) => g.name === "Ira");
  assert.ok(grant, "privilegio Ira atteso per il Barbaro");
  const { summary } = grantFunctionalDetails(grant, sheet);
  assert.ok(summary && summary.trim().length > 0, "Ira senza sintesi dal manuale");
});
