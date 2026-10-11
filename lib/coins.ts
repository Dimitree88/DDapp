import type { Sheet } from "./sheet";

const coinDenominations: { key: keyof Sheet["monete"]; value: number }[] = [
  { key: "rame", value: 1 },
  { key: "argento", value: 10 },
  { key: "electrum", value: 50 },
  { key: "oro", value: 100 },
  { key: "platino", value: 1000 },
];

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

export function payCoins(
  coins: Sheet["monete"],
  amount: number,
  denomination: keyof Sheet["monete"],
): Sheet["monete"] | null {
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;

  const counts = {} as Record<keyof Sheet["monete"], number>;
  let totalCopper = 0;
  for (const coin of coinDenominations) {
    const value = coins[coin.key] || "0";
    if (!/^\d+$/.test(value)) return null;
    const count = Number(value);
    const copperValue = count * coin.value;
    if (!Number.isSafeInteger(count) || !Number.isSafeInteger(copperValue) || !Number.isSafeInteger(totalCopper + copperValue)) return null;
    counts[coin.key] = count;
    totalCopper += copperValue;
  }

  const denominationIndex = coinDenominations.findIndex((coin) => coin.key === denomination);
  const denominationValue = coinDenominations[denominationIndex]?.value;
  const paymentCopper = amount * denominationValue;
  if (!denominationValue || !Number.isSafeInteger(paymentCopper) || totalCopper < paymentCopper) return null;

  const next = { ...counts };
  const paidFromSelected = Math.min(amount, next[denomination]);
  next[denomination] -= paidFromSelected;
  let remaining = amount - paidFromSelected;

  // Change the nearest available higher denomination into the selected coin.
  for (let index = denominationIndex + 1; remaining > 0 && index < coinDenominations.length; index += 1) {
    const coin = coinDenominations[index];
    const rate = coin.value / denominationValue;
    const changedCount = Math.min(next[coin.key], Math.ceil(remaining / rate));
    if (!changedCount) continue;
    const received = changedCount * rate;
    const paid = Math.min(remaining, received);
    next[coin.key] -= changedCount;
    next[denomination] += received - paid;
    remaining -= paid;
  }

  // If larger coins cannot cover the payment, exchange lower coins together.
  if (remaining > 0) {
    const lowerCoins = coinDenominations.slice(0, denominationIndex);
    const lowerCopper = lowerCoins.reduce((sum, coin) => sum + next[coin.key] * coin.value, 0);
    const remainingCopper = remaining * denominationValue;
    if (!Number.isSafeInteger(lowerCopper) || lowerCopper < remainingCopper) return null;
    let changeCopper = lowerCopper - remainingCopper;
    for (let index = denominationIndex - 1; index >= 0; index -= 1) {
      const coin = coinDenominations[index];
      next[coin.key] = Math.floor(changeCopper / coin.value);
      changeCopper %= coin.value;
    }
  }

  return Object.fromEntries(coinDenominations.map((coin) => [coin.key, String(next[coin.key])])) as Sheet["monete"];
}
