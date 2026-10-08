import type { CondizioneAttiva, ConcentrazioneAttiva } from "./sheet";

// Regole di gioco usate dalla vista Master, verificate nel Manuale del
// Giocatore 2024 locale. Funzioni pure: le usano sia l'anteprima nel client
// sia i comandi del server, così il risultato mostrato coincide con quello
// registrato.

// Condizioni del Glossario (p. 29, pp. 360-376). Indebolimento ha un contatore.
export const conditionNames = [
  "Accecato", "Affascinato", "Afferrato", "Assordato", "Avvelenato", "Incapacitato",
  "Invisibile", "Paralizzato", "Pietrificato", "Prono", "Privo di sensi", "Spaventato",
  "Stordito", "Trattenuto",
] as const;

// Condizioni che includono "incapacitato" (Glossario, pp. 360-376).
export const incapacitatingConditions = ["Incapacitato", "Paralizzato", "Pietrificato", "Privo di sensi", "Stordito"];

// Condizioni applicate da altre condizioni (Glossario, pp. 360-376).
export const impliedConditions: Record<string, string[]> = {
  Paralizzato: ["Incapacitato"],
  Pietrificato: ["Incapacitato"],
  Stordito: ["Incapacitato"],
  "Privo di sensi": ["Incapacitato", "Prono"],
};

export const ZERO_HP_SOURCE = "Punti ferita a 0";

// Tabella Avanzamento dei personaggi, p. 41.
export const xpThresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

export function levelForXp(xp: number): number {
  let level = 1;
  xpThresholds.forEach((threshold, index) => { if (xp >= threshold) level = index + 1; });
  return level;
}

// PE sufficienti per un livello superiore a quello registrato (p. 41).
export function readyToLevel(levelText: string, xpText: string): boolean {
  const level = Number(levelText);
  const xp = /^\d+$/.test(xpText.trim()) ? Number(xpText) : 0;
  return Number.isInteger(level) && level >= 1 && level < 20 && levelForXp(xp) > level;
}

export function xpProgress(xpText: string, levelText: string) {
  const xp = /^\d+$/.test(xpText.trim()) ? Number(xpText) : null;
  const level = Number(levelText);
  if (xp === null || !Number.isInteger(level) || level < 1 || level > 20) return null;
  const reached = levelForXp(xp);
  const next = level < 20 ? xpThresholds[level] : null;
  const floor = xpThresholds[level - 1];
  return {
    xp, level, reached, next,
    ready: reached > level,
    ratio: next === null ? 1 : Math.max(0, Math.min(1, (xp - floor) / (next - floor))),
  };
}

// Concentrazione, p. 364: CD = max(10, metà danni per difetto), fino a 30.
export function concentrationDc(damage: number): number {
  return Math.min(30, Math.max(10, Math.floor(damage / 2)));
}

// Sanguinante, p. 27: metà dei punti ferita o meno.
export function isBloodied(current: number, max: number): boolean {
  return max > 0 && current > 0 && current <= max / 2;
}

// Indebolimento, p. 366.
export function exhaustionEffects(level: number) {
  return { d20: -2 * level, speedMeters: 1.5 * level, dead: level >= 6 };
}

export type DeathState = "tiri" | "stabile" | "morto" | undefined;
export type HpState = {
  current: number;
  max: number;
  temp: number;
  saves: { successi: number; fallimenti: number };
  death: DeathState;
  conditions: CondizioneAttiva[];
  concentration?: ConcentrazioneAttiva;
};

export type HpOutcome = { next: HpState; details: string[]; warnings: string[] };

const withoutZeroHpUnconscious = (conditions: CondizioneAttiva[]) =>
  conditions.filter((condition) => !(condition.nome === "Privo di sensi" && condition.fonte === ZERO_HP_SOURCE));

const withZeroHpUnconscious = (conditions: CondizioneAttiva[]) =>
  conditions.some((condition) => condition.nome === "Privo di sensi" && condition.fonte === ZERO_HP_SOURCE)
    ? conditions
    : [...conditions, { nome: "Privo di sensi", fonte: ZERO_HP_SOURCE, durata: "Finché non recupera punti ferita", nota: "" }];

function endConcentration(state: HpState, reason: string, details: string[]) {
  if (!state.concentration) return;
  details.push(`Concentrazione su ${state.concentration.effetto} terminata (${reason}, p. 364)`);
  state.concentration = undefined;
}

