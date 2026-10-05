import type { Sheet } from "./sheet";

// Valore della moneta, Manuale del Giocatore 2024, p. 213. Il totale non modifica le monete.
export function coinTotalGold(coins: Sheet["monete"]): string | null {
  const values = Object.values(coins);
  if (values.some((value) => value && !/^\d+$/.test(value))) return null;
  const copper = Number(coins.rame || 0) + 10 * Number(coins.argento || 0) + 50 * Number(coins.electrum || 0) + 100 * Number(coins.oro || 0) + 1000 * Number(coins.platino || 0);
  if (!Number.isSafeInteger(copper)) return null;
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 }).format(copper / 100);
}
