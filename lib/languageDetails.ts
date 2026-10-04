import regole from "./regole-srd-2024.json";

const languages = new Set([...regole.lingue.standard, ...regole.lingue.rare]);

const details: Record<string, { meaning: string; page: number }> = {
  Draconico: { meaning: "Parlata dai draghi.", page: 22 },
  Nanico: { meaning: "Parlata dai nani.", page: 22 },
  Elfico: { meaning: "Parlata dagli elfi.", page: 22 },
  Gigante: { meaning: "Parlata dai giganti.", page: 22 },
  Gnomesco: { meaning: "Parlata dagli gnomi.", page: 22 },
  Goblin: { meaning: "Parlata dai goblin.", page: 22 },
  Halfling: { meaning: "Parlata dagli halfling.", page: 22 },
  Orchesco: { meaning: "Parlata dagli orchi.", page: 22 },
  Druidico: { meaning: "Lingua segreta dell'ordine dei druidi. Permette di lasciare messaggi nascosti: chi conosce il Druidico li individua automaticamente; altri possono notarli con una prova di Intelligenza (Indagare) CD 15, ma non decifrarli senza magia.", page: 48 },
  "Gergo ladresco": { meaning: "Usato dai ladri.", page: 56 },
  Primordiale: { meaning: "Comprende i dialetti Aquan, Auran, Ignan e Terran. Creature che parlano dialetti diversi del Primordiale riescono a comunicare tra loro.", page: 23 },
};

export function languageDetails(name: string): { meaning: string; page: number } | null {
  return languages.has(name) ? details[name] ?? null : null;
}
