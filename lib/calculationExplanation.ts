import type { Sheet } from "./sheet";
import { abilityBonus, abilityModifier, passivePerception, proficiencyBonus, savingThrowBonus } from "./abilityBonus";

export type CalculationTarget =
  | { kind: "proficiency" }
  | { kind: "passive" }
  | { kind: "modifier"; abbr: string }
  | { kind: "save"; abbr: string }
  | { kind: "ability"; name: string };

export type CalculationExplanation = {
  title: string;
  result: string;
  rule: string;
  details: { label: string; value: string }[];
  formula: string;
};

const shown = (value: string) => value || "da inserire";
const scoreName = (abbr: string) => ({
  FOR: "Forza", DES: "Destrezza", COS: "Costituzione",
  INT: "Intelligenza", SAG: "Saggezza", CAR: "Carisma",
})[abbr as "FOR" | "DES" | "COS" | "INT" | "SAG" | "CAR"] ?? abbr;

export function calculationExplanation(sheet: Sheet, target: CalculationTarget): CalculationExplanation | null {
  const proficiency = proficiencyBonus(sheet.livello);
  if (target.kind === "proficiency") {
    const level = Number(sheet.livello);
    const first = Math.floor((level - 1) / 4) * 4 + 1;
    return {
      title: "Bonus competenza", result: proficiency,
      rule: "Nelle regole 2024 il bonus competenza dipende dal livello totale del personaggio e cresce ogni quattro livelli.",
      details: [{ label: "Livello", value: shown(sheet.livello) }],
      formula: proficiency ? `Livelli ${first}–${Math.min(first + 3, 20)} → ${proficiency}` : "Inserisci un livello da 1 a 20.",
    };
  }
  if (target.kind === "modifier" || target.kind === "save") {
    const characteristic = sheet.caratteristiche.find((item) => item.abbr === target.abbr);
    if (!characteristic) return null;
    const name = scoreName(characteristic.abbr);
    const modifier = abilityModifier(characteristic.valore);
    if (target.kind === "modifier") return {
      title: `Modificatore di ${name}`, result: modifier,
      rule: "Il modificatore deriva dal punteggio di caratteristica: si sottrae 10, si divide per 2 e si arrotonda per difetto.",
      details: [{ label: `Punteggio di ${name}`, value: shown(characteristic.valore) }],
      formula: modifier ? `⌊(${characteristic.valore} − 10) ÷ 2⌋ = ${modifier}` : "Inserisci un punteggio da 1 a 30.",
    };
    const result = savingThrowBonus(sheet, characteristic);
    return {
      title: `Tiro salvezza di ${name}`, result,
      rule: "Il tiro salvezza usa il modificatore della caratteristica. Se il personaggio è competente, aggiunge il bonus competenza.",
      details: [
        { label: `Punteggio di ${name}`, value: shown(characteristic.valore) },
        { label: "Modificatore", value: shown(modifier) },
        { label: "Competente", value: characteristic.tsCompetente ? "Sì" : "No" },
        ...(characteristic.tsCompetente ? [{ label: "Bonus competenza", value: shown(proficiency) }] : []),
      ],
      formula: result ? characteristic.tsCompetente
        ? `${modifier} + ${Number(proficiency)} = ${result}`
        : `${modifier} = ${result}` : "Inserisci il punteggio e il livello necessari.",
    };
  }
  const abilityName = target.kind === "ability" ? target.name : "PERCEZIONE";
  const ability = sheet.abilita.find((item) => item.nome === abilityName);
  if (!ability) return null;
  const characteristic = sheet.caratteristiche.find((item) => item.abbr === ability.caratteristica);
  const name = scoreName(ability.caratteristica);
  const modifier = abilityModifier(characteristic?.valore ?? "");
  const bonus = abilityBonus(sheet, ability);
  const details = [
    { label: `Punteggio di ${name}`, value: shown(characteristic?.valore ?? "") },
    { label: `Modificatore di ${name}`, value: shown(modifier) },
    { label: "Competente", value: ability.competente ? "Sì" : "No" },
    ...(ability.competente ? [{ label: "Bonus competenza", value: shown(proficiency) }] : []),
    ...(ability.maestria ? [{ label: "Maestria", value: "Sì: bonus competenza raddoppiato" }] : []),
  ];
  const abilityFormula = bonus ? ability.competente
    ? `${modifier} + ${ability.maestria ? `2 × ${Number(proficiency)}` : Number(proficiency)} = ${bonus}`
    : `${modifier} = ${bonus}` : "Inserisci il punteggio e il livello necessari.";
  if (target.kind === "passive") return {
    title: "Percezione passiva", result: passivePerception(sheet),
    rule: "La Percezione passiva è 10 più il bonus della prova di Saggezza (Percezione). Qui sono inclusi i valori registrati nella scheda; effetti temporanei non registrati possono cambiarla.",
    details: [...details, { label: "Bonus Percezione", value: shown(bonus) }],
    formula: bonus ? `${abilityFormula}; 10 + (${bonus}) = ${passivePerception(sheet)}` : abilityFormula,
  };
  return {
    title: `Abilità: ${ability.nome}`, result: bonus,
    rule: "Un'abilità usa il modificatore della caratteristica associata. La competenza aggiunge il bonus competenza; la Maestria lo raddoppia.",
    details,
    formula: abilityFormula,
  };
}
