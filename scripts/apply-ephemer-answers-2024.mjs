import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { domainErrors } from "../lib/domain.ts";
import { normalizeSheet } from "../lib/sheet.ts";
import { weaponAttack } from "../lib/weaponAttack.ts";

// Risposte del giocatore, verificate nel PDF locale: pp. 37, 42, 141-143, 215, 225, 254.
config({ path: ".env.local", quiet: true });
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL mancante");
const apply = process.argv.includes("--apply");
const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
const rows = (await client.execute({
  sql: "SELECT id, name, data, updated_at FROM characters WHERE id = ? AND name = ?",
  args: ["ephemer", "Ephemer"],
})).rows;
if (rows.length !== 1) throw new Error("Ephemer non trovato in modo univoco");
const row = rows[0];
const originalData = String(row.data);
const sheet = structuredClone(normalizeSheet(JSON.parse(originalData)));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(sheet.classe === "Ranger" && sheet.livello === "2", "Classe o livello inattesi");
assert(!sheet.lingue.includes("Lingua dei segni comune"), "Lingua già presente");
sheet.lingue.splice(2, 0, "Lingua dei segni comune");
sheet.noteLingue = "Sottocomune — Mercanti (specifica della campagna)";

assert(!sheet.incantesimi.some((spell) => spell.nome === "Colpo intrappolante"), "Incantesimo già presente");
sheet.incantesimi.push({ nome: "Colpo intrappolante", fonte: "classe", stato: "preparato", caratteristica: "SAG" });
sheet.storiaIncantesimiPreparati = [
  { livello: 1, nomi: ["Cura ferite", "Passo veloce"] },
  { livello: 2, nomi: ["Colpo intrappolante"] },
];

const bow = sheet.armi.find((weapon) => weapon.nome === "Arco corto");
assert(bow?.bonus === "+6", "Arco corto non nello stato atteso");
bow.nome = "Arco lungo";
bow.bonus = "+6";
assert(weaponAttack(sheet, bow)?.attack === "+6", "Bonus dell'arco lungo inatteso");

const mastery = sheet.privilegi.find((privilege) => privilege.titolo === "Padronanza d'armi");
assert(mastery, "Privilegio Padronanza d'armi mancante");
mastery.scelte = "Arco corto, Arco lungo";
sheet.padronanzeArmi = ["Arco corto", "Arco lungo"];

const silver = sheet.equipaggiamento.find((item) => item.nome === "Freccia d'argento");
assert(silver?.quantita === "4", "Frecce d'argento non nello stato atteso");
silver.dettaglio = "Oggetto personalizzato del DM. Bonus +1 annotato in sessione 2; applicazione da chiarire.";

const additions = [
  { nome: "Zaino", catalogId: "srd52:gear:zaino", quantita: "1", dettaglio: "" },
  { nome: "Faretra", catalogId: "srd52:gear:faretra", quantita: "1", dettaglio: "" },
];
for (const item of additions) {
  assert(!sheet.equipaggiamento.some((owned) => owned.nome === item.nome), `${item.nome} già presente`);
  sheet.equipaggiamento.push(item);
}

assert(sheet.puntiFeritaMax === "16" && !sheet.storiaPuntiFerita, "Storia dei PF già cambiata");
sheet.storiaPuntiFerita = { iniziali: 10, incrementi: [{ value: 6, method: "fisso" }] };
assert(sheet.puntiEsperienza === "0", "Punti esperienza inattesi"); // La campagna non li usa ancora.

const errors = domainErrors(sheet);
if (errors.length) throw new Error(`Scheda non valida: ${errors.join("; ")}`);
const changes = [
  { field: "Arma · Arco", before: "Arco corto", after: "Arco lungo (equipaggiamento iniziale del Ranger)" },
  { field: "Equipaggiamento · Zaino", before: "—", after: "1" },
  { field: "Equipaggiamento · Faretra", before: "—", after: "1" },
  { field: "Equipaggiamento · Freccia d'argento · Dettaglio", before: "Bonus: +1", after: silver.dettaglio },
];
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", database: url.startsWith("file:") ? url : "remote-libsql",
  languages: sheet.lingue, languageNote: sheet.noteLingue, spells: sheet.incantesimi, bow,
  hitPointStory: sheet.storiaPuntiFerita, experience: sheet.puntiEsperienza, masteries: sheet.padronanzeArmi,
  selectedMasteries: mastery.scelte, equipmentChanges: changes }, null, 2));
if (!apply) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `ephemer-answers-2024-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
const history = await client.execute({ sql: "SELECT id, occurred_at, changes FROM character_history WHERE character_id = ? ORDER BY occurred_at", args: [row.id] });
await writeFile(backupPath, JSON.stringify({ id: row.id, name: row.name, data: JSON.parse(originalData), updatedAt: row.updated_at, history: history.rows }, null, 2));

const tx = await client.transaction("write");
try {
  const now = Math.floor(Date.now() / 1000);
  const updated = await tx.execute({ sql: "UPDATE characters SET data = ?, updated_at = ? WHERE id = ? AND data = ?", args: [JSON.stringify(sheet), now, row.id, originalData] });
  assert(updated.rowsAffected === 1, "La scheda è cambiata dopo l'anteprima");
  await tx.execute({ sql: "INSERT INTO character_history (id, character_id, occurred_at, changes) VALUES (?, ?, ?, ?)", args: [randomUUID(), row.id, now, JSON.stringify(changes)] });
  await tx.commit();
  console.log(JSON.stringify({ applied: true, backupPath }));
} catch (error) {
  await tx.rollback();
  throw error;
}
