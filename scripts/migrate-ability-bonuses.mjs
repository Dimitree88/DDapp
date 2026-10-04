import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeSheet } from "../lib/sheet.ts";

config({ path: ".env.local", quiet: true });
const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const apply = process.argv.includes("--apply");
const rows = (await client.execute("SELECT id, name, data, updated_at FROM characters ORDER BY id")).rows;
const plans = [];

for (const row of rows) {
  const before = JSON.parse(String(row.data));
  const modifiers = Object.fromEntries(before.caratteristiche.map((item) => [item.abbr, Number(item.modificatore)]));
  const proficiency = Number(before.bonusCompetenza);
  for (const ability of before.abilita) {
    if (!Object.hasOwn(ability, "bonus")) continue;
    const expected = modifiers[ability.caratteristica] + (ability.competente ? proficiency : 0);
    if (!Number.isFinite(expected) || Number(ability.bonus) !== expected) {
      throw new Error(`Bonus esistente inatteso: ${row.name} / ${ability.nome}`);
    }
  }
  const after = normalizeSheet(before);
  const changes = [];
  if (row.id === "ephemer") {
    const insight = after.abilita.find((item) => item.nome === "INTUIZIONE");
    if (!insight?.competente) throw new Error("Ephemer non è competente in Intuizione");
    const explorer = after.privilegi.find((item) => item.titolo === "Esploratore esperto");
    if (!explorer) throw new Error("Privilegio Esploratore esperto mancante");
    if (!insight.maestria) changes.push({ field: "Abilità · INTUIZIONE · Maestria", before: "No", after: "Sì" });
    if (explorer.scelte !== "Maestria: Intuizione") changes.push({ field: "Privilegi · Esploratore esperto · Scelte personali", before: explorer.scelte, after: "Maestria: Intuizione" });
    insight.maestria = true;
    explorer.scelte = "Maestria: Intuizione";
  }
  if (JSON.stringify(before) === JSON.stringify(after)) continue;
  plans.push({ id: String(row.id), name: String(row.name), oldData: String(row.data),
    newData: JSON.stringify(after), updatedAt: row.updated_at, changes });
}

console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", characters: plans.map((plan) => ({
  name: plan.name, oldSkillBonuses: JSON.parse(plan.oldData).abilita.length,
  mastery: plan.id === "ephemer" ? "Intuizione" : null,
})) }, null, 2));
if (!apply || plans.length === 0) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `ability-bonuses-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
await writeFile(backupPath, JSON.stringify(plans.map(({ id, name, oldData, updatedAt }) =>
  ({ id, name, data: JSON.parse(oldData), updatedAt })), null, 2));

const tx = await client.transaction("write");
try {
  const now = Math.floor(Date.now() / 1000);
  for (const plan of plans) {
    const result = await tx.execute({
      sql: "UPDATE characters SET data = ?, updated_at = ? WHERE id = ? AND data = ?",
      args: [plan.newData, now, plan.id, plan.oldData],
    });
    if (result.rowsAffected !== 1) throw new Error(`La scheda di ${plan.name} è cambiata durante la migrazione`);
    if (plan.changes.length) await tx.execute({
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
