// Rigenera lib/manuale-2024/registro.ts dai domini di domini.ts e dai file dei
// blocchi di incantesimi presenti. Uso: node --import tsx scripts/adeguamento-2024/genera-registro.mjs
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { DOMINI, dominioBloccoIncantesimi } from "../../lib/manuale-2024/domini.ts";
import blocchi from "../../lib/manuale-2024/incantesimi/blocchi.json" with { type: "json" };

const BASE = "lib/manuale-2024";
const chiavi = [
  ...Object.keys(DOMINI),
  ...blocchi.blocchi.map((blocco) => dominioBloccoIncantesimi(blocco.id)).filter((chiave) => existsSync(`${BASE}/${chiave}.json`)),
];
const nome = (prefisso, chiave) => prefisso + chiave.split(/[/-]/).map((parte) => parte[0].toUpperCase() + parte.slice(1)).join("");

for (const chiave of chiavi) {
  const percorso = `${BASE}/testi/${chiave}.json`;
  if (existsSync(percorso)) continue;
  mkdirSync(dirname(percorso), { recursive: true });
  writeFileSync(percorso, `${JSON.stringify({ dominio: chiave, testi: {} }, null, 2)}\n`);
}

const righe = [
  "// Generato da scripts/adeguamento-2024/genera-registro.mjs: non modificare a mano.",
  "import type { FileDominio, TestiDominio } from \"./schema\";",
  ...chiavi.flatMap((chiave) => [
    `import ${nome("file", chiave)} from "./${chiave}.json";`,
    `import ${nome("testi", chiave)} from "./testi/${chiave}.json";`,
  ]),
  "",
  "export const FILE_MANUALE: Record<string, FileDominio> = {",
  ...chiavi.map((chiave) => `  ${JSON.stringify(chiave)}: ${nome("file", chiave)} as unknown as FileDominio,`),
  "};",
  "",
  "export const TESTI_MANUALE: Record<string, TestiDominio> = {",
  ...chiavi.map((chiave) => `  ${JSON.stringify(chiave)}: ${nome("testi", chiave)} as TestiDominio,`),
  "};",
  "",
];
writeFileSync(`${BASE}/registro.ts`, righe.join("\n"));
console.log(`registro.ts: ${chiavi.length} domini`);
