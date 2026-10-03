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
const result = await client.execute({
  sql: "SELECT id, name, data, updated_at FROM characters WHERE id = ? AND name = ?",
  args: ["ephemer", "Ephemer"],
});
if (result.rows.length !== 1) throw new Error("Ephemer non trovato in modo univoco");
const row = result.rows[0];
const originalData = String(row.data);
const sheet = JSON.parse(originalData);
const sections = new Map();
function archive(section, field, value) {
  if (!sections.has(section)) sections.set(section, []);
  sections.get(section).push({ field, before: value, after: "—" });
}

for (const ability of sheet.abilita ?? []) {
  const note = ability.note?.trim();
  if (note && /^da\s+\S/i.test(note)) {
    archive("Abilità", `Abilità · ${ability.nome} · Nota`, ability.note);
    ability.note = "";
  }
}
for (const weapon of sheet.armi ?? []) {
  if (weapon.provenienza?.trim()) {
    archive("Armi", `Arma · ${weapon.nome} · Provenienza`, weapon.provenienza);
    weapon.provenienza = "";
  }
}
for (const item of sheet.equipaggiamento ?? []) {
  if (item.provenienza?.trim()) {
    archive("Equipaggiamento", `Oggetto · ${item.nome} · Provenienza`, item.provenienza);
    item.provenienza = "";
  }
}
for (const feat of sheet.talenti ?? []) {
  const match = /^Provenienza:\s*([^\r\n]+)\r?\n/i.exec(feat.descrizione ?? "");
  if (match) {
    archive("Talenti", `Talento · ${feat.nome} · Provenienza`, match[1]);
    feat.descrizione = feat.descrizione.slice(match[0].length);
  }
}
const keptLanguageNotes = [];
for (const line of (sheet.noteLingue ?? "").split(/\r?\n/)) {
  const match = /^(.*?)\s+\((da [^)]+)\)$/.exec(line.trim());
  if (!match) {
    if (line.trim()) keptLanguageNotes.push(line);
    continue;
  }
  archive("Lingue", `Lingua · ${match[1]} · Provenienza`, match[2]);
  if (!sheet.lingue.includes(match[1])) keptLanguageNotes.push(match[1]);
}
sheet.noteLingue = keptLanguageNotes.join("\n");

const preview = [...sections].map(([section, changes]) => ({ section, changes }));
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", character: row.name,
  notesRemaining: sheet.noteLingue, sections: preview }, null, 2));
if (!apply || sections.size === 0) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `ephemer-provenance-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
await writeFile(backupPath, JSON.stringify({ id: row.id, name: row.name,
  data: JSON.parse(originalData), updatedAt: row.updated_at }, null, 2));

const tx = await client.transaction("write");
try {
  const current = await tx.execute({ sql: "SELECT data FROM characters WHERE id = ?", args: [row.id] });
  if (current.rows.length !== 1 || current.rows[0].data !== originalData) {
    throw new Error("La scheda è cambiata dopo l'anteprima; nessuna modifica applicata");
  }
  const now = Math.floor(Date.now() / 1000);
  const updated = await tx.execute({
    sql: "UPDATE characters SET data = ?, updated_at = ? WHERE id = ? AND data = ?",
    args: [JSON.stringify(sheet), now, row.id, originalData],
  });
  if (updated.rowsAffected !== 1) throw new Error("Aggiornamento della scheda non riuscito");
  for (const changes of sections.values()) {
    await tx.execute({
      sql: "INSERT INTO character_history (id, character_id, occurred_at, changes) VALUES (?, ?, ?, ?)",
      args: [randomUUID(), row.id, now, JSON.stringify(changes)],
    });
  }
  await tx.commit();
  console.log(JSON.stringify({ applied: true, archivedNotes: preview.reduce((sum, item) => sum + item.changes.length, 0),
    historyEntries: sections.size, backupPath }));
} catch (error) {
  await tx.rollback();
  throw error;
}
