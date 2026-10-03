import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { createHash } from "node:crypto";

config({ path: ".env.local", quiet: true });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const checksum = async () => {
  const rows = (await client.execute("SELECT id, data FROM characters ORDER BY id")).rows;
  return {
    count: rows.length,
    hash: createHash("sha256").update(JSON.stringify(rows.map((row) => [row.id, row.data]))).digest("hex"),
  };
};

const before = await checksum();
await client.execute(`CREATE TABLE IF NOT EXISTS character_history (
  id TEXT PRIMARY KEY NOT NULL,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  occurred_at INTEGER NOT NULL,
  changes TEXT NOT NULL
)`);
await client.execute("CREATE INDEX IF NOT EXISTS character_history_character_time_idx ON character_history (character_id, occurred_at)");
// La versione pubblicata usa secondi. Riporta a quell'unità gli eventuali
// valori in millisecondi scritti dal server locale; la conversione è idempotente.
await client.execute("UPDATE character_history SET occurred_at = CAST(occurred_at / 1000 AS INTEGER) WHERE occurred_at >= 1000000000000 AND occurred_at < 100000000000000");
const after = await checksum();
if (before.count !== after.count || before.hash !== after.hash) throw new Error("I dati dei personaggi sono cambiati durante la migrazione");
console.log(JSON.stringify({
  historyTableReady: true,
  charactersPreserved: before.count,
  historyRows: Number((await client.execute("SELECT COUNT(*) AS count FROM character_history")).rows[0].count),
  millisecondTimestamps: Number((await client.execute("SELECT COUNT(*) AS count FROM character_history WHERE occurred_at >= 1000000000000")).rows[0].count),
}));
