import { eq } from "drizzle-orm";
import { hashPin } from "../lib/auth";
import type { CreatureData } from "../lib/creature";
import { db } from "../lib/db";
import { characters, creatures, masterSessionCreatures, masterSessionEvents, masterSessionParticipants, masterSessions } from "../lib/db/schema";
import { emptySheet } from "../lib/sheet";

const demoCharacters = [
  { id: "demo-guardiana", name: "Demo Guardiana Test", classe: "Guerriero", hp: "7", maxHp: "18", armorClass: 16, hitDice: "2d10", inspiration: false },
  { id: "demo-arcanista", name: "Demo Arcanista Test", classe: "Mago", hp: "14", maxHp: "14", armorClass: 12, hitDice: "2d6", inspiration: true },
  { id: "demo-guerriero-2", name: "Demo Guerriero 2 Test", classe: "Guerriero", hp: "18", maxHp: "18", armorClass: 16, hitDice: "2d10", inspiration: false },
  { id: "demo-mago-2", name: "Demo Mago 2 Test", classe: "Mago", hp: "14", maxHp: "14", armorClass: 12, hitDice: "2d6", inspiration: false },
] as const;
const demoCreatureId = "demo-creatura";
const demoSessionId = "demo-sessione-master";

function makeSheet(entry: typeof demoCharacters[number]) {
  const sheet = emptySheet();
  sheet.classe = entry.classe;
  sheet.livello = "2";
  sheet.specie = "Umano";
  sheet.puntiFerita = entry.hp;
  sheet.puntiFeritaMax = entry.maxHp;
  sheet.classeArmatura = entry.armorClass;
  sheet.dadiVita = entry.hitDice;
  sheet.dadiVitaSpesi = "1";
  sheet.puntiFeritaTemporanei = entry.id === "demo-guardiana" ? "2" : "0";
  sheet.ispirazioneEroica = entry.inspiration;
  sheet.indebolimento = entry.id === "demo-guardiana" ? 1 : 0;
  sheet.condizioni = entry.id === "demo-guardiana"
    ? [{ nome: "Spaventato", fonte: "Scenario dimostrativo", durata: "1 round", nota: "Dato fittizio per provare la vista." }]
    : [];
  sheet.risorse = entry.id === "demo-guardiana"
    ? [{ nome: "Risorsa di prova", fonte: "Seed locale", massimo: 2, spesi: 1, ricarica: "riposo breve" }]
    : [];
  sheet.caratteristiche = sheet.caratteristiche.map((item) => ({ ...item, valore: "12" }));
  return sheet;
}

const demoCreature: CreatureData = {
  origin: "personalizzata",
  description: "Creatura fittizia per provare la pagina Master.",
  creatureType: "Creatura di prova",
  size: "Media",
  armorClass: 13,
  armorClassNote: "Dato dimostrativo",
  hitPointsMax: 10,
  hitPointsCurrent: 6,
  speedMeters: 9,
  challengeRating: "",
  experiencePoints: 0,
  actions: [],
  traits: [],
};

function localDateRome(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function main() {
  const now = new Date();
  await db.transaction(async (tx) => {
    for (const entry of demoCharacters) {
      const [existing] = await tx.select({ id: characters.id, name: characters.name }).from(characters).where(eq(characters.id, entry.id)).limit(1);
      if (!existing) await tx.insert(characters).values({ id: entry.id, name: entry.name, pinHash: hashPin("0000"), data: makeSheet(entry) });
      else if (existing.name !== entry.name) await tx.update(characters).set({ name: entry.name, updatedAt: now }).where(eq(characters.id, entry.id));
    }
    const [existingCreature] = await tx.select({ id: creatures.id, name: creatures.name }).from(creatures).where(eq(creatures.id, demoCreatureId)).limit(1);
    if (!existingCreature) await tx.insert(creatures).values({ id: demoCreatureId, name: "Demo Creatura Test", data: demoCreature });
    else if (existingCreature.name !== "Demo Creatura Test") await tx.update(creatures).set({ name: "Demo Creatura Test", updatedAt: now }).where(eq(creatures.id, demoCreatureId));

    const [existingSession] = await tx.select({ id: masterSessions.id }).from(masterSessions).where(eq(masterSessions.id, demoSessionId)).limit(1);
    const [openSession] = await tx.select({ id: masterSessions.id }).from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1);
    if (!existingSession && !openSession) {
      await tx.insert(masterSessions).values({ id: demoSessionId, name: "Sessione dimostrativa", localDate: localDateRome(now), status: "aperta", createdAt: now });
      await tx.insert(masterSessionParticipants).values(demoCharacters.map(({ id }) => ({ sessionId: demoSessionId, characterId: id })));
      await tx.insert(masterSessionCreatures).values({ sessionId: demoSessionId, creatureId: demoCreatureId });
      await tx.insert(masterSessionEvents).values({
        id: "demo-sessione-master-creata", sessionId: demoSessionId, type: "sessione_creata", occurredAt: now,
        payload: { name: "Sessione dimostrativa", characters: demoCharacters.map(({ id }) => id), creatures: [demoCreatureId], demo: true },
      });
    }
  });
  console.log("Dati demo locali presenti: quattro personaggi, una creatura e, se non esiste già una Sessione aperta, una Sessione Master dimostrativa.");
  console.log("PIN dei personaggi demo: 0000. Dati fittizi; la sessione demo non sovrascrive i dati esistenti.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
