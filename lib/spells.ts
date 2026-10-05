import catalog from "./incantesimi-srd-2024.json";
import details from "./incantesimi-dettagli-srd-2024.json";
import manualSpells from "./manuale-2024-spells.json";

export const spellNames = [...new Set([...catalog.incantesimi, ...manualSpells.map((spell) => spell.name)])];

const namesByKey = new Map(spellNames.map((name) => [name.toLocaleLowerCase("it"), name]));
const legacyNames = new Map([
  ["parlare con animale", "Parlare con gli animali"],
  ["individuazione malattie e veleni", "Individuazione delle malattie e dei veleni"],
]);

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
