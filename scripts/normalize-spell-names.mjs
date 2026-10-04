import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { canonicalSpellName, spellNames } from "../lib/spells.ts";

config({ path: ".env.local", quiet: true });
const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const apply = process.argv.includes("--apply");
const rows = (await client.execute("SELECT id, name, data, updated_at FROM characters ORDER BY id")).rows;
const plans = [];
for (const row of rows) {
  const before = JSON.parse(String(row.data));
  const changes = [];
  const incantesimi = (before.incantesimi ?? []).map((spell, index) => {
    const nome = canonicalSpellName(spell.nome);
    if (nome && !spellNames.includes(nome)) throw new Error(`Incantesimo sconosciuto di ${row.name}: ${spell.nome}`);
    if (nome !== spell.nome) changes.push({ field: `Incantesimo ${index + 1} · Nome`, before: spell.nome, after: nome });
    return { ...spell, nome };
  });
  if (changes.length) plans.push({
    id: String(row.id), name: String(row.name), oldData: String(row.data),
    newData: JSON.stringify({ ...before, incantesimi }), updatedAt: row.updated_at, changes,
  });
}
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", characters: plans.map(({ name, changes }) => ({ name, changes })) }, null, 2));
if (!apply || plans.length === 0) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `spell-names-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
await writeFile(backupPath, JSON.stringify(plans.map(({ id, name, oldData, updatedAt }) =>
  ({ id, name, data: JSON.parse(oldData), updatedAt })), null, 2));

const tx = await client.transaction("write");
try {
  const now = Math.floor(Date.now() / 1000);
  for (const plan of plans) {
    const updated = await tx.execute({
      sql: "UPDATE characters SET data = ?, updated_at = ? WHERE id = ? AND data = ?",
      args: [plan.newData, now, plan.id, plan.oldData],
    });
    if (updated.rowsAffected !== 1) throw new Error(`La scheda di ${plan.name} è cambiata durante la migrazione`);
    await tx.execute({
      sql: "INSERT INTO character_history (id, character_id, occurred_at, changes) VALUES (?, ?, ?, ?)",
      args: [randomUUID(), plan.id, now, JSON.stringify(plan.changes)],
    });
  }
  await tx.commit();
  console.log(JSON.stringify({ applied: true, charactersUpdated: plans.length, backupPath }));
} catch (error) {
  await tx.rollback();
  throw error;
}
