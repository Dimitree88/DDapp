import type { Sheet } from "./sheet";

// Tabelle Tratti delle classi, Manuale del Giocatore 2024, pp. 51, 59, 69,
// 79, 91, 101, 111, 123, 131, 141, 151 e 165.
export const classSkillChoices: Record<string, { count: number; names: readonly string[]; page: number }> = {
  Barbaro: { count: 2, page: 51, names: ["ADDESTRARE ANIMALI", "ATLETICA", "INTIMIDIRE", "NATURA", "PERCEZIONE", "SOPRAVVIVENZA"] },
  Bardo: { count: 3, page: 59, names: ["ACROBAZIA", "ADDESTRARE ANIMALI", "ARCANO", "ATLETICA", "FURTIVITÀ", "INDAGARE", "INGANNO", "INTIMIDIRE", "INTRATTENERE", "INTUIZIONE", "MEDICINA", "NATURA", "PERCEZIONE", "PERSUASIONE", "RAPIDITÀ DI MANO", "RELIGIONE", "SOPRAVVIVENZA", "STORIA"] },
  Chierico: { count: 2, page: 69, names: ["INTUIZIONE", "MEDICINA", "PERSUASIONE", "RELIGIONE", "STORIA"] },
  Druido: { count: 2, page: 79, names: ["ADDESTRARE ANIMALI", "ARCANO", "INTUIZIONE", "MEDICINA", "NATURA", "PERCEZIONE", "RELIGIONE", "SOPRAVVIVENZA"] },
  Guerriero: { count: 2, page: 91, names: ["ACROBAZIA", "ADDESTRARE ANIMALI", "ATLETICA", "INTIMIDIRE", "INTUIZIONE", "PERCEZIONE", "PERSUASIONE", "SOPRAVVIVENZA", "STORIA"] },
  Ladro: { count: 4, page: 101, names: ["ACROBAZIA", "ATLETICA", "FURTIVITÀ", "INDAGARE", "INGANNO", "INTIMIDIRE", "INTUIZIONE", "PERCEZIONE", "PERSUASIONE", "RAPIDITÀ DI MANO"] },
  Mago: { count: 2, page: 111, names: ["ARCANO", "INDAGARE", "INTUIZIONE", "MEDICINA", "NATURA", "RELIGIONE", "STORIA"] },
  Monaco: { count: 2, page: 123, names: ["ACROBAZIA", "ATLETICA", "FURTIVITÀ", "INTUIZIONE", "RELIGIONE", "STORIA"] },
  Paladino: { count: 2, page: 131, names: ["ATLETICA", "INTIMIDIRE", "INTUIZIONE", "MEDICINA", "PERSUASIONE", "RELIGIONE"] },
  Ranger: { count: 3, page: 141, names: ["ADDESTRARE ANIMALI", "ATLETICA", "FURTIVITÀ", "INDAGARE", "INTUIZIONE", "NATURA", "PERCEZIONE", "SOPRAVVIVENZA"] },
  Stregone: { count: 2, page: 151, names: ["ARCANO", "INGANNO", "INTIMIDIRE", "INTUIZIONE", "PERSUASIONE", "RELIGIONE"] },
  Warlock: { count: 2, page: 165, names: ["ARCANO", "INDAGARE", "INGANNO", "INTIMIDIRE", "NATURA", "RELIGIONE", "STORIA"] },
};

export function remainingClassSkillChoices(sheet: Sheet): number {
  const details = classSkillChoices[sheet.classe];
  if (!details) return 0;
  return Math.max(0, details.count - (sheet.fontiCompetenze ?? []).filter((record) =>
    record.tipo === "abilita" && record.fonte === `Classe: ${sheet.classe}` && details.names.includes(record.valore)).length);
}

export function availableClassSkillChoices(sheet: Sheet): string[] {
  const details = classSkillChoices[sheet.classe];
  if (!details || remainingClassSkillChoices(sheet) === 0) return [];
  return details.names.filter((name) => !(sheet.fontiCompetenze ?? []).some((record) => record.tipo === "abilita" && record.valore === name && record.fonte === `Classe: ${sheet.classe}`)
    && !(sheet.fontiCompetenze ?? []).some((record) => record.tipo === "abilita" && record.valore === name && record.fonte.startsWith("Background:")));
}

export function addClassSkillChoice(sheet: Sheet, name: string): Partial<Sheet> {
  if (!availableClassSkillChoices(sheet).includes(name)) return {};
  return {
    abilita: sheet.abilita.map((skill) => skill.nome === name ? { ...skill, competente: true } : skill),
    fontiCompetenze: [...(sheet.fontiCompetenze ?? []), { tipo: "abilita", valore: name, fonte: `Classe: ${sheet.classe}` }],
  };
}
