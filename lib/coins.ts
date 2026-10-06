import type { Sheet } from "./sheet";

// Valore della moneta, Manuale del Giocatore 2024, p. 213. Il totale non modifica le monete.
export function coinTotals(coins: Sheet["monete"]): Record<keyof Sheet["monete"], string> | null {
  const values = Object.values(coins);
  if (values.some((value) => value && !/^\d+$/.test(value))) return null;
  const copper = Number(coins.rame || 0) + 10 * Number(coins.argento || 0) + 50 * Number(coins.electrum || 0) + 100 * Number(coins.oro || 0) + 1000 * Number(coins.platino || 0);
  if (!Number.isSafeInteger(copper)) return null;
  const format = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 3 });
  return {
    rame: format.format(copper),
    argento: format.format(copper / 10),
    electrum: format.format(copper / 50),
    oro: format.format(copper / 100),
    platino: format.format(copper / 1000),
  };
}

export function coinTotalGold(coins: Sheet["monete"]): string | null {
  return coinTotals(coins)?.oro ?? null;
}
