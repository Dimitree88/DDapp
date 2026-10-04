import catalog from "./incantesimi-srd-2024.json";
import details from "./incantesimi-dettagli-srd-2024.json";

export const spellNames = catalog.incantesimi;

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
  return details[canonical] ?? null;
}
