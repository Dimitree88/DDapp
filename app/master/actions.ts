"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { characters, creatures, masterSessionCreatures, masterSessionEvents, masterSessionParticipants, masterSessions } from "@/lib/db/schema";

function localDateRome(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export async function createMasterSession(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Inserisci il nome della Sessione.");
  const now = new Date();
  const id = randomUUID();
  const selectedIds = [...new Set(formData.getAll("participant").map(String))];
  const selectedCreatureIds = [...new Set(formData.getAll("creature").map(String))];
  await db.transaction(async (tx) => {
    const existing = await tx.select({ id: masterSessions.id }).from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1);
    if (existing.length) throw new Error("Esiste già una Sessione aperta.");
    const allCharacters = selectedIds.length
      ? await tx.select({ id: characters.id }).from(characters)
      : [];
    const validIds = new Set(allCharacters.map(({ id: characterId }) => characterId));
    if (selectedIds.some((characterId) => !validIds.has(characterId))) throw new Error("La selezione contiene un personaggio non valido.");
    const allCreatures = selectedCreatureIds.length ? await tx.select({ id: creatures.id }).from(creatures) : [];
    const validCreatureIds = new Set(allCreatures.map(({ id: creatureId }) => creatureId));
    if (selectedCreatureIds.some((creatureId) => !validCreatureIds.has(creatureId))) throw new Error("La selezione contiene una creatura non valida.");
    await tx.insert(masterSessions).values({ id, name, localDate: localDateRome(now), status: "aperta", createdAt: now });
    if (selectedIds.length) await tx.insert(masterSessionParticipants).values(selectedIds.map((characterId) => ({ sessionId: id, characterId })));
    if (selectedCreatureIds.length) await tx.insert(masterSessionCreatures).values(selectedCreatureIds.map((creatureId) => ({ sessionId: id, creatureId })));
    await tx.insert(masterSessionEvents).values({
      id: randomUUID(), sessionId: id, type: "sessione_creata", occurredAt: now,
      payload: { name, characters: selectedIds, creatures: selectedCreatureIds },
    });
  });
  revalidatePath("/master");
  redirect("/master");
}

export async function saveMasterParticipants(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const selectedIds = [...new Set(formData.getAll("participant").map(String))];
  const selectedCreatureIds = [...new Set(formData.getAll("creature").map(String))];
  await db.transaction(async (tx) => {
    const [session] = await tx.select({ id: masterSessions.id }).from(masterSessions)
      .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "aperta"))).limit(1);
    if (!session) throw new Error("La Sessione non è aperta.");
    const previous = await tx.select({ characterId: masterSessionParticipants.characterId }).from(masterSessionParticipants)
      .where(eq(masterSessionParticipants.sessionId, sessionId));
    const previousCreatures = await tx.select({ creatureId: masterSessionCreatures.creatureId }).from(masterSessionCreatures)
      .where(eq(masterSessionCreatures.sessionId, sessionId));
    const allCharacters = selectedIds.length ? await tx.select({ id: characters.id }).from(characters) : [];
    const validIds = new Set(allCharacters.map(({ id }) => id));
    if (selectedIds.some((id) => !validIds.has(id))) throw new Error("La selezione contiene un personaggio non valido.");
    const allCreatures = selectedCreatureIds.length ? await tx.select({ id: creatures.id }).from(creatures) : [];
    const validCreatureIds = new Set(allCreatures.map(({ id }) => id));
    if (selectedCreatureIds.some((id) => !validCreatureIds.has(id))) throw new Error("La selezione contiene una creatura non valida.");
    await tx.delete(masterSessionParticipants).where(eq(masterSessionParticipants.sessionId, sessionId));
    if (selectedIds.length) await tx.insert(masterSessionParticipants).values(selectedIds.map((characterId) => ({ sessionId, characterId })));
    await tx.delete(masterSessionCreatures).where(eq(masterSessionCreatures.sessionId, sessionId));
    if (selectedCreatureIds.length) await tx.insert(masterSessionCreatures).values(selectedCreatureIds.map((creatureId) => ({ sessionId, creatureId })));
    const now = new Date();
    await tx.insert(masterSessionEvents).values({
      id: randomUUID(), sessionId, type: "partecipanti_aggiornati", occurredAt: now,
      payload: {
        charactersBefore: previous.map(({ characterId }) => characterId), charactersAfter: selectedIds,
        creaturesBefore: previousCreatures.map(({ creatureId }) => creatureId), creaturesAfter: selectedCreatureIds,
      },
    });
  });
  revalidatePath("/master");
  redirect("/master");
}

export async function toggleMasterParticipant(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const participantId = String(formData.get("participantId") ?? "");
  const participantType = String(formData.get("participantType") ?? "");
  const selected = formData.get("selected") === "true";
  if (!participantId || (participantType !== "personaggio" && participantType !== "creatura")) throw new Error("Partecipante non valido.");
  const now = new Date();
  await db.transaction(async (tx) => {
    const [session] = await tx.select({ id: masterSessions.id }).from(masterSessions)
      .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "aperta"))).limit(1);
    if (!session) throw new Error("La Sessione non è aperta.");
    const isCharacter = participantType === "personaggio";
    const [participant] = isCharacter
      ? await tx.select({ id: characters.id, name: characters.name }).from(characters).where(eq(characters.id, participantId)).limit(1)
      : await tx.select({ id: creatures.id, name: creatures.name }).from(creatures).where(eq(creatures.id, participantId)).limit(1);
    if (!participant) throw new Error("Partecipante non trovato.");
    const joinTable = isCharacter ? masterSessionParticipants : masterSessionCreatures;
    const idColumn = isCharacter ? masterSessionParticipants.characterId : masterSessionCreatures.creatureId;
    if (selected) {
      await tx.insert(joinTable).values(isCharacter
        ? { sessionId, characterId: participantId }
        : { sessionId, creatureId: participantId }).onConflictDoNothing();
    } else {
      await tx.delete(joinTable).where(and(eq(joinTable.sessionId, sessionId), eq(idColumn, participantId)));
    }
    await tx.insert(masterSessionEvents).values({
      id: randomUUID(), sessionId, type: "partecipante_modificato", occurredAt: now,
      payload: { participantId, participantName: participant.name, participantType, selected },
    });
  });
  revalidatePath("/master");
}

export async function closeMasterSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const now = new Date();
  await db.transaction(async (tx) => {
    const participants = await tx.select({ characterId: masterSessionParticipants.characterId, name: characters.name })
      .from(masterSessionParticipants).innerJoin(characters, eq(masterSessionParticipants.characterId, characters.id))
      .where(eq(masterSessionParticipants.sessionId, sessionId));
    const selectedCreatures = await tx.select({ creatureId: masterSessionCreatures.creatureId, name: creatures.name })
      .from(masterSessionCreatures).innerJoin(creatures, eq(masterSessionCreatures.creatureId, creatures.id))
      .where(eq(masterSessionCreatures.sessionId, sessionId));
    const changed = await tx.update(masterSessions).set({ status: "chiusa", closedAt: now })
      .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "aperta"))).returning({ id: masterSessions.id });
    if (!changed.length) throw new Error("La Sessione non è aperta.");
    await tx.insert(masterSessionEvents).values({
      id: randomUUID(), sessionId, type: "sessione_chiusa", occurredAt: now,
      payload: { participants, creatures: selectedCreatures },
    });
  });
  revalidatePath("/master");
  redirect("/master");
}
