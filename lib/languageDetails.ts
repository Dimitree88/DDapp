import regole from "./regole-srd-2024.json";

const standard = new Set<string>(regole.lingue.standard);
const rare = new Set<string>(regole.lingue.rare);

const details: Record<string, { description?: string; page?: number }> = {
  Comune: { description: "Tutti i personaggi giocanti conoscono il Comune.", page: 22 },
  "Lingua dei segni comune": { description: "Una lingua dei segni compresa tra le lingue standard.", page: 22 },
  Draconico: { description: "Lingua standard legata ai draghi.", page: 22 },
  Nanico: { description: "Lingua standard legata ai nani.", page: 22 },
  Elfico: { description: "Lingua standard legata agli elfi.", page: 22 },
  Gigante: { description: "Lingua standard legata ai giganti.", page: 22 },
  Gnomesco: { description: "Lingua standard legata agli gnomi.", page: 22 },
  Goblin: { description: "Lingua standard legata ai goblin.", page: 22 },
  Halfling: { description: "Lingua standard legata agli halfling.", page: 22 },
  Orchesco: { description: "Lingua standard legata agli orchi.", page: 22 },
  Druidico: { description: "Lingua segreta dell'ordine dei druidi. Permette di lasciare messaggi nascosti: chi conosce il Druidico li individua automaticamente; altri possono notarli con una prova di Intelligenza (Indagare) CD 15, ma non decifrarli senza magia.", page: 48 },
  "Gergo ladresco": { description: "Lingua rara che il ladro apprende al 1° livello.", page: 56 },
  Primordiale: { description: "Comprende i dialetti Aquan, Auran, Ignan e Terran. Creature che parlano dialetti diversi del Primordiale riescono a comunicare tra loro.", page: 23 },
};

export function languageDetails(name: string): { meaning: string; page: number } | null {
  if (!standard.has(name) && !rare.has(name)) return null;
  const category = standard.has(name) ? "standard" : "rara";
  const description = details[name]?.description;
  return {
    meaning: `${name} è una lingua ${category}. Conoscerla permette di comunicare, leggere e scrivere in questa lingua.${description ? ` ${description}` : ""}`,
    page: details[name]?.page ?? (standard.has(name) ? 22 : 23),
  };
}
