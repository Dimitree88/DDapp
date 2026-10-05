import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { normalizeSheet, retiredCharacterFields } from "../lib/sheet.ts";

dotenv.config({ path: ".env.local", quiet: true });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL non impostata");
const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const labels = [
  "PF temporanei", "Fonte PF massimi", "Incrementi PF", "Fonte CA",
  "Dadi Vita spesi", "Tiri morte", "Condizioni", "Fonte velocità",
  "Modificatori velocità",
];
const isRetired = (field) => labels.some((label) => field === label || field.startsWith(`${label} · `));

const [characters, history] = await Promise.all([
  client.execute("SELECT id, data FROM characters"),
  client.execute("SELECT id, changes FROM character_history"),
]);
const statements = [];
let cleanedCharacters = 0;
let cleanedChanges = 0;
for (const row of characters.rows) {
  const data = JSON.parse(row.data);
  if (!retiredCharacterFields.some((key) => Object.hasOwn(data, key))) continue;
  const cleaned = normalizeSheet(data);
  statements.push({ sql: "UPDATE characters SET data = ? WHERE id = ?", args: [JSON.stringify(cleaned), row.id] });
  cleanedCharacters++;
}
for (const row of history.rows) {
  const changes = JSON.parse(row.changes);
  const kept = changes.filter((change) => !isRetired(change.field));
  if (kept.length === changes.length) continue;
  cleanedChanges += changes.length - kept.length;
  statements.push(kept.length
    ? { sql: "UPDATE character_history SET changes = ? WHERE id = ?", args: [JSON.stringify(kept), row.id] }
    : { sql: "DELETE FROM character_history WHERE id = ?", args: [row.id] });
}
if (statements.length) await client.batch(statements, "write");
console.log(`Personaggi esaminati: ${characters.rows.length}; ripuliti: ${cleanedCharacters}. Voci dello storico rimosse: ${cleanedChanges}.`);
