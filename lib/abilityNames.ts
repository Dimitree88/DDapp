export const ABILITY_NAMES: Record<string, string> = {
  FOR: "FORZA",
  DES: "DESTREZZA",
  COS: "COSTITUZIONE",
  INT: "INTELLIGENZA",
  SAG: "SAGGEZZA",
  CAR: "CARISMA",
};

export function abilityName(abbreviation: string): string {
  return ABILITY_NAMES[abbreviation] ?? abbreviation;
}
