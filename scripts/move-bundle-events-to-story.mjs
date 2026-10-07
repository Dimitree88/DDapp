import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { historyTimestampMs } from "../lib/history.ts";
import { normalizeSheet } from "../lib/sheet.ts";

dotenv.config({ path: ".env.local", quiet: true });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL non impostata");
const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const apply = process.argv.includes("--apply");
const [characters, histories] = await Promise.all([
  client.execute("SELECT id, name, data FROM characters"),
  client.execute("SELECT id, character_id, occurred_at, changes FROM character_history ORDER BY occurred_at"),
]);
const historyByCharacter = new Map();
for (const row of histories.rows) {
  const list = historyByCharacter.get(String(row.character_id)) ?? [];
  list.push({ id: String(row.id), occurredAt: Number(row.occurred_at), changes: JSON.parse(String(row.changes)) });
  historyByCharacter.set(String(row.character_id), list);
}
const plans = [];
for (const row of characters.rows) {
  const original = String(row.data);
  const sheet = JSON.parse(original);
  const entries = historyByCharacter.get(String(row.id)) ?? [];
  const events = [...(sheet.eventiStoria ?? [])];
  const historyWrites = [];
  for (const entry of entries) {
    const moved = entry.changes.filter((change) => Array.isArray(change.items) && change.field.includes("Dotazione ricevuta"));
    if (!moved.length) continue;
    for (const change of moved) {
      const packName = change.field.split("·").at(-1).trim();
      const title = `Dotazione ricevuta: ${packName}`;
      const data = new Date(historyTimestampMs(entry.occurredAt)).toISOString();
      if (!events.some((event) => event.titolo === title && event.data === data)) {
        events.push({
          capitolo: change.field.startsWith("Creazione personaggio ·") ? "Creazione personaggio" : "Dotazioni ricevute",
          titolo: title,
          dettagli: change.items,
          data,
        });
      }
    }
    historyWrites.push({ id: entry.id, changes: entry.changes.filter((change) => !moved.includes(change)) });
  }
  if (!historyWrites.length) continue;
  plans.push({ id: String(row.id), name: String(row.name), original, updated: normalizeSheet({ ...sheet, eventiStoria: events }), historyWrites });
}
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", target: new URL(process.env.DATABASE_URL).host,
  characters: plans.map((plan) => ({ name: plan.name, events: plan.updated.eventiStoria, historyRows: plan.historyWrites.map((entry) => ({ id: entry.id, remaining: entry.changes.length })) })) }, null, 2));
if (!apply || !plans.length) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `bundle-story-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
await writeFile(backupPath, JSON.stringify({ characters: plans.map((plan) => ({ id: plan.id, name: plan.name, data: JSON.parse(plan.original) })),
  history: histories.rows.filter((row) => plans.some((plan) => plan.historyWrites.some((entry) => entry.id === String(row.id)))) }, null, 2));
const tx = await client.transaction("write");
try {
  for (const plan of plans) {
    const current = await tx.execute({ sql: "SELECT data FROM characters WHERE id = ?", args: [plan.id] });
    if (current.rows.length !== 1 || String(current.rows[0].data) !== plan.original) throw new Error(`Scheda modificata durante la migrazione: ${plan.name}`);
    await tx.execute({ sql: "UPDATE characters SET data = ?, updated_at = ? WHERE id = ? AND data = ?",
      args: [JSON.stringify(plan.updated), Math.floor(Date.now() / 1000), plan.id, plan.original] });
    for (const entry of plan.historyWrites) {
      if (entry.changes.length) await tx.execute({ sql: "UPDATE character_history SET changes = ? WHERE id = ?", args: [JSON.stringify(entry.changes), entry.id] });
      else await tx.execute({ sql: "DELETE FROM character_history WHERE id = ?", args: [entry.id] });
    }
  }
  await tx.commit();
  console.log(JSON.stringify({ applied: true, characters: plans.length, backupPath }));
} catch (error) {
  await tx.rollback();
  throw error;
}
