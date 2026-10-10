import type { Sheet } from "./sheet";

export function freshStartSheet(sheet: Sheet): Sheet {
  const maxText = String(sheet.puntiFeritaMax ?? "").trim();
  const maxHp = Number(maxText);
  if (!/^\d+$/.test(maxText) || !Number.isSafeInteger(maxHp) || maxHp < 1) {
    throw new Error("PF massimi mancanti o non validi.");
  }

  const next: Sheet = {
    ...sheet,
    puntiFerita: String(maxHp),
    puntiFeritaTemporanei: "0",
    dadiVitaSpesi: "0",
    tiriMorte: { successi: 0, fallimenti: 0 },
    condizioni: [],
    indebolimento: 0,
    ispirazioneEroica: sheet.specie === "Umano",
    ...(sheet.risorse ? { risorse: sheet.risorse.map((resource) => ({ ...resource, spesi: 0 })) } : {}),
    ...(sheet.slotSpesi ? { slotSpesi: Object.fromEntries(Object.keys(sheet.slotSpesi).map((level) => [level, 0])) } : {}),
  };
  delete next.statoMorte;
  delete next.concentrazione;
  return next;
}
