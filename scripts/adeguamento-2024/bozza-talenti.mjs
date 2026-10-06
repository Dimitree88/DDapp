// Bozza dei file dei talenti dalla copia automatica del PDF (pp. 200-212):
// titolo, categoria, prerequisito e ancore; da verificare poi sulla pagina.
// Uso: node --import tsx scripts/adeguamento-2024/bozza-talenti.mjs <dominio> <categoria> [da] [aEscluso]
import { writeFileSync } from "node:fs";
import { chiaveAncora, flusso, trova } from "./estrai-testi.ts";
import { chiaveOrdinamento } from "../../lib/manuale-2024/index.ts";
import regole from "../../lib/manuale-2024-domains.json" with { type: "json" };

const [dominio, categoria, da, aEscluso] = process.argv.slice(2);
const MODULI = { "talenti/origini": "T01", "talenti/generali-a": "T02A", "talenti/generali-b": "T02B", "talenti/stili": "T03", "talenti/doni-epici": "T04" };
const nomi = Object.values(regole.talenti).flat();
const sorgente = flusso(200, 12);
const SOTTOTITOLO = /^Talento (Origini|Generale|Stile ?di ?combattimento|Dono epico)\s*(?:\((?:p|P)rerequisito:\s*([^)]*)\))?/;

// Spazi persi dall'OCR nei prerequisiti («osuperiore», «delpatto»…).
const pulisciPrerequisito = (testo) => testo?.trim()
  .replace(/(\d°)(?=\S)/g, "$1 ").replace(/\bosuperiore\b/g, "o superiore").replace(/delpatto\b/g, "del patto")
  .replace(/\bIncantesimio\b/g, "Incantesimi o").replace(/\bo(?=[A-Z])/g, "o ")
  .replace(/negliscudi/g, "negli scudi").replace(/armaturepesanti/g, "armature pesanti").replace(/([a-zà-ù])(\d)/g, "$1 $2");

// Titoli dei talenti: righe di titolo seguite dal sottotitolo «Talento …».
const titoli = [];
for (const [indice, riga] of sorgente.righe.entries()) {
  if (!riga.titolo) continue;
  const successiva = sorgente.righe[indice + 1];
  const sottotitolo = successiva && SOTTOTITOLO.exec(sorgente.testo.slice(successiva.inizio, successiva.fine).trim());
  if (!sottotitolo) continue;
  // «1Ì» è la resa OCR di «TI» nei titoli in maiuscoletto (es. «1ÌRO» per «TIRO»).
  const testoTitolo = sorgente.testo.slice(riga.inizio, riga.fine).replace(/^#+\s*/, "").replace(/^1Ì/, "TI").trim();
  const nome = nomi.find((candidato) => chiaveAncora(candidato) === chiaveAncora(testoTitolo));
  if (!nome) throw new Error(`Titolo non riconosciuto: ${testoTitolo}`);
  titoli.push({ nome, riga, pagina: riga.pagina, categoria: sottotitolo[1].replace(/^Stile ?di ?combattimento$/, "Stile di combattimento"), titoloStampato: testoTitolo.replace(/^TI/, sorgente.testo.slice(riga.inizio, riga.fine).replace(/^#+\s*/, "").slice(0, 2)), prerequisito: pulisciPrerequisito(sottotitolo[2]), sottotitolo: sottotitolo[0] });
}
// Titoli di sezione che chiudono l'ultimo talento di una categoria.
const sezioni = sorgente.righe.filter((riga) => riga.titolo && /TALENTI (GENERALI|STILE|DONI|DONO)/i.test(sorgente.testo.slice(riga.inizio, riga.fine)));

const occorrenza = (testo, pagina, posizione, partenza) => {
  for (let n = 1; ; n++) {
    const trovato = trova(sorgente, testo, partenza, n);
    if (!trovato) throw new Error(`«${testo}» non raggiunto a p. ${pagina}`);
    if (trovato.inizio >= posizione) return n;
  }
};

const scelti = titoli.filter((titolo) => titolo.categoria.toLowerCase() === categoria.toLowerCase())
  .filter((titolo) => !da || chiaveOrdinamento(titolo.nome) >= chiaveOrdinamento(da))
  .filter((titolo) => !aEscluso || chiaveOrdinamento(titolo.nome) < chiaveOrdinamento(aEscluso));
const voci = scelti.map((titolo) => {
  const indice = titoli.indexOf(titolo);
  const inizioPagina = sorgente.righe.find((riga) => riga.pagina === titolo.pagina).inizio;
  // Se l'OCR ha alterato il titolo, l'ancora usa il titolo come compare nella copia.
  const da = chiaveAncora(titolo.titoloStampato) === chiaveAncora(titolo.nome) ? titolo.nome : titolo.titoloStampato;
  const ancora = { pagina: titolo.pagina, da };
  const n = occorrenza(da, titolo.pagina, titolo.riga.inizio, inizioPagina);
  if (n > 1) ancora.n = n;
  ancora.dopo = titolo.sottotitolo;
  const prossimo = titoli[indice + 1];
  const sezione = sezioni.find((riga) => riga.inizio > titolo.riga.inizio);
  const fine = [prossimo?.riga, sezione].filter(Boolean).sort((a, b) => a.inizio - b.inizio)[0];
  if (fine) {
    const testoFine = fine === prossimo?.riga ? (chiaveAncora(prossimo.titoloStampato) === chiaveAncora(prossimo.nome) ? prossimo.nome : prossimo.titoloStampato) : sorgente.testo.slice(fine.inizio, fine.fine).replace(/^#+\s*/, "").trim();
    ancora.a = testoFine;
    const inizioTesto = titolo.riga.fine;
    const na = occorrenza(testoFine, titolo.pagina, fine.inizio, inizioTesto);
    if (na > 1) ancora.na = na;
  }
  const slug = chiaveOrdinamento(titolo.nome) && titolo.nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    id: `talento:${slug}`, tipo: "talento", nome: titolo.nome,
    testo: [ancora], pagina: titolo.pagina,
    categoria: titolo.categoria === "Generale" ? "Generale" : titolo.categoria,
    ...(titolo.prerequisito ? { prerequisito: titolo.prerequisito } : {}),
    ripetibile: false,
    verifica: { stato: "da_verificare" },
  };
});
writeFileSync(`lib/manuale-2024/${dominio}.json`, JSON.stringify({
  dominio, modulo: MODULI[dominio], fonte: "docs/regole/Manuale Del Giocatore - 2024.pdf", tipoPagina: "stampata", etichette: [], voci,
}, null, 2));
console.log(`${dominio}: ${voci.length} talenti`);
