import type { Sheet } from "./sheet";
import { abilityBonus, abilityModifier, initiativeBonus, passivePerception, proficiencyBonus, savingThrowBonus } from "./abilityBonus";

export type CalculationTarget =
  | { kind: "proficiency" }
  | { kind: "initiative" }
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

const skillMeaning: Record<string, string> = {
  ATLETICA: "Serve per sforzi fisici come saltare, nuotare o sfondare un ostacolo.",
  ACROBAZIA: "Serve per restare in equilibrio e compiere acrobazie.",
  FURTIVITÀ: "Serve per muoversi o nascondersi senza farsi notare.",
  "RAPIDITÀ DI MANO": "Serve per compiere gesti manuali rapidi e discreti.",
  ARCANO: "Serve per ricordare conoscenze su magia, incantesimi e piani.",
  INDAGARE: "Serve per cercare informazioni e dedurre come funziona qualcosa.",
  NATURA: "Serve per ricordare conoscenze su terreno, piante, animali e clima.",
  RELIGIONE: "Serve per ricordare conoscenze su divinità, riti e tradizioni religiose.",
  STORIA: "Serve per ricordare eventi, popoli e culture del passato.",
  "ADDESTRARE ANIMALI": "Serve per calmare, addestrare o guidare animali.",
  INTUIZIONE: "Serve per capire emozioni e intenzioni di una creatura.",
  MEDICINA: "Serve per riconoscere malattie e cause di morte.",
  PERCEZIONE: "Serve per notare creature, oggetti e dettagli difficili da vedere.",
  SOPRAVVIVENZA: "Serve per seguire tracce, orientarsi e trovare cibo.",
  INGANNO: "Serve per mentire o sostenere una falsa identità.",
  INTIMIDIRE: "Serve per ottenere una reazione con minacce o presenza intimidatoria.",
  INTRATTENERE: "Serve per recitare, suonare, ballare o raccontare storie.",
  PERSUASIONE: "Serve per convincere qualcuno con argomenti e tatto.",
};

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
  if (target.kind === "initiative") {
    const dexterity = sheet.caratteristiche.find((item) => item.abbr === "DES");
    const modifier = abilityModifier(dexterity?.valore ?? "");
    const hasAlert = sheet.talenti.some((item) => item.nome === "Allerta");
    const result = initiativeBonus(sheet);
    return {
      title: "Iniziativa", result,
      rule: "L'iniziativa usa il modificatore di Destrezza. Il talento Allerta aggiunge il bonus competenza al tiro. Effetti temporanei non registrati nella scheda possono modificarlo.",
      details: [
        { label: "Punteggio di Destrezza", value: shown(dexterity?.valore ?? "") },
        { label: "Modificatore di Destrezza", value: shown(modifier) },
        { label: "Talento Allerta", value: hasAlert ? "Sì" : "No" },
        ...(hasAlert ? [{ label: "Bonus competenza", value: shown(proficiency) }] : []),
      ],
      formula: result ? hasAlert
        ? `${modifier} + ${Number(proficiency)} = ${result}`
        : `${modifier} = ${result}` : "Inserisci il punteggio di Destrezza e, per Allerta, il livello.",
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
    rule: `${skillMeaning[ability.nome] ?? "Abilità usata nelle prove di caratteristica."} Il bonus usa il modificatore della caratteristica associata. La competenza aggiunge il bonus competenza; la Maestria lo raddoppia.`,
    details,
    formula: abilityFormula,
  };
}
