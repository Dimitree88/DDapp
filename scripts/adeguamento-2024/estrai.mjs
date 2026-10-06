// Estrae le descrizioni dal PDF locale (copia in docs/manuale-copia/auto) nei
// file lib/manuale-2024/testi/<dominio>.json.
// Uso: node --import tsx scripts/adeguamento-2024/estrai.mjs [--controlla] [--sospetti] [dominio…]
//   --controlla  non scrive: segnala i file generati non aggiornati
//   --sospetti   elenca parole anomale da confrontare con la pagina del PDF
import { readFileSync, writeFileSync } from "node:fs";
import { FILE_MANUALE } from "../../lib/manuale-2024/registro.ts";
import { estraiDominio, paroleSospette } from "./estrai-testi.ts";

const argomenti = process.argv.slice(2);
const controlla = argomenti.includes("--controlla");
const sospetti = argomenti.includes("--sospetti");
const richiesti = argomenti.filter((argomento) => !argomento.startsWith("--"));
const domini = richiesti.length ? richiesti : Object.keys(FILE_MANUALE);

let problemi = 0;
for (const dominio of domini) {
  const file = FILE_MANUALE[dominio];
  if (!file) {
    console.error(`Dominio sconosciuto: ${dominio}`);
    problemi++;
    continue;
  }
  const { testi, errori } = estraiDominio(file);
  for (const errore of errori) console.error(`ERRORE ${errore}`);
  problemi += errori.length;
  const percorso = `lib/manuale-2024/testi/${dominio}.json`;
  const contenuto = `${JSON.stringify({ dominio, testi }, null, 2)}\n`;
  if (controlla) {
    const attuale = readFileSync(percorso, "utf8").replace(/\r\n/g, "\n");
    if (attuale !== contenuto) {
      console.error(`NON AGGIORNATO ${percorso}`);
      problemi++;
    }
  } else if (errori.length === 0) {
    writeFileSync(percorso, contenuto);
  }
  if (sospetti) {
    for (const [id, testo] of Object.entries(testi)) {
      const parole = paroleSospette(testo);
      if (parole.length) console.log(`${id}: ${parole.join(" | ")}`);
    }
  }
  console.log(`${dominio}: ${Object.keys(testi).length} testi${errori.length ? `, ${errori.length} errori (file non scritto)` : ""}`);
}
process.exitCode = problemi ? 1 : 0;
