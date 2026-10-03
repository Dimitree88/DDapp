import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

config({ path: ".env.local", quiet: true });
const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const apply = process.argv.includes("--apply");
const rows = (await client.execute("SELECT id, name, data, updated_at FROM characters ORDER BY id")).rows;
const changes = rows.flatMap((row) => {
  const sheet = JSON.parse(String(row.data));
  if (!Object.hasOwn(sheet, "noteVelocita")) return [];
  const note = typeof sheet.noteVelocita === "string" ? sheet.noteVelocita.trim() : "";
  delete sheet.noteVelocita;
  return [{ id: String(row.id), name: String(row.name), oldData: String(row.data),
    newData: JSON.stringify(sheet), updatedAt: row.updated_at, note }];
});
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run",
  characters: changes.map(({ name, note }) => ({ name, note })) }, null, 2));
if (!apply || changes.length === 0) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `speed-notes-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
await writeFile(backupPath, JSON.stringify(changes.map(({ id, name, oldData, updatedAt }) =>
  ({ id, name, data: JSON.parse(oldData), updatedAt })), null, 2));

const tx = await client.transaction("write");
try {
  const now = Math.floor(Date.now() / 1000);
  for (const row of changes) {
    const updated = await tx.execute({
      sql: "UPDATE characters SET data = ?, updated_at = ? WHERE id = ? AND data = ?",
      args: [row.newData, now, row.id, row.oldData],
    });
    if (updated.rowsAffected !== 1) throw new Error(`La scheda di ${row.name} è cambiata durante la migrazione`);
    if (row.note) {
      await tx.execute({
        sql: "INSERT INTO character_history (id, character_id, occurred_at, changes) VALUES (?, ?, ?, ?)",
        args: [randomUUID(), row.id, now, JSON.stringify([{
          field: "Velocità · Nota archiviata", before: row.note, after: "—",
        }])],
      });
    }
  }
  await tx.commit();
  console.log(JSON.stringify({ applied: true, charactersUpdated: changes.length,
    historyEntries: changes.filter((row) => row.note).length, backupPath }));
} catch (error) {
  await tx.rollback();
  throw error;
}
