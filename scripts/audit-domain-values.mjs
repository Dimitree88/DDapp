import { createClient } from "@libsql/client";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const result = await client.execute("SELECT id, name, data FROM characters ORDER BY name");
const fields = ["classe", "sottoclasse", "specie", "background", "allineamento", "taglia", "velocita"];
const output = {};
for (const field of fields) output[field] = {};
for (const field of ["lingue", "competenzeArmi", "armi", "talenti", "incantesimi"]) output[field] = {};
output.livelliIncantesimo = {};

function add(field, value, name) {
  if (value === undefined || value === null || value === "") return;
  const label = String(value);
  (output[field][label] ??= []).push(name);
}

for (const row of result.rows) {
  const data = JSON.parse(String(row.data));
  const name = String(row.name);
  for (const field of fields) add(field, data[field], name);
  for (const field of ["lingue", "competenzeArmi"]) {
    const values = Array.isArray(data[field]) ? data[field] :
      typeof data[field] === "string" ? data[field].split(/[;,\n]/).map((s) => s.trim()) : [];
    for (const value of values) add(field, value, name);
  }
  for (const field of ["armi", "talenti", "incantesimi"]) {
    for (const item of data[field] ?? []) add(field, item.nome, name);
  }
  for (const item of data.incantesimi ?? []) add("livelliIncantesimo", item.livello, name);
}

console.log(JSON.stringify({ characters: result.rows.length, values: output }, null, 2));
