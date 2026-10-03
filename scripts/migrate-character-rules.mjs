import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeSheet } from "../lib/sheet.ts";
import { domainErrors } from "../lib/domain.ts";

config({ path: ".env.local", quiet: true });
const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const apply = process.argv.includes("--apply");
const rows = (await client.execute("SELECT id, name, data, updated_at FROM characters ORDER BY id")).rows;
const plans = [];
function changedPaths(before, after, path = "") {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (before && after && typeof before === "object" && typeof after === "object") {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].flatMap((key) => changedPaths(before[key], after[key], path ? `${path}.${key}` : key));
  }
  return [path];
}

for (const row of rows) {
  const before = JSON.parse(String(row.data));
  const after = normalizeSheet(before);
  const errors = domainErrors(after);
  if (errors.length) throw new Error(`Valori non validi per ${row.name}: ${errors.join("; ")}`);
  const oldData = String(row.data);
  const newData = JSON.stringify(after);
  if (oldData === newData) continue;
  const historyRows = (await client.execute({
    sql: "SELECT changes FROM character_history WHERE character_id = ?",
    args: [row.id],
  })).rows;
  const existingChanges = historyRows.flatMap((event) => JSON.parse(String(event.changes)));
  const archive = [];
  const addArchive = (field, value) => {
    if (!value?.trim()) return;
    if (existingChanges.some((change) => change.field === field && (change.before === value || change.after === value))) return;
    archive.push({ field, before: value, after: "—" });
  };
  for (const ability of before.abilita ?? []) addArchive(`Abilità · ${ability.nome} · Nota`, ability.note);
  for (const weapon of before.armi ?? []) addArchive(`Arma · ${weapon.nome} · Provenienza`, weapon.provenienza);
  for (const item of before.equipaggiamento ?? []) addArchive(`Oggetto · ${item.nome} · Provenienza`, item.provenienza);
  for (const feat of before.talenti ?? []) {
    const provenance = /^Provenienza:\s*([^\r\n]+)/i.exec(feat.descrizione ?? "");
    if (provenance) addArchive(`Talento · ${feat.nome} · Provenienza`, provenance[1]);
  }
  for (const line of (before.noteLingue ?? "").split(/\r?\n/)) {
    const provenance = /^(.+?)\s+\((da [^)]+)\)$/i.exec(line.trim());
    if (provenance) addArchive(`Lingua · ${provenance[1]} · Provenienza`, provenance[2]);
  }
  addArchive("Classe armatura · Nota archiviata", before.noteClasseArmatura);
  addArchive("Velocità · Nota archiviata", before.noteVelocita);
  plans.push({ id: String(row.id), name: String(row.name), oldData, newData,
    updatedAt: row.updated_at, archive, after });
}

console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", characters: plans.map((plan) => ({
  name: plan.name,
  changedPaths: changedPaths(JSON.parse(plan.oldData), plan.after),
  newProvenanceNotes: plan.archive.length,
  languageNote: plan.after.noteLingue,
  abilityNotes: plan.after.abilita.filter((ability) => Object.hasOwn(ability, "note")).length,
  weapons: plan.after.armi.map(({ nome, bonus, note }) => ({ nome, bonus, note })),
  equipment: plan.after.equipaggiamento.filter((item) => item.dettaglio).map((item) => ({ nome: item.nome, dettaglio: item.dettaglio })),
  privileges: plan.after.privilegi,
  feats: plan.after.talenti,
  spells: plan.after.incantesimi,
})) }, null, 2));
if (!apply || plans.length === 0) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `rules-cleanup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
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
    const changes = [
      ...plan.archive,
      { field: "Migrazione scheda", before: "Regole e appunti nei campi", after: "Scelte personali conservate; regole rimosse dalla scheda" },
    ];
    await tx.execute({
      sql: "INSERT INTO character_history (id, character_id, occurred_at, changes) VALUES (?, ?, ?, ?)",
      args: [randomUUID(), plan.id, now, JSON.stringify(changes)],
    });
  }
  await tx.commit();
  console.log(JSON.stringify({ applied: true, charactersUpdated: plans.length,
    newProvenanceNotes: plans.reduce((total, plan) => total + plan.archive.length, 0), backupPath }));
} catch (error) {
  await tx.rollback();
  throw error;
}
