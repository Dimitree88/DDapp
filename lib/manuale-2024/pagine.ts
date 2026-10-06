// Riferimenti di pagina del Manuale del Giocatore 2024.
// Le voci usano sempre la pagina stampata; la pagina del file PDF serve solo
// per aprire il documento. Scarto e capitoli sono verificati sui piè di pagina
// del PDF locale (evidenza: docs/adeguamento-2024/evidenze/F00.md).

export const FONTE_MANUALE = "docs/regole/Manuale Del Giocatore - 2024.pdf";
export const TITOLO_MANUALE = "Manuale del Giocatore 2024";
export const SCARTO_PAGINA_PDF = 3;
export const PRIMA_PAGINA_STAMPATA = 1;
export const ULTIMA_PAGINA_STAMPATA = 387;

export type IntervalloPagine = readonly [number, number];

export const CAPITOLI = [
  { id: "introduzione", titolo: "Introduzione - Benvenuti nell'avventura", pagine: [4, 6] },
  { id: "capitolo-1", titolo: "Capitolo 1 - Come si gioca", pagine: [7, 32] },
  { id: "capitolo-2", titolo: "Capitolo 2 - Creare un personaggio", pagine: [33, 48] },
  { id: "capitolo-3", titolo: "Capitolo 3 - Classi dei personaggi", pagine: [49, 176] },
  { id: "capitolo-4", titolo: "Capitolo 4 - Origini dei personaggi", pagine: [177, 198] },
  { id: "capitolo-5", titolo: "Capitolo 5 - Talenti", pagine: [199, 212] },
  { id: "capitolo-6", titolo: "Capitolo 6 - Equipaggiamento", pagine: [213, 234] },
  { id: "capitolo-7", titolo: "Capitolo 7 - Incantesimi", pagine: [235, 343] },
  { id: "appendice-a", titolo: "Appendice A - Il multiverso", pagine: [344, 345] },
  { id: "appendice-b", titolo: "Appendice B - Schede delle statistiche delle creature", pagine: [346, 359] },
  { id: "appendice-c", titolo: "Appendice C - Glossario delle regole", pagine: [360, 377] },
  { id: "indice-analitico", titolo: "Indice", pagine: [378, 387] },
] as const satisfies readonly { id: string; titolo: string; pagine: IntervalloPagine }[];

export type IdCapitolo = (typeof CAPITOLI)[number]["id"];

export function paginaValida(pagina: unknown): pagina is number {
  return Number.isInteger(pagina) && (pagina as number) >= PRIMA_PAGINA_STAMPATA && (pagina as number) <= ULTIMA_PAGINA_STAMPATA;
}

export function paginaPdf(stampata: number): number {
  if (!paginaValida(stampata)) throw new RangeError(`Pagina stampata non valida: ${stampata}`);
  return stampata + SCARTO_PAGINA_PDF;
}

export function paginaStampata(pdf: number): number | null {
  const stampata = pdf - SCARTO_PAGINA_PDF;
  return paginaValida(stampata) ? stampata : null;
}

export function capitoloDiPagina(pagina: number) {
  return CAPITOLI.find(({ pagine: [da, a] }) => pagina >= da && pagina <= a) ?? null;
}

export function paginaNegliIntervalli(pagina: number, intervalli: readonly IntervalloPagine[]): boolean {
  return intervalli.some(([da, a]) => pagina >= da && pagina <= a);
}

export function intervalloCapitolo(id: IdCapitolo): IntervalloPagine {
  return CAPITOLI.find((capitolo) => capitolo.id === id)!.pagine;
}

// «Manuale del Giocatore 2024, p. 39» oppure «…, pp. 215, 219».
export function riferimentoManuale(pagine: number | readonly number[]): string {
  const elenco = [...new Set(typeof pagine === "number" ? [pagine] : pagine)].sort((a, b) => a - b);
  if (elenco.length === 0 || !elenco.every(paginaValida)) throw new RangeError(`Pagine non valide: ${elenco.join(", ")}`);
  return `${TITOLO_MANUALE}, ${elenco.length === 1 ? "p." : "pp."} ${elenco.join(", ")}`;
}
