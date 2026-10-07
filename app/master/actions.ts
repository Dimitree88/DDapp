"use server";

import { randomUUID } from "crypto";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { characters, creatures, masterSessionCreatures, masterSessionEvents, masterSessionParticipants, masterSessions } from "@/lib/db/schema";
import { normalizeSheet } from "@/lib/sheet";

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
  if (!selectedIds.length && !selectedCreatureIds.length) redirect(`/master?errore=${encodeURIComponent("Seleziona almeno un partecipante prima di creare la Sessione.")}`);
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

export async function closeMasterSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId") ?? "");
  const now = new Date();
  await db.transaction(async (tx) => {
    const participants = await tx.select({ characterId: masterSessionParticipants.characterId, name: characters.name, data: characters.data })
      .from(masterSessionParticipants).innerJoin(characters, eq(masterSessionParticipants.characterId, characters.id))
      .where(eq(masterSessionParticipants.sessionId, sessionId));
    const selectedCreatures = await tx.select({ creatureId: masterSessionCreatures.creatureId, name: creatures.name, data: creatures.data })
      .from(masterSessionCreatures).innerJoin(creatures, eq(masterSessionCreatures.creatureId, creatures.id))
      .where(eq(masterSessionCreatures.sessionId, sessionId));
    const previousEvents = await tx.select().from(masterSessionEvents)
      .where(eq(masterSessionEvents.sessionId, sessionId)).orderBy(asc(masterSessionEvents.occurredAt));
    const participantSummary = participants.map((participant) => {
      const sheet = normalizeSheet(participant.data);
      const missing: string[] = [];
      if (!/^\d+$/.test(sheet.puntiFerita)) missing.push("PF attuali");
      if (!/^\d+$/.test(sheet.puntiFeritaMax)) missing.push("PF massimi");
      if (!Number.isFinite(sheet.classeArmatura)) missing.push("Classe Armatura");
      if (!sheet.dadiVita.trim()) missing.push("Dadi Vita");
      const states = [
        ...(sheet.ispirazioneEroica ? ["Ispirazione eroica"] : []),
        ...(sheet.indebolimento ? [`Indebolimento ${sheet.indebolimento}`] : []),
        ...(Number(sheet.puntiFeritaTemporanei) > 0 ? [`PF temporanei ${sheet.puntiFeritaTemporanei}`] : []),
        ...(sheet.condizioni ?? []).map((condition) => `${condition.nome}${condition.fonte ? ` (${condition.fonte})` : ""}${condition.durata ? ` — ${condition.durata}` : ""}`),
        ...(sheet.concentrazione ? [`Concentrazione: ${sheet.concentrazione.effetto}`] : []),
        ...(sheet.statoMorte ? [`Stato a 0 PF: ${sheet.statoMorte}`] : []),
      ];
      const changes = previousEvents.filter((event) => event.characterId === participant.characterId).map((event) => {
        const payload = event.payload as Record<string, unknown>;
        const details = Array.isArray(payload.details) ? payload.details.filter((item): item is string => typeof item === "string") : [];
        const values = Array.isArray(payload.changes) ? payload.changes.filter((item): item is { field: string; before: string; after: string } => Boolean(item && typeof item === "object" && "field" in item && typeof item.field === "string" && "before" in item && typeof item.before === "string" && "after" in item && typeof item.after === "string")) : [];
        return { occurredAt: event.occurredAt.toISOString(), action: typeof payload.title === "string" ? payload.title : event.type, details, changes: values };
      });
      return {
        characterId: participant.characterId, name: participant.name,
        current: { puntiFerita: sheet.puntiFerita, puntiFeritaMax: sheet.puntiFeritaMax, classeArmatura: sheet.classeArmatura },
        statiAttivi: states, datiMancanti: missing, modificheSessione: changes,
      };
    });
    const creatureSummary = selectedCreatures.map((creature) => ({
      creatureId: creature.creatureId, name: creature.name,
      current: { puntiFerita: creature.data.hitPointsCurrent, puntiFeritaMax: creature.data.hitPointsMax, classeArmatura: creature.data.armorClass },
      modificheSessione: previousEvents.filter((event) => event.creatureId === creature.creatureId).map((event) => {
        const payload = event.payload as Record<string, unknown>;
        const before = payload.before && typeof payload.before === "object" ? payload.before as { hitPointsCurrent?: unknown } : {};
        const after = payload.after && typeof payload.after === "object" ? payload.after as { hitPointsCurrent?: unknown } : {};
        const details = Array.isArray(payload.details) ? payload.details.filter((item): item is string => typeof item === "string") : [];
        if (Number.isInteger(before.hitPointsCurrent) && Number.isInteger(after.hitPointsCurrent) && before.hitPointsCurrent !== after.hitPointsCurrent) details.push(`PF: ${before.hitPointsCurrent} → ${after.hitPointsCurrent}`);
        if (typeof payload.note === "string" && payload.note) details.push(payload.note);
        return { occurredAt: event.occurredAt.toISOString(), action: typeof payload.title === "string" ? payload.title : event.type, details };
      }),
    }));
    const changed = await tx.update(masterSessions).set({ status: "chiusa", closedAt: now })
      .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "aperta"))).returning({ id: masterSessions.id });
    if (!changed.length) throw new Error("La Sessione non è aperta.");
    await tx.insert(masterSessionEvents).values({
      id: randomUUID(), sessionId, type: "sessione_chiusa", occurredAt: now,
      payload: { participants: participantSummary, creatures: creatureSummary },
    });
  });
  revalidatePath("/master");
  redirect(`/master?chiusa=${encodeURIComponent(sessionId)}`);
}
