import regole from "./regole-srd-2024.json";

const languages = new Set([...regole.lingue.standard, ...regole.lingue.rare]);

const details: Record<string, { meaning: string; page: number }> = {
  Draconico: { meaning: "Lingua originata dai draghi.", page: 37 },
  Nanico: { meaning: "Lingua originata dai nani.", page: 37 },
  Elfico: { meaning: "Lingua originata dagli elfi.", page: 37 },
  Gigante: { meaning: "Lingua originata dai giganti.", page: 37 },
  Gnomesco: { meaning: "Lingua originata dagli gnomi.", page: 37 },
  Goblin: { meaning: "Lingua originata dai goblinoidi.", page: 37 },
  Halfling: { meaning: "Lingua originata dagli halfling.", page: 37 },
  Orchesco: { meaning: "Lingua originata dagli orchi.", page: 37 },
  Druidico: { meaning: "Lingua segreta dell'ordine dei druidi. Permette di lasciare messaggi nascosti: chi conosce il Druidico li individua automaticamente; altri possono notarli con una prova di Intelligenza (Indagare) CD 15, ma non decifrarli senza magia.", page: 80 },
  "Gergo ladresco": { meaning: "Lingua usata dalle gilde criminali; il ladro la apprende al 1° livello.", page: 101 },
  Primordiale: { meaning: "Comprende i dialetti Aquan, Auran, Ignan e Terran. Creature che parlano dialetti diversi del Primordiale riescono a comunicare tra loro.", page: 37 },
};

export function languageDetails(name: string): { meaning: string; page: number } | null {
  return languages.has(name) ? details[name] ?? null : null;
}