// Danni a un personaggio giocante, pp. 28-29 e p. 364.
export function damageCharacter(before: HpState, amount: number, critical: boolean): HpOutcome {
  if (before.death === "morto") throw new Error("Il personaggio risulta morto.");
  const next: HpState = { ...before, saves: { ...before.saves }, conditions: [...before.conditions] };
  const details: string[] = [];
  const warnings: string[] = [];
  const tempLost = Math.min(next.temp, amount);
  next.temp -= tempLost;
  const rest = amount - tempLost;
  if (tempLost) details.push(`PF temporanei: ${before.temp} → ${next.temp}`);
  if (before.current === 0) {
    if (rest > 0) {
      if (rest >= before.max) {
        next.death = "morto";
        details.push(`Morte istantanea: ${rest} danni a 0 PF, pari o superiori ai PF massimi (p. 29)`);
      } else {
        next.saves.fallimenti = Math.min(3, next.saves.fallimenti + (critical ? 2 : 1));
        next.death = next.saves.fallimenti >= 3 ? "morto" : "tiri";
        details.push(`Danni a 0 PF: ${critical ? "due tiri falliti (colpo critico)" : "un tiro fallito"} · fallimenti ${next.saves.fallimenti}/3 (p. 29)`);
        if (before.death === "stabile") details.push("Non è più stabile: riprende i tiri salvezza contro morte");
        if (next.death === "morto") details.push("Terzo fallimento: il personaggio muore");
      }
    }
  } else {
    const remaining = Math.max(0, before.current - rest);
    next.current = remaining;
    details.push(`PF: ${before.current} → ${remaining}`);
    if (remaining === 0) {
      const overflow = rest - before.current;
      next.saves = { successi: 0, fallimenti: 0 };
      if (overflow >= before.max) {
        next.death = "morto";
        details.push(`Morte istantanea: ${overflow} danni rimanenti ≥ PF massimi ${before.max} (p. 28)`);
      } else {
        next.death = "tiri";
        next.conditions = withZeroHpUnconscious(next.conditions);
        details.push("A 0 PF: privo di sensi, tiri salvezza contro morte a inizio turno (pp. 28-29)");
      }
    }
  }
  if (next.concentration && amount > 0) {
    if (next.death === "morto") endConcentration(next, "morte", details);
    else if (next.current === 0) endConcentration(next, "privo di sensi, quindi incapacitato", details);
    else warnings.push(`Concentrazione su ${next.concentration.effetto}: tiro salvezza su Costituzione CD ${concentrationDc(amount)} (p. 364)`);
  }
  return { next, details, warnings };
}

// Guarigione, p. 28; ripresa da 0 PF, p. 29.
export function healCharacter(before: HpState, amount: number): HpOutcome {
  if (before.death === "morto") throw new Error("Il personaggio risulta morto: la guarigione non si applica.");
  if (before.current >= before.max) throw new Error("PF già al massimo (p. 28).");
  const next: HpState = { ...before, saves: { ...before.saves }, conditions: [...before.conditions] };
  next.current = Math.min(before.max, before.current + amount);
  const details = [`PF: ${before.current} → ${next.current}${before.current + amount > before.max ? " (massimo raggiunto)" : ""}`];
  if (before.current === 0 && next.current > 0) {
    next.death = undefined;
    next.saves = { successi: 0, fallimenti: 0 };
    next.conditions = withoutZeroHpUnconscious(next.conditions);
    details.push("Riprende conoscenza; tiri contro morte azzerati (p. 29)");
  }
  return { next, details, warnings: [] };
}

// Tiri salvezza contro morte, p. 29.
export type DeathSaveOutcome = "successo" | "fallimento" | "uno" | "venti";
export function deathSave(before: HpState, outcome: DeathSaveOutcome): HpOutcome {
  if (before.current !== 0 || before.death === "morto" || before.death === "stabile") throw new Error("Il personaggio non deve effettuare tiri salvezza contro morte.");
  const next: HpState = { ...before, saves: { ...before.saves }, conditions: [...before.conditions] };
  const details: string[] = [];
  if (outcome === "venti") {
    next.current = 1;
    next.death = undefined;
    next.saves = { successi: 0, fallimenti: 0 };
    next.conditions = withoutZeroHpUnconscious(next.conditions);
    details.push("20 naturale: recupera 1 punto ferita e riprende conoscenza");
    return { next, details, warnings: [] };
  }
  if (outcome === "successo") next.saves.successi += 1;
  else next.saves.fallimenti = Math.min(3, next.saves.fallimenti + (outcome === "uno" ? 2 : 1));
  details.push(outcome === "uno" ? "1 naturale: due tiri falliti" : outcome === "successo" ? "Tiro superato (10 o più)" : "Tiro fallito (meno di 10)");
  details.push(`Successi ${next.saves.successi}/3 · fallimenti ${next.saves.fallimenti}/3`);
  if (next.saves.fallimenti >= 3) {
    next.death = "morto";
    details.push("Terzo fallimento: il personaggio muore");
  } else if (next.saves.successi >= 3) {
    next.death = "stabile";
    next.saves = { successi: 0, fallimenti: 0 };
    details.push("Terzo successo: il personaggio è stabile, resta privo di sensi");
  } else next.death = "tiri";
  return { next, details, warnings: [] };
}

export function stabilize(before: HpState): HpOutcome {
  if (before.current !== 0 || before.death === "morto") throw new Error("Si può stabilizzare solo una creatura viva a 0 PF.");
  return {
    next: { ...before, death: "stabile", saves: { successi: 0, fallimenti: 0 }, conditions: withZeroHpUnconscious([...before.conditions]) },
    details: ["Stabile: niente più tiri contro morte, resta privo di sensi; recupera 1 PF dopo 1d4 ore se non curato (p. 29)"],
    warnings: [],
  };
}

