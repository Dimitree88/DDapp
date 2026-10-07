export type CreatureData = {
  origin: "personalizzata";
  description: string;
  creatureType: string;
  size: string;
  armorClass: number;
  armorClassNote: string;
  hitPointsMax: number;
  hitPointsCurrent: number;
  speedMeters: number;
  challengeRating: string;
  experiencePoints: number;
  actions: {
    name: string;
    attackType: string;
    hitBonus: number;
    reachMeters: number | null;
    hitDamage: number;
    damageFormula: string;
    damageType: string;
  }[];
  traits: { name: string; description: string; adjudication: "master" }[];
};
