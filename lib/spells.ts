import catalog from "./incantesimi-srd-2024.json";
import details from "./incantesimi-dettagli-srd-2024.json";
import manualSpells from "./manuale-2024-spells.json";

const legacyNames = new Map([
  ["aura magica dell'arcanista", "Aura magica di Nystul"],
  ["capanna", "Capanna di Leomund"],
  ["danza irresistibile", "Danza irresistibile di Otto"],
  ["disco fluttuante", "Disco fluttuante di Tenser"],
  ["evocazioni istantanee", "Evocazioni istantanee di Drawmij"],
  ["freccia acida", "Freccia acida di Melf"],
  ["legame telepatico", "Legame telepatico di Rary"],
  ["mano arcana", "Mano magica"],
  ["reggia meravigliosa", "Reggia meravigliosa di Mordenkainen"],
  ["risata incontenibile", "Risata incontenibile di Tasha"],
  ["salto", "Saltare"],
  ["santuario privato", "Santuario privato di Mordenkainen"],
  ["scrigno segreto", "Scrigno segreto di Leomund"],
  ["segugio fedele", "Segugio fedele di Mordenkainen"],
  ["sfera congelante", "Sfera congelante di Otiluke"],
  ["sfera elastica", "Sfera elastica di Otiluke"],
  ["spada arcana", "Spada di Mordenkainen"],
  ["tentacoli neri", "Tentacoli neri di Evard"],
  ["parlare con animale", "Parlare con gli animali"],
  ["individuazione malattie e veleni", "Individuazione delle malattie e dei veleni"],
]);

export const spellNames = [...new Set([...catalog.incantesimi.map((name) => legacyNames.get(name.toLocaleLowerCase("it")) ?? name), ...manualSpells.map((spell) => spell.name)])];

const namesByKey = new Map(spellNames.map((name) => [name.toLocaleLowerCase("it"), name]));

export function canonicalSpellName(name: string): string {
  const key = name.trim().toLocaleLowerCase("it");
  return legacyNames.get(key) ?? namesByKey.get(key) ?? name;
}

export function spellDetails(name: string) {
  const canonical = canonicalSpellName(name) as keyof typeof details;
  const existing = details[canonical];
  if (existing) return existing;
  const manual = manualSpells.find((spell) => spell.name === canonical);
  return manual ? {
    livello: manual.level,
    scuola: manual.school,
    classi: manual.classes,
    tempo: "",
    gittata: "",
    componenti: "",
    durata: "",
    pagina: manual.page,
  } : null;
}
