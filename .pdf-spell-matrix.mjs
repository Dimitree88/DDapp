import fs from "node:fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const pdf = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync("docs/regole/Manuale Del Giocatore - 2024.pdf")), useSystemFonts: true }).promise;
const pages = [62, 72, 82, 98, 111, 114, 115, 116, 134, 144, 154, 168];
const terms = ["Trucchetti.", "Cambiare gli incantesimi preparati.", "Libro degli incantesimi.", "Magia del Patto", "Ogni volta che il personaggio ottiene un livello", "Ogni volta che il numero cresce"];
for (const number of pages) {
  const page = (await (await pdf.getPage(number)).getTextContent()).items.map((item) => item.str).join(" ");
  const flat = page.toLocaleLowerCase("it").replace(/\s+/g, " ");
  for (const term of terms) {
    const index = flat.indexOf(term.toLocaleLowerCase("it"));
    if (index < 0) continue;
    process.stdout.write(`\nPDF ${number} — ${term}\n${page.slice(Math.max(0, index-80), index+950)}\n`);
  }
}
