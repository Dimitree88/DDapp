import type { Sheet } from "./sheet";
import { abilityBonus, abilityModifier, initiativeBonus, passivePerception, proficiencyBonus, savingThrowBonus } from "./abilityBonus";
import { calculatedArmorClass, displayedArmorClass } from "./armorClass";
import { armorById } from "./armorCatalog";
import { classHitDice } from "./classProgression";
import pages2024 from "./manuale-2024-pages.json";
import { speedBreakdown } from "./speed";
import { spellcastingAbility, spellcastingStats } from "./spellcasting";
import { displayedWeaponAttack, meters, weaponAttack, weaponRange } from "./weaponAttack";
import { weaponByName } from "./weaponDetails";

export type SpellAbility = "INT" | "SAG" | "CAR";

export type CalculationTarget =
  | { kind: "armor" }
  | { kind: "proficiency" }
  | { kind: "initiative" }
  | { kind: "passive" }
  | { kind: "modifier"; abbr: string }
  | { kind: "save"; abbr: string }
  | { kind: "ability"; name: string }
  | { kind: "speed" }
  | { kind: "maxHp" }
  | { kind: "spellDc"; ability?: SpellAbility }
  | { kind: "spellAttack"; ability?: SpellAbility }
  | { kind: "weaponAttack"; index: number }
  | { kind: "weaponDamage"; index: number }
  | { kind: "weaponRange"; index: number };

