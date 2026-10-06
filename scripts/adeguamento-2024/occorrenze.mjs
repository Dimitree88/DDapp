// Elenca le occorrenze di un testo d'ancora in una pagina stampata, per scegliere «n».
// Uso: node --import tsx scripts/adeguamento-2024/occorrenze.mjs <pagina> <testo…>
import { flusso, rigaDi, trova } from "./estrai-testi.ts";

const [pagina, ...parole] = process.argv.slice(2);
const cercato = parole.join(" ");
const sorgente = flusso(Number(pagina));
const righePagina = sorgente.righe.filter((riga) => riga.pagina === Number(pagina));
for (let n = 1; ; n++) {
  const trovato = trova(sorgente, cercato, righePagina[0]?.inizio ?? 0, n);
  if (!trovato) break;
  const riga = rigaDi(sorgente, trovato.inizio);
  const contesto = sorgente.testo.slice(Math.max(riga.inizio, trovato.inizio - 40), Math.min(riga.fine, trovato.fine + 40)).replace(/\n/g, " ");
  console.log(`n=${n}${riga.pagina !== Number(pagina) ? ` (p. ${riga.pagina})` : ""}${riga.titolo ? " [titolo]" : ""}: …${contesto}…`);
}
