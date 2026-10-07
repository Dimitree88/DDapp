import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";

const command = process.argv[2];
if (!["baseline", "migrate", "seed-demo"].includes(command)) {
  throw new Error("Comando valido: baseline, migrate oppure seed-demo.");
}

let localEnv;
try {
  localEnv = parse(readFileSync(".env.local"));
} catch {
  throw new Error("Manca .env.local. Imposta DATABASE_URL=\"file:local.db\" prima di proseguire.");
}

if (!localEnv.DATABASE_URL?.startsWith("file:")) {
  throw new Error("Operazione annullata: DATABASE_URL in .env.local deve puntare a un file SQLite locale (file:...).");
}
if (localEnv.DATABASE_AUTH_TOKEN?.trim()) {
  throw new Error("Operazione annullata: DATABASE_AUTH_TOKEN deve essere vuoto per i comandi locali.");
}

const args = command === "migrate"
  ? ["node_modules/drizzle-kit/bin.cjs", "migrate"]
  : command === "baseline"
    ? ["--import", "tsx", "scripts/baseline-local-db.ts"]
    : ["--import", "tsx", "scripts/seed-master-demo.ts"];
const result = spawnSync(process.execPath, args, {
  stdio: "inherit",
  env: { ...process.env, ...localEnv, DATABASE_AUTH_TOKEN: localEnv.DATABASE_AUTH_TOKEN ?? "" },
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