// PF temporanei, p. 29: non si sommano, si sceglie quale valore tenere.
export function setTemporaryHp(before: HpState, amount: number, keepExisting: boolean): HpOutcome {
  const next = { ...before, temp: keepExisting ? before.temp : amount };
  const details = keepExisting
    ? [`Tenuti ${before.temp} PF temporanei; i nuovi ${amount} non si sommano (p. 29)`]
    : [`PF temporanei: ${before.temp} → ${amount}`];
  if (before.current === 0 && amount > 0) details.push("A 0 PF i PF temporanei non fanno riprendere conoscenza (p. 29)");
  return { next, details, warnings: [] };
}

// Mostri, p. 28: un mostro muore a 0 PF, salvo diversa decisione del DM.
export function damageCreature(before: HpState, amount: number): HpOutcome {
  const next: HpState = { ...before, conditions: [...before.conditions] };
  const details: string[] = [];
  const warnings: string[] = [];
  const tempLost = Math.min(next.temp, amount);
  next.temp -= tempLost;
  if (tempLost) details.push(`PF temporanei: ${before.temp} → ${next.temp}`);
  next.current = Math.max(0, before.current - (amount - tempLost));
  details.push(`PF: ${before.current} → ${next.current}`);
  if (next.current === 0 && before.current > 0) details.push("A 0 PF: un mostro muore, salvo diversa decisione del DM (p. 28)");
  if (next.concentration && amount > 0) {
    if (next.current === 0) endConcentration(next, "0 PF", details);
    else warnings.push(`Concentrazione su ${next.concentration.effetto}: tiro salvezza su Costituzione CD ${concentrationDc(amount)} (p. 364)`);
  }
  return { next, details, warnings };
}

export function healCreature(before: HpState, amount: number): HpOutcome {
  if (before.current >= before.max) throw new Error("PF già al massimo (p. 28).");
  const next = { ...before, current: Math.min(before.max, before.current + amount) };
  return { next, details: [`PF: ${before.current} → ${next.current}`], warnings: [] };
}

export function addCondition(conditions: CondizioneAttiva[], concentration: ConcentrazioneAttiva | undefined, condition: CondizioneAttiva) {
  const details = [condition.fonte, condition.durata, condition.nota].filter(Boolean);
  const already = conditions.some((item) => item.nome === condition.nome);
  if (already) details.push("Già presente: gli effetti non si sommano, ogni istanza ha la sua durata (p. 29)");
  let nextConcentration = concentration;
  if (concentration && incapacitatingConditions.includes(condition.nome)) {
    details.push(`Concentrazione su ${concentration.effetto} terminata (incapacitato, p. 364)`);
    nextConcentration = undefined;
  }
  return { conditions: [...conditions, condition], concentration: nextConcentration, details };
}

// --- Dadi -------------------------------------------------------------

function randomInt(max: number): number {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buffer = new Uint32Array(1);
    const limit = Math.floor(0xffffffff / max) * max;
    do crypto.getRandomValues(buffer); while (buffer[0] >= limit);
    return (buffer[0] % max) + 1;
  }
  return Math.floor(Math.random() * max) + 1;
}

export const rollDie = (sides: number) => randomInt(sides);

export type FormulaRoll = { total: number; rolls: { sides: number; value: number }[]; modifier: number; text: string };

// Interpreta formule come "2d6 + 3" o "1d8+1d6-1". Con critical i dadi si tirano
// due volte (Colpi critici, p. 27).
export function rollFormula(formula: string, critical = false): FormulaRoll | null {
  const clean = formula.replace(/\s+/g, "").replace(/−/g, "-").toLowerCase();
  if (!clean || !/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(clean)) return null;
  const rolls: { sides: number; value: number }[] = [];
  let modifier = 0;
  for (const term of clean.match(/[+-]?(\d*d\d+|\d+)/g) ?? []) {
    const sign = term.startsWith("-") ? -1 : 1;
    const body = term.replace(/^[+-]/, "");
    const dice = /^(\d*)d(\d+)$/.exec(body);
    if (dice) {
      const count = Math.min(100, Number(dice[1] || 1) * (critical ? 2 : 1));
      const sides = Number(dice[2]);
      if (sides < 2 || sides > 100) return null;
      for (let index = 0; index < count; index += 1) rolls.push({ sides, value: sign * randomInt(sides) });
    } else modifier += sign * Number(body);
  }
  const total = Math.max(0, rolls.reduce((sum, roll) => sum + roll.value, 0) + modifier);
  const text = `${rolls.map((roll) => Math.abs(roll.value)).join(" + ") || "0"}${modifier ? ` ${modifier > 0 ? "+" : "−"} ${Math.abs(modifier)}` : ""}`;
  return { total, rolls, modifier, text };
}