export type CalculationExplanation = {
  title: string;
  result: string;
  rule: string;
  page?: number;
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

const weaponKind = (kind: "mischia" | "distanza") => kind === "distanza" ? "a distanza" : "da mischia";

function weaponExplanation(sheet: Sheet, target: Extract<CalculationTarget, { index: number }>): CalculationExplanation | null {
  const weapon = sheet.armi[target.index];
  if (!weapon) return null;
  const entry = weaponByName(weapon.nome);
  const calculation = weaponAttack(sheet, weapon);
  const name = weapon.nome || "Arma";
  if (target.kind === "weaponRange") {
    const range = weaponRange(weapon);
    if (!entry || !range) return {
      title: `${range?.label ?? "Portata"}: ${name}`, result: range?.value ?? "",
      page: 26,
      rule: "Arma fuori dal catalogo del Manuale: la scheda non conosce portata o gittata. Negli attacchi in mischia una creatura ha di norma una portata di 1,5 metri.",
      details: [{ label: "Arma", value: name }],
      formula: "Indica portata o gittata nel dettaglio personale dell'arma.",
    };
    if (range.label === "Portata") return {
      title: `Portata: ${entry.name}`, result: range.value,
      page: range.reachProperty ? 214 : 26,
      rule: "Una creatura ha una portata di 1,5 metri negli attacchi in mischia (p. 26). La proprietà Portata aggiunge 1,5 metri quando si attacca con l'arma e per gli attacchi di opportunità (p. 214).",
      details: [
        { label: "Arma", value: `${entry.name} (${weaponKind(entry.kind)})` },
        { label: "Proprietà Portata", value: range.reachProperty ? "Sì" : "No" },
        ...(range.thrown ? [{ label: "Gittata se lanciata", value: range.thrown }] : []),
      ],
      formula: range.reachProperty ? "1,5 m + 1,5 m (Portata) = 3 m" : "1,5 m (portata base)",
    };
    return {
      title: `Gittata: ${entry.name}`, result: range.value,
      page: 213,
      rule: "La gittata riporta due numeri: la gittata normale e quella lunga. Oltre la gittata normale il tiro per colpire subisce svantaggio; oltre la gittata lunga non si può attaccare (p. 213).",
      details: [
        { label: "Arma", value: `${entry.name} (${weapon.modo === "lancio" ? "lanciata" : weaponKind(entry.kind)})` },
        { label: "Gittata normale", value: meters(range.normal ?? 0) },
        { label: "Gittata lunga", value: meters(range.long ?? 0) },
      ],
      formula: `Fino a ${meters(range.normal ?? 0)}: tiro normale · fino a ${meters(range.long ?? 0)}: svantaggio`,
    };
  }
  if (!entry || !calculation) {
    const result = target.kind === "weaponAttack" ? weapon.bonus : "";
    return {
      title: `${target.kind === "weaponAttack" ? "Tiro per colpire" : "Danni"}: ${name}`, result,
      page: 41,
      rule: "Arma fuori dal catalogo del Manuale o uso non previsto: la scheda non può calcolare il valore. Si usa il bonus registrato manualmente.",
      details: [{ label: "Bonus registrato", value: weapon.bonus || "—" }],
      formula: weapon.bonus ? `Valore registrato: ${weapon.bonus}` : "Registra il bonus nel dettaglio dell'arma.",
    };
  }
  const abilityName = scoreName(calculation.ability);
  const score = sheet.caratteristiche.find((item) => item.abbr === calculation.ability)?.valore ?? "";
  const abilityReason = entry.finesse ? "Accurata: si sceglie Forza o Destrezza, uguale per colpire e danni (p. 213)"
    : entry.kind === "distanza" ? "arma a distanza"
      : weapon.modo === "lancio" ? "arma da mischia lanciata: stesso modificatore della mischia (p. 213)" : "arma da mischia";
  const abilityRows = [
    { label: "Caratteristica", value: `${abilityName} (${abilityReason})` },
    { label: `Punteggio di ${abilityName}`, value: shown(score) },
    { label: `Modificatore di ${abilityName}`, value: shown(calculation.modifier) },
  ];
  if (target.kind === "weaponDamage") return {
    title: `Danni: ${entry.name}`, result: calculation.damage,
    page: 41,
    rule: "Ai tiri per i danni con un'arma si aggiunge lo stesso modificatore di caratteristica usato per il tiro per colpire (p. 41). Un'arma Versatile usata a due mani infligge il dado indicato tra parentesi (p. 214).",
    details: [
      { label: "Arma", value: `${entry.name} (${weaponKind(entry.kind)})` },
      { label: "Dado dei danni", value: `${calculation.dice}${weapon.modo === "dueMani" ? " (versatile, a due mani)" : ""}` },
      { label: "Tipo di danno", value: calculation.damageType || "—" },
      ...abilityRows,
    ],
    formula: calculation.damage ? `${calculation.dice} + ${calculation.ability} ${calculation.modifier} → ${calculation.damage}` : "Inserisci il punteggio di caratteristica.",
  };
  return {
    title: `Tiro per colpire: ${entry.name}`, result: displayedWeaponAttack(sheet, weapon),
    page: 41,
    rule: "Bonus di attacco in mischia = modificatore di Forza + bonus di competenza; a distanza = modificatore di Destrezza + bonus di competenza (p. 41). Il bonus di competenza si aggiunge solo con le armi in cui si ha competenza (p. 213).",
    details: [
      { label: "Arma", value: `${entry.name} (${weaponKind(entry.kind)})` },
      ...abilityRows,
      { label: "Competenza nell'arma", value: calculation.proficient ? "Sì" : "No" },
      ...(calculation.proficient ? [{ label: "Bonus competenza", value: shown(calculation.proficiency) }] : []),
      ...(calculation.archery ? [{ label: "Talento Tiro", value: `+${calculation.archery}` }] : []),
      ...(weapon.bonus ? [{ label: "Bonus registrato a mano", value: `${weapon.bonus} (prevale sul calcolo)` }] : []),
    ],
    formula: [weapon.bonus ? `Valore registrato ${weapon.bonus}; calcolo della scheda: ${calculation.formula}` : calculation.formula, ...calculation.warnings].join("; "),
  };
}

function spellExplanation(sheet: Sheet, target: Extract<CalculationTarget, { kind: "spellDc" | "spellAttack" }>): CalculationExplanation | null {
  const ability = target.ability ?? spellcastingAbility[sheet.classe];
  if (!ability) return null;
  const stats = spellcastingStats(sheet, ability);
  const name = scoreName(ability);
  const score = sheet.caratteristiche.find((item) => item.abbr === ability)?.valore ?? "";
  const modifier = abilityModifier(score);
  const proficiency = proficiencyBonus(sheet.livello);
  const details = [
    { label: "Caratteristica da incantatore", value: target.ability ? name : `${name} (${sheet.classe})` },
    { label: `Punteggio di ${name}`, value: shown(score) },
    { label: `Modificatore di ${name}`, value: shown(modifier) },
    { label: "Bonus competenza", value: shown(proficiency) },
  ];
  const missing = "Inserisci il punteggio della caratteristica e il livello.";
  if (target.kind === "spellDc") return {
    title: "CD dei tiri salvezza degli incantesimi", result: stats ? String(stats.dc) : "",
    page: 238,
    rule: "CD del tiro salvezza sull'incantesimo = 8 + modificatore di caratteristica da incantatore + bonus di competenza (p. 238).",
    details,
    formula: stats ? stats.formula : missing,
  };
  return {
    title: "Attacco con incantesimo", result: stats?.attack ?? "",
    page: 238,
    rule: "Modificatore di attacco dell'incantesimo = modificatore di caratteristica da incantatore + bonus di competenza (p. 238). Si usa quando l'incantesimo richiede un tiro per colpire.",
    details,
    formula: stats ? `${ability} ${stats.modifier} + competenza ${stats.proficiency} = ${stats.attack}` : missing,
  };
}

function speedExplanation(sheet: Sheet): CalculationExplanation {
  const breakdown = speedBreakdown(sheet);
  const worn = sheet.equipaggiamento.find((item) => item.indossato);
  const requirement = armorById(worn?.catalogId ?? "")?.strength;
  const recorded = sheet.velocita ? `${sheet.velocita.replace(".", ",")} m` : "";
  const changes = sheet.modificatoriVelocita ?? [];
  return {
    title: "Velocità", result: recorded,
    page: (pages2024.species as Record<string, number>)[sheet.specie] ?? 219,
    rule: "La velocità di base dipende dalla specie (capitolo 4). Un'armatura con un requisito di Forza riduce la velocità di 3 metri se il punteggio di Forza è inferiore a quello indicato (p. 219). Condizioni ed effetti temporanei non sono inclusi.",
    details: [
      { label: "Specie", value: [sheet.specie, sheet.lignaggio].filter(Boolean).join(", ") || "da inserire" },
      { label: "Velocità base", value: breakdown ? meters(breakdown.base) : "non calcolabile" },
      { label: "Armatura indossata", value: worn?.nome ?? "Nessuna" },
      ...(requirement ? [{ label: "Requisito di Forza", value: `${requirement} (Forza ${shown(sheet.caratteristiche.find((item) => item.abbr === "FOR")?.valore ?? "")})` }] : []),
      ...changes.map((change) => ({ label: change.fonte || "Modifica registrata", value: `${change.value >= 0 ? "+" : ""}${String(change.value).replace(".", ",")} m` })),
      { label: "Valore registrato", value: recorded || "—" },
    ],
    formula: breakdown
      ? `${breakdown.formula.replace(/(\d)\.(\d)/g, "$1,$2")}${recorded && Number(sheet.velocita) !== breakdown.value ? `; il valore registrato (${recorded}) include modifiche non calcolate dalla scheda` : ""}`
      : recorded ? `Valore registrato: ${recorded}` : "Inserisci specie e velocità.",
  };
}

function maxHpExplanation(sheet: Sheet): CalculationExplanation {
  const die = classHitDice[sheet.classe];
  const constitution = abilityModifier(sheet.caratteristiche.find((item) => item.abbr === "COS")?.valore ?? "");
  const history = sheet.storiaPuntiFerita;
  const gains = history?.incrementi ?? sheet.incrementiPf ?? [];
  return {
    title: "Punti ferita massimi", result: sheet.puntiFeritaMax,
    page: 42,
    rule: "Al 1° livello i punti ferita massimi sono il valore della classe più il modificatore di Costituzione (p. 40). A ogni livello successivo si aggiunge il tiro del Dado Vita o il valore fisso della classe, più il modificatore di Costituzione, con un minimo di 1 (p. 42). Privilegi e talenti possono aggiungerne altri.",
    details: [
      { label: "Classe", value: sheet.classe || "da inserire" },
      { label: "Dado Vita", value: die ? `d${die}` : "—" },
      { label: "Livello", value: shown(sheet.livello) },
      { label: "Modificatore di Costituzione (attuale)", value: shown(constitution) },
      ...(history ? [{ label: "PF al 1° livello", value: String(history.iniziali) }] : []),
      ...gains.map((gain, index) => ({ label: `Livello ${index + 2}`, value: `${gain.method === "fisso" ? "valore fisso" : "tiro"} ${gain.value}${constitution ? ` ${constitution} COS` : ""}` })),
      { label: "Valore registrato", value: sheet.puntiFeritaMax || "—" },
    ],
    formula: history
      ? `${history.iniziali}${gains.map((gain) => ` + (${gain.value}${constitution ? ` ${constitution}` : ""})`).join("")} + eventuali bonus di privilegi = ${sheet.puntiFeritaMax || "—"}`
      : sheet.puntiFeritaMax ? `Valore registrato: ${sheet.puntiFeritaMax}${die && constitution ? `; al 1° livello: ${die} ${constitution} COS` : ""}` : "Registra i punti ferita massimi.",
  };
}

export function calculationExplanation(sheet: Sheet, target: CalculationTarget): CalculationExplanation | null {
  const proficiency = proficiencyBonus(sheet.livello);
  if (target.kind === "weaponAttack" || target.kind === "weaponDamage" || target.kind === "weaponRange") return weaponExplanation(sheet, target);
  if (target.kind === "spellDc" || target.kind === "spellAttack") return spellExplanation(sheet, target);
  if (target.kind === "speed") return speedExplanation(sheet);
  if (target.kind === "maxHp") return maxHpExplanation(sheet);
  if (target.kind === "armor") {
    const calculation = calculatedArmorClass(sheet);
    const worn = sheet.equipaggiamento.find((item) => item.indossato);
    const shield = sheet.equipaggiamento.find((item) => item.impugnato && armorById(item.catalogId ?? "")?.category === "scudi");
    return {
      title: "Classe Armatura", result: displayedArmorClass(sheet),
      page: 219,
      rule: "La CA ordinaria dipende da Destrezza, armatura indossata e scudo impugnato. Alcuni privilegi o effetti possono usare formule diverse non ancora rappresentate nella scheda.",
      details: [
        { label: "Destrezza", value: shown(sheet.caratteristiche.find((item) => item.abbr === "DES")?.valore ?? "") },
        { label: "Armatura indossata", value: worn?.nome ?? "Nessuna" },
        { label: "Scudo", value: shield?.nome ?? (sheet.scudo ? "Sì" : "No") },
        { label: "Competenza negli scudi", value: sheet.competenzeArmatura.scudi ? "Sì" : "No" },
      ],
      formula: calculation ? [calculation.formula, ...calculation.warnings].join("; ") : "Inserisci Destrezza per ottenere il calcolo automatico.",
    };
  }
  if (target.kind === "proficiency") {
    const level = Number(sheet.livello);
    const first = Math.floor((level - 1) / 4) * 4 + 1;
    return {
      title: "Bonus competenza", result: proficiency,
      page: 11,
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
      page: 23,
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
      page: 10,
      rule: "Il modificatore deriva dal punteggio di caratteristica: si sottrae 10, si divide per 2 e si arrotonda per difetto.",
      details: [{ label: `Punteggio di ${name}`, value: shown(characteristic.valore) }],
      formula: modifier ? `⌊(${characteristic.valore} − 10) ÷ 2⌋ = ${modifier}` : "Inserisci un punteggio da 1 a 30.",
    };
    const result = savingThrowBonus(sheet, characteristic);
    return {
      title: `Tiro salvezza di ${name}`, result,
      page: 12,
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
    page: 369,
    rule: "La Percezione passiva è 10 più il bonus della prova di Saggezza (Percezione). Qui sono inclusi i valori registrati nella scheda; effetti temporanei non registrati possono cambiarla.",
    details: [...details, { label: "Bonus Percezione", value: shown(bonus) }],
    formula: bonus ? `${abilityFormula}; 10 + (${bonus}) = ${passivePerception(sheet)}` : abilityFormula,
  };
  return {
    title: `Abilità: ${ability.nome}`, result: bonus,
    page: 13,
    rule: `${skillMeaning[ability.nome] ?? "Abilità usata nelle prove di caratteristica."} Il bonus usa il modificatore della caratteristica associata. La competenza aggiunge il bonus competenza; la Maestria lo raddoppia.`,
    details,
    formula: abilityFormula,
  };
}
