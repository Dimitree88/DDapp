import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { domainErrors } from "../lib/domain.ts";
import { normalizeSheet } from "../lib/sheet.ts";

// Correzioni verificabili nel Manuale locale: pp. 37, 141-142, 180, 197, 201, 210, 215, 225.
// Le scelte non ricostruibili non vengono inventate: terzo incantesimo, quinta lingua,
// tipi esatti di padronanza e provenienza dell'arco corto restano da confermare.
config({ path: ".env.local", quiet: true });
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL mancante");
const apply = process.argv.includes("--apply");
const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
const result = await client.execute({
  sql: "SELECT id, name, data, updated_at FROM characters WHERE id = ? AND name = ?",
  args: ["ephemer", "Ephemer"],
});
if (result.rows.length !== 1) throw new Error("Ephemer non trovato in modo univoco");
const row = result.rows[0];
const originalData = String(row.data);
const before = normalizeSheet(JSON.parse(originalData));
const sheet = structuredClone(before);
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(sheet.classe === "Ranger" && sheet.livello === "2" && sheet.background === "Eremita" && sheet.specie === "Umano", "Identità inattesa");
assert(sheet.abilita.find((item) => item.nome === "PERSUASIONE")?.competente, "Persuasione già corretta");
sheet.abilita.find((item) => item.nome === "PERSUASIONE").competente = false;

const sources = [
  ...["FURTIVITÀ", "NATURA", "PERCEZIONE"].map((value) => ({ tipo: "abilita", valore: value, fonte: "Classe: Ranger" })),
  { tipo: "abilita", valore: "INTUIZIONE", fonte: "Specie: Umano" },
  ...["Primordiale", "Sottocomune"].map((value) => ({ tipo: "lingua", valore: value, fonte: "Privilegio: Esploratore Esperto" })),
];
for (const source of sources) if (!(sheet.fontiCompetenze ?? []).some((item) => item.tipo === source.tipo && item.valore === source.valore && item.fonte === source.fonte)) {
  sheet.fontiCompetenze ??= [];
  sheet.fontiCompetenze.push(source);
}

const bow = sheet.armi.find((item) => item.nome === "Arco corto");
assert(bow?.bonus === "+4", "Arco corto inatteso");
bow.bonus = "+6"; // Compatibilità con l'app remota finché il calcolo corretto non viene distribuito.
bow.note = ""; // La regola del talento è nel catalogo, non una nota personale.

const lamp = sheet.equipaggiamento.find((item) => item.nome === "Lampada a olio");
const ampoule = sheet.equipaggiamento.find((item) => item.nome === "Ampolla");
assert(lamp?.quantita === "3" && ampoule?.quantita === "2", "Lampada e olio già cambiati");
lamp.nome = "Lampada";
lamp.quantita = "1";
ampoule.nome = "Olio";
ampoule.catalogId = "srd52:gear:olio";
ampoule.quantita = "5";

const hunter = sheet.privilegi.find((item) => item.titolo === "Nemico prescelto");
assert(hunter, "Nemico prescelto mancante");
hunter.scelte = "";
if (!(sheet.risorse ?? []).some((item) => item.nome === "Lancio gratuito di Marchio del cacciatore")) {
  sheet.risorse ??= [];
  sheet.risorse.push({ nome: "Lancio gratuito di Marchio del cacciatore", fonte: "Privilegio: Nemico Prescelto", massimo: 2, spesi: 0, ricarica: "riposo lungo" });
}
for (const spell of sheet.incantesimi) {
  if (["Cura ferite", "Passo veloce"].includes(spell.nome)) Object.assign(spell, { fonte: "classe", stato: "preparato", caratteristica: "SAG" });
  if (spell.nome === "Marchio del cacciatore") Object.assign(spell, { fonte: "privilegio", stato: "semprePreparato", caratteristica: "SAG" });
}

const errors = domainErrors(sheet);
if (errors.length) throw new Error(`Scheda non valida: ${errors.join("; ")}`);
const changes = [
  { field: "Arma · Arco corto · Bonus manuale", before: "+4", after: "+6 (DES +2, competenza +2, Tiro +2)" },
  { field: "Equipaggiamento · Lampada", before: "3 (lampada a olio)", after: "1 lampada" },
  { field: "Equipaggiamento · Olio", before: "2 ampolle generiche", after: "5 ampolle di olio (3 Eremita + 2 dotazione da esploratore)" },
];
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", database: url.startsWith("file:") ? url : "remote-libsql", changes,
  removedSkill: "Persuasione", addedSources: sources, resource: sheet.risorse, spells: sheet.incantesimi,
  unresolved: ["terzo incantesimo preparato", "quinta lingua", "due padronanze d'arma precise", "arco corto/lungo", "frecce d'argento +1"] }, null, 2));
if (!apply) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `ephemer-2024-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
const oldHistory = await client.execute({ sql: "SELECT id, occurred_at, changes FROM character_history WHERE character_id = ? ORDER BY occurred_at", args: [row.id] });
await writeFile(backupPath, JSON.stringify({ id: row.id, name: row.name, data: JSON.parse(originalData), updatedAt: row.updated_at, history: oldHistory.rows }, null, 2));
const tx = await client.transaction("write");
try {
  const now = Math.floor(Date.now() / 1000);
  const updated = await tx.execute({ sql: "UPDATE characters SET data = ?, updated_at = ? WHERE id = ? AND data = ?", args: [JSON.stringify(sheet), now, row.id, originalData] });
  assert(updated.rowsAffected === 1, "La scheda è cambiata dopo la lettura");
  await tx.execute({ sql: "INSERT INTO character_history (id, character_id, occurred_at, changes) VALUES (?, ?, ?, ?)", args: [randomUUID(), row.id, now, JSON.stringify(changes)] });
  await tx.commit();
  console.log(JSON.stringify({ applied: true, backupPath }));
} catch (error) {
  await tx.rollback();
  throw error;
}
