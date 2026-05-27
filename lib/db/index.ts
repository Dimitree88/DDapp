import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL non impostata. Vedi .env.example");
}

const client = createClient({
  url,
  // Vuoto in locale (file:local.db); valorizzato per Turso in produzione.
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
