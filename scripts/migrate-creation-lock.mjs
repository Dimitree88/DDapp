import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

config({ path: ".env.local", quiet: true });
const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const apply = process.argv.includes("--apply");
const rows = (await client.execute("SELECT id, name, data FROM characters ORDER BY id")).rows;
const plans = rows.flatMap((row) => {
  const before = JSON.parse(String(row.data));
  if (before.creazioneCompletata === true) return [];
  return [{ id: String(row.id), name: String(row.name), oldData: String(row.data),
    newData: JSON.stringify({ ...before, creazioneCompletata: true }) }];
});
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", characters: plans.map(({ name }) => name) }, null, 2));
if (!apply || plans.length === 0) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `creation-lock-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
await writeFile(backupPath, JSON.stringify(plans.map(({ id, name, oldData }) =>
  ({ id, name, data: JSON.parse(oldData) })), null, 2));

const tx = await client.transaction("write");
try {
  const now = Math.floor(Date.now() / 1000);
  for (const plan of plans) {
    const result = await tx.execute({
      sql: "UPDATE characters SET data = ?, updated_at = ? WHERE id = ? AND data = ?",
      args: [plan.newData, now, plan.id, plan.oldData],
    });
    if (result.rowsAffected !== 1) throw new Error(`La scheda di ${plan.name} è cambiata durante la migrazione`);
  }
  await tx.commit();
  console.log(JSON.stringify({ applied: true, charactersUpdated: plans.length, backupPath }));
} catch (error) {
  await tx.rollback();
  throw error;
}
