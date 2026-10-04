import type { Sheet } from "./sheet";
import { displayedMaxHp } from "./classProgression";

export function applyDamage(sheet: Sheet, amount: number): Sheet | null {
  if (!Number.isSafeInteger(amount) || amount < 1 || !/^\d+$/.test(sheet.puntiFerita) || Number(sheet.puntiFerita) === 0) return null;
  const temporary = Number(sheet.puntiFeritaTemporanei || 0);
  if (!Number.isSafeInteger(temporary) || temporary < 0) return null;
  return { ...sheet, puntiFeritaTemporanei: String(Math.max(0, temporary - amount)), puntiFerita: String(Math.max(0, Number(sheet.puntiFerita) - Math.max(0, amount - temporary))) };
}

export function applyHealing(sheet: Sheet, amount: number): Sheet | null {
  const maximum = Number(displayedMaxHp(sheet));
  if (!Number.isSafeInteger(amount) || amount < 1 || !/^\d+$/.test(sheet.puntiFerita) || !Number.isSafeInteger(maximum) || maximum < 1) return null;
  return { ...sheet, puntiFerita: String(Math.min(maximum, Number(sheet.puntiFerita) + amount)), tiriMorte: { successi: 0, fallimenti: 0 } };
}

export function finishLongRest(sheet: Sheet): Sheet | null {
  const maximum = displayedMaxHp(sheet);
  if (!/^\d+$/.test(maximum) || Number(maximum) < 1 || !/^\d+$/.test(sheet.puntiFerita) || Number(sheet.puntiFerita) < 1) return null;
  return { ...sheet, puntiFerita: maximum, puntiFeritaTemporanei: "0", dadiVitaSpesi: "0", slotSpesi: {}, tiriMorte: { successi: 0, fallimenti: 0 }, risorse: sheet.risorse?.map((resource) => resource.ricarica === "manuale" ? resource : { ...resource, spesi: 0 }) };
}

export function finishShortRest(sheet: Sheet): Sheet {
  return { ...sheet, ...(sheet.classe === "Warlock" ? { slotSpesi: {} } : {}), risorse: sheet.risorse?.map((resource) => resource.ricarica === "breve" ? { ...resource, spesi: 0 } : resource) };
}
