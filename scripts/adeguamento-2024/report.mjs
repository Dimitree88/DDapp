// Report di copertura del piano 2024: node --import tsx scripts/adeguamento-2024/report.mjs [ID…]
import { readdirSync, readFileSync } from "node:fs";
import { coperturaModulo, esitoRiga, moduliBlocchiIncantesimi, righe } from "./copertura.ts";

const stati = Object.fromEntries(readdirSync("docs/adeguamento-2024/stato").map((nome) =>
  [nome.replace(/\.json$/, ""), JSON.parse(readFileSync(`docs/adeguamento-2024/stato/${nome}`, "utf8")).stato]));
const richiesti = process.argv.slice(2);
const moduli = richiesti.length ? richiesti : [...Object.keys(stati), ...moduliBlocchiIncantesimi.filter((id) => !stati[id])];

console.log("Modulo  Stato        Valori verificati  Righe verificate  Aperti");
for (const modulo of moduli) {
  const { valori, righe: proprie } = coperturaModulo(modulo);
  if (!valori.totale && !proprie.totale && !richiesti.length) continue;
  const aperti = valori.aperti.length + proprie.aperte.length;
  console.log(`${modulo.padEnd(7)} ${(stati[modulo] ?? "senza stato").padEnd(12)} ${`${valori.verificati}/${valori.totale}`.padStart(17)}  ${`${proprie.verificate}/${proprie.totale}`.padStart(16)}  ${aperti}`);
  if (richiesti.length) for (const voce of [...valori.mancanti, ...proprie.mancanti]) console.log(`  manca: ${voce}`);
}
const esiti = righe.map(esitoRiga);
console.log(`\nRighe della matrice: ${righe.length} · verificate ${esiti.filter((e) => e === "verificato").length} · da fare ${esiti.filter((e) => e === "da_fare").length} · aperte ${esiti.filter((e) => e === "aperto").length} · app ${esiti.filter((e) => e === "app").length}`);
