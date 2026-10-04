// SRD 5.2.1, tabella dell'avanzamento dei personaggi.
export const experienceThresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000] as const;

export function advancementHint(levelText: string, xpText: string): string | null {
  const level = Number(levelText);
  const xp = Number(xpText);
  if (!Number.isInteger(level) || level < 1 || level > 20 || !Number.isSafeInteger(xp) || xp < 0) return null;
  if (level === 20) return "Livello massimo della progressione SRD.";
  const next = experienceThresholds[level];
  return xp >= next ? `Soglia per il livello ${level + 1} raggiunta (${next} PE). L'avanzamento resta una scelta esplicita.` : `${next - xp} PE alla soglia del livello ${level + 1} (${next} PE).`;
}
