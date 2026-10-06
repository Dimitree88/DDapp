// Riformatta in modo compatto i file JSON dei domini (oggetti brevi su una riga).
// Uso: node scripts/adeguamento-2024/formatta.mjs <file.json…>
import { readFileSync, writeFileSync } from "node:fs";

const LARGHEZZA = 110;
const inLinea = (valore) => valore === null || typeof valore !== "object" ? JSON.stringify(valore)
  : Array.isArray(valore) ? `[${valore.map(inLinea).join(", ")}]`
    : `{ ${Object.entries(valore).map(([chiave, elemento]) => `${JSON.stringify(chiave)}: ${inLinea(elemento)}`).join(", ")} }`;

function formatta(valore, rientro = "") {
  const compatto = inLinea(valore);
  if (compatto.length + rientro.length <= LARGHEZZA || valore === null || typeof valore !== "object") return compatto;
  const interno = `${rientro}  `;
  if (Array.isArray(valore)) return `[\n${valore.map((elemento) => interno + formatta(elemento, interno)).join(",\n")}\n${rientro}]`;
  return `{\n${Object.entries(valore).map(([chiave, elemento]) => `${interno}${JSON.stringify(chiave)}: ${formatta(elemento, interno)}`).join(",\n")}\n${rientro}}`;
}
for (const percorso of process.argv.slice(2)) {
  writeFileSync(percorso, `${formatta(JSON.parse(readFileSync(percorso, "utf8")))}\n`);
}
