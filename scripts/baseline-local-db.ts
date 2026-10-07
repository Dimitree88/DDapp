import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const migrationFolder = "drizzle";
const journal = JSON.parse(readFileSync(`${migrationFolder}/meta/_journal.json`, "utf8")) as {
  entries: { tag: string; when: number }[];
};
const initial = journal.entries[0];
if (!initial || initial.tag !== "0000_0000_initial") throw new Error("La migration iniziale attesa non è presente.");

const expectedColumns: Record<string, string[]> = {
  characters: ["id", "name", "pin_hash", "data", "created_at", "updated_at"],
  character_history: ["id", "character_id", "occurred_at", "changes"],
  creatures: ["id", "name", "data", "created_at", "updated_at"],
  master_sessions: ["id", "name", "local_date", "status", "created_at", "closed_at"],
  master_session_participants: ["session_id", "character_id"],
  master_session_creatures: ["session_id", "creature_id"],
  master_session_events: ["id", "session_id", "character_id", "creature_id", "type", "occurred_at", "payload"],
};
const expectedIndexes = [
  "character_history_character_time_idx",
  "master_sessions_single_open_idx",
  "master_sessions_status_created_idx",
  "master_session_events_session_time_idx",
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) throw new Error("Baseline interrotta: DATABASE_URL deve essere file:... locale.");
  if (process.env.DATABASE_AUTH_TOKEN?.trim()) throw new Error("Baseline interrotta: DATABASE_AUTH_TOKEN deve essere vuoto.");
  const client = createClient({ url });
  try {
  const tablesResult = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table'");
  const tables = new Set(tablesResult.rows.map((row) => String(row.name)));
  for (const [table, required] of Object.entries(expectedColumns)) {
    if (!tables.has(table)) throw new Error(`Baseline interrotta: manca la tabella ${table}; usa prima la migration completa su un database vuoto.`);
    const info = await client.execute(`PRAGMA table_info("${table}")`);
    const actual = new Set(info.rows.map((row) => String(row.name)));
    const missing = required.filter((column) => !actual.has(column));
    if (missing.length) throw new Error(`Baseline interrotta: ${table} non ha le colonne richieste (${missing.join(", ")}). Nessun dato è stato modificato.`);
  }
  const indexesResult = await client.execute("SELECT name FROM sqlite_master WHERE type = 'index'");
  const indexes = new Set(indexesResult.rows.map((row) => String(row.name)));
  const absentIndexes = expectedIndexes.filter((index) => !indexes.has(index));
  if (absentIndexes.length) throw new Error(`Baseline interrotta: indici mancanti (${absentIndexes.join(", ")}). Nessun dato è stato modificato.`);

  const sql = readFileSync(`${migrationFolder}/${initial.tag}.sql`, "utf8");
  const hash = createHash("sha256").update(sql).digest("hex");
  await client.execute(`CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (id INTEGER PRIMARY KEY AUTOINCREMENT, hash text NOT NULL, created_at numeric)`);
  const existing = await client.execute("SELECT hash, created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1");
  if (existing.rows.length) {
    const last = existing.rows[0];
    if (last.hash === hash && Number(last.created_at) === initial.when) {
      console.log("Baseline già registrato; database invariato.");
      process.exitCode = 0;
    } else {
      throw new Error("Baseline non applicato: il registro contiene già una migration diversa. Nessun dato è stato sovrascritto.");
    }
  } else {
    await client.execute({
      sql: "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      args: [hash, initial.when],
    });
    console.log(`Schema locale verificato e migration iniziale registrata (${initial.tag}); dati esistenti conservati.`);
  }
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
