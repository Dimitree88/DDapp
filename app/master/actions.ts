"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { characters, masterSessionEvents, masterSessionParticipants, masterSessions } from "@/lib/db/schema";

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
  await db.transaction(async (tx) => {
    const existing = await tx.select({ id: masterSessions.id }).from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1);
    if (existing.length) throw new Error("Esiste già una Sessione aperta.");
    const allCharacters = selectedIds.length
      ? await tx.select({ id: characters.id }).from(characters)
      : [];
    const validIds = new Set(allCharacters.map(({ id: characterId }) => characterId));
    if (selectedIds.some((characterId) => !validIds.has(characterId))) throw new Error("La selezione contiene un personaggio non valido.");
    await tx.insert(masterSessions).values({ id, name, localDate: localDateRome(now), status: "aperta", createdAt: now });
    if (selectedIds.length) await tx.insert(masterSessionParticipants).values(selectedIds.map((characterId) => ({ sessionId: id, characterId })));
    await tx.insert(masterSessionEvents).values({
      id: randomUUID(), sessionId: id, type: "sessione_creata", occurredAt: now,
      payload: { name, participants: selectedIds.length },
    });
  });
  revalidatePath("/master");
  redirect("/master");
}

export async function saveMasterParticipants(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const selectedIds = [...new Set(formData.getAll("participant").map(String))];
  await db.transaction(async (tx) => {
    const [session] = await tx.select({ id: masterSessions.id }).from(masterSessions)
      .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "aperta"))).limit(1);
    if (!session) throw new Error("La Sessione non è aperta.");
    const previous = await tx.select({ characterId: masterSessionParticipants.characterId }).from(masterSessionParticipants)
      .where(eq(masterSessionParticipants.sessionId, sessionId));
    const allCharacters = selectedIds.length ? await tx.select({ id: characters.id }).from(characters) : [];
    const validIds = new Set(allCharacters.map(({ id }) => id));
    if (selectedIds.some((id) => !validIds.has(id))) throw new Error("La selezione contiene un personaggio non valido.");
    await tx.delete(masterSessionParticipants).where(eq(masterSessionParticipants.sessionId, sessionId));
    if (selectedIds.length) await tx.insert(masterSessionParticipants).values(selectedIds.map((characterId) => ({ sessionId, characterId })));
    const now = new Date();
    await tx.insert(masterSessionEvents).values({
      id: randomUUID(), sessionId, type: "partecipanti_aggiornati", occurredAt: now,
      payload: { before: previous.map(({ characterId }) => characterId), after: selectedIds },
    });
  });
  revalidatePath("/master");
  redirect("/master");
}

export async function closeMasterSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const now = new Date();
  await db.transaction(async (tx) => {
    const participants = await tx.select({ characterId: masterSessionParticipants.characterId, name: characters.name })
      .from(masterSessionParticipants).innerJoin(characters, eq(masterSessionParticipants.characterId, characters.id))
      .where(eq(masterSessionParticipants.sessionId, sessionId));
    const changed = await tx.update(masterSessions).set({ status: "chiusa", closedAt: now })
      .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "aperta"))).returning({ id: masterSessions.id });
    if (!changed.length) throw new Error("La Sessione non è aperta.");
    await tx.insert(masterSessionEvents).values({
      id: randomUUID(), sessionId, type: "sessione_chiusa", occurredAt: now,
      payload: { participants, summary: "Sessione chiusa. Le modifiche di gioco non sono ancora disponibili in questa fase." },
    });
  });
  revalidatePath("/master");
  redirect("/master");
}
