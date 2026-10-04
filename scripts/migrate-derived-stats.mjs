import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeSheet } from "../lib/sheet.ts";
import { abilityModifier, initiativeBonus, passivePerception, proficiencyBonus, savingThrowBonus } from "../lib/abilityBonus.ts";

config({ path: ".env.local", quiet: true });
const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const apply = process.argv.includes("--apply");
const rows = (await client.execute("SELECT id, name, data, updated_at FROM characters ORDER BY id")).rows;
const plans = [];

for (const row of rows) {
  const before = JSON.parse(String(row.data));
  const after = normalizeSheet(before);
  const assertSame = (label, stored, expected) => {
    if (stored !== undefined && Number(stored) !== Number(expected)) {
      throw new Error(`Valore inatteso: ${row.name} / ${label}: ${stored}, atteso ${expected}`);
    }
  };
  assertSame("Bonus competenza", before.bonusCompetenza, proficiencyBonus(after.livello));
  if (before.iniziativa) assertSame("Iniziativa", before.iniziativa, initiativeBonus(after));
  for (let i = 0; i < before.caratteristiche.length; i++) {
    const old = before.caratteristiche[i];
    const current = after.caratteristiche[i];
    assertSame(`${old.abbr} modificatore`, old.modificatore, abilityModifier(current.valore));
    assertSame(`${old.abbr} tiro salvezza`, old.tsBonus, savingThrowBonus(after, current));
  }
  const calculatedPassive = passivePerception(after);
  const oldPassive = before.percezionePassiva;
  const correctErin = row.name === "Erin" && oldPassive === "13" && calculatedPassive === "15";
  if (!correctErin) assertSame("Percezione passiva", oldPassive, calculatedPassive);
  if (JSON.stringify(before) === JSON.stringify(after)) continue;
  const changes = correctErin ? [{ field: "Percezione passiva", before: "13", after: "15" }] : [];
  plans.push({ id: String(row.id), name: String(row.name), oldData: String(row.data),
    newData: JSON.stringify(after), updatedAt: row.updated_at, changes,
    removedFields: (before.bonusCompetenza !== undefined ? 1 : 0)
      + (before.iniziativa !== undefined ? 1 : 0)
      + (oldPassive !== undefined ? 1 : 0)
      + before.caratteristiche.reduce((count, item) => count + Number(item.modificatore !== undefined) + Number(item.tsBonus !== undefined), 0),
  });
}

console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", characters: plans.map(({ name, removedFields, changes }) =>
  ({ name, removedFields, changes })) }, null, 2));
if (!apply || plans.length === 0) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `derived-stats-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
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
