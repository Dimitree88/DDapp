import type { Sheet } from "./sheet";

export type CharacterCardStatus = {
  id: string;
  name: string;
  hpCurrent: number | null;
  hpMax: number | null;
  hpTemp: number;
  conditions: string[];
  inspiration: boolean;
  coinBalances: Sheet["monete"];
  coins: { key: "rame" | "argento" | "electrum" | "oro" | "platino"; label: string; amount: string }[];
};

export function characterCardStatus(id: string, name: string, sheet: Sheet): CharacterCardStatus {
  const currentHp = Number(sheet.puntiFerita);
  const maxHp = Number(sheet.puntiFeritaMax);
  const validHp = Number.isFinite(currentHp) && Number.isFinite(maxHp) && maxHp > 0;
  const hpTemp = Number(sheet.puntiFeritaTemporanei ?? 0);
  const conditions = [
    ...(sheet.condizioni ?? []).map((condition) => condition.nome),
    ...(sheet.indebolimento ? [`Indebolimento ${sheet.indebolimento}`] : []),
  ];
  const coins = ([
    ["rame", "Rame"], ["argento", "Argento"], ["electrum", "Electrum"], ["oro", "Oro"], ["platino", "Platino"],
  ] as const).flatMap(([key, label]) => {
    const amount = Number(sheet.monete[key] || 0);
    return Number.isSafeInteger(amount) && amount > 0 ? [{ key, label, amount: String(amount) }] : [];
  });
  return {
    id, name,
    hpCurrent: validHp ? currentHp : null,
    hpMax: validHp ? maxHp : null,
    hpTemp: Number.isFinite(hpTemp) && hpTemp > 0 ? hpTemp : 0,
    conditions, inspiration: sheet.ispirazioneEroica, coinBalances: sheet.monete, coins,
  };
}
