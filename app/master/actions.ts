"use server";

import { randomUUID } from "crypto";
import { and, asc, eq, inArray } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { characterHistory, characters, creatures, masterSessionCreatures, masterSessionEvents, masterSessionParticipants, masterSessions, type Encounter } from "@/lib/db/schema";
import { cleanText, errorResult, fail, requireOpenSession, type ActionResult } from "@/lib/masterCommand";
import { normalizeCreature } from "@/lib/creature";
import { diffSheet } from "@/lib/history";
import { normalizeSheet } from "@/lib/sheet";
import { freshStartSheet } from "@/lib/masterFreshStart";

function localDateRome(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function finish(result: ActionResult) {
  if (result.ok) {
    revalidatePath("/master");
    refresh();
  }
  return result;
}

export async function freshStartCharacters(): Promise<ActionResult> {
  try {
    const now = new Date();
    const prepared = await db.transaction(async (tx) => {
      const rows = await tx.select().from(characters).orderBy(asc(characters.name));
      const updates = rows.map((row) => {
        try { return { row, before: row.data, after: freshStartSheet(row.data) }; }
        catch (error) { throw new Error(`${row.name}: ${error instanceof Error ? error.message : "PF massimi non validi."}`); }
      });
      for (const { row, before, after } of updates) {
        const changes = diffSheet(before, after);
        await tx.update(characters).set({ data: after, updatedAt: now }).where(eq(characters.id, row.id));
        if (changes.length) await tx.insert(characterHistory).values({ id: randomUUID(), characterId: row.id, occurredAt: now, changes });
      }
      return updates.map(({ row }) => ({ id: row.id, name: row.name }));
    });
    for (const character of prepared) revalidatePath(`/personaggio/${character.id}`);
    return finish({ ok: true, title: "Fresh start completato", details: prepared.map(({ name }) => name) });
  } catch (error) {
    return errorResult(error);
  }
}

const uniqueIds = (value: unknown) => [...new Set(Array.isArray(value) ? value.map(String).filter(Boolean) : [])];

async function validIds(table: typeof characters | typeof creatures, ids: string[]) {
  if (!ids.length) return;
  const rows = await db.select({ id: table.id }).from(table).where(inArray(table.id, ids));
  if (rows.length !== ids.length) fail("La selezione contiene un partecipante non valido.");
}

export async function createSession(input: { name: string; characterIds: string[]; creatureIds: string[] }): Promise<ActionResult> {
  try {
    const name = cleanText(input.name, 120);
    if (!name) fail("Inserisci il nome della Sessione.");
    const characterIds = uniqueIds(input.characterIds);
    const creatureIds = uniqueIds(input.creatureIds);
    if (!characterIds.length && !creatureIds.length) fail("Seleziona almeno un partecipante.");
    await validIds(characters, characterIds);
    await validIds(creatures, creatureIds);
    const now = new Date();
    const id = randomUUID();
    await db.transaction(async (tx) => {
      const [existing] = await tx.select({ id: masterSessions.id }).from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1);
      if (existing) fail("Esiste già una Sessione aperta: chiudila prima.");
      await tx.insert(masterSessions).values({ id, name, localDate: localDateRome(now), status: "aperta", createdAt: now, notes: "" });
      if (characterIds.length) await tx.insert(masterSessionParticipants).values(characterIds.map((characterId) => ({ sessionId: id, characterId })));
      if (creatureIds.length) await tx.insert(masterSessionCreatures).values(creatureIds.map((creatureId) => ({ sessionId: id, creatureId })));
      await tx.insert(masterSessionEvents).values({ id: randomUUID(), sessionId: id, type: "sessione_creata", occurredAt: now, payload: { title: "Sessione creata", name, characters: characterIds, creatures: creatureIds } });
    });
    return finish({ ok: true, id });
  } catch (error) {
    return errorResult(error);
  }
}

export async function renameSession(input: { sessionId: string; name: string }): Promise<ActionResult> {
  try {
    const name = cleanText(input.name, 120);
    if (!name) fail("Il nome non può essere vuoto.");
    const changed = await db.update(masterSessions).set({ name }).where(eq(masterSessions.id, String(input.sessionId))).returning({ id: masterSessions.id });
    if (!changed.length) fail("Sessione non trovata.");
    return finish({ ok: true });
  } catch (error) {
    return errorResult(error);
  }
}

export async function saveSessionNotes(input: { sessionId: string; notes: string }): Promise<ActionResult> {
  try {
    const notes = typeof input.notes === "string" ? input.notes.slice(0, 20000) : "";
    const changed = await db.update(masterSessions).set({ notes }).where(eq(masterSessions.id, String(input.sessionId))).returning({ id: masterSessions.id });
    if (!changed.length) fail("Sessione non trovata.");
    revalidatePath("/master");
    return { ok: true };
  } catch (error) {
    return errorResult(error);
  }
}

// Riepilogo salvato alla chiusura: stato finale e modifiche di ogni partecipante.
async function closingSummary(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], sessionId: string) {
  const participants = await tx.select({ characterId: masterSessionParticipants.characterId, name: characters.name, data: characters.data })
    .from(masterSessionParticipants).innerJoin(characters, eq(masterSessionParticipants.characterId, characters.id))
    .where(eq(masterSessionParticipants.sessionId, sessionId));
  const beasts = await tx.select({ creatureId: masterSessionCreatures.creatureId, name: creatures.name, data: creatures.data })
    .from(masterSessionCreatures).innerJoin(creatures, eq(masterSessionCreatures.creatureId, creatures.id))
    .where(eq(masterSessionCreatures.sessionId, sessionId));
  const events = await tx.select().from(masterSessionEvents).where(eq(masterSessionEvents.sessionId, sessionId)).orderBy(asc(masterSessionEvents.occurredAt));
  const touching = (id: string) => events.filter((event) => {
    if (event.characterId === id || event.creatureId === id) return true;
    const targets = (event.payload as { targets?: { id?: string }[] }).targets;
    return Array.isArray(targets) && targets.some((target) => target?.id === id);
  }).map((event) => {
    const payload = event.payload as { title?: string; details?: unknown[] };
    return { occurredAt: event.occurredAt.toISOString(), action: payload.title ?? event.type, details: Array.isArray(payload.details) ? payload.details.filter((item): item is string => typeof item === "string") : [] };
  });
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
    return {
      characterId: participant.characterId, name: participant.name,
      current: { puntiFerita: sheet.puntiFerita, puntiFeritaMax: sheet.puntiFeritaMax, classeArmatura: sheet.classeArmatura, puntiEsperienza: sheet.puntiEsperienza },
      statiAttivi: states, datiMancanti: missing, modificheSessione: touching(participant.characterId),
    };
  });
  const creatureSummary = beasts.map((beast) => {
    const data = normalizeCreature(beast.data);
    return {
      creatureId: beast.creatureId, name: beast.name,
      current: { puntiFerita: data.hitPointsCurrent, puntiFeritaMax: data.hitPointsMax, classeArmatura: data.armorClass },
      statiAttivi: (data.conditions ?? []).map((condition) => condition.nome),
      modificheSessione: touching(beast.creatureId),
    };
  });
  return { participants: participantSummary, creatures: creatureSummary };
}

export async function closeSession(input: { sessionId: string }): Promise<ActionResult> {
  try {
    const sessionId = String(input.sessionId);
    const now = new Date();
    await db.transaction(async (tx) => {
      await requireOpenSession(tx, sessionId);
      const summary = await closingSummary(tx, sessionId);
      await tx.update(masterSessions).set({ status: "chiusa", closedAt: now, encounter: null }).where(eq(masterSessions.id, sessionId));
      await tx.insert(masterSessionEvents).values({ id: randomUUID(), sessionId, type: "sessione_chiusa", occurredAt: now, payload: { title: "Sessione chiusa", ...summary } });
    });
    return finish({ ok: true, id: sessionId });
  } catch (error) {
    return errorResult(error);
  }
}

export async function reopenSession(input: { sessionId: string }): Promise<ActionResult> {
  try {
    const sessionId = String(input.sessionId);
    const now = new Date();
    await db.transaction(async (tx) => {
      const [open] = await tx.select({ id: masterSessions.id, name: masterSessions.name }).from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1);
      if (open && open.id !== sessionId) fail(`Chiudi prima la Sessione aperta «${open.name}».`);
      if (open) return;
      const changed = await tx.update(masterSessions).set({ status: "aperta", closedAt: null })
        .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "chiusa"))).returning({ id: masterSessions.id });
      if (!changed.length) fail("Sessione non trovata.");
      await tx.insert(masterSessionEvents).values({ id: randomUUID(), sessionId, type: "sessione_riaperta", occurredAt: now, payload: { title: "Sessione riaperta" } });
    });
    return finish({ ok: true, id: sessionId });
  } catch (error) {
    return errorResult(error);
  }
}

// Elimina Sessione, partecipanti ed eventi. Le schede restano come sono.
export async function deleteSession(input: { sessionId: string }): Promise<ActionResult> {
  try {
    const sessionId = String(input.sessionId);
    await db.transaction(async (tx) => {
      const [session] = await tx.select({ id: masterSessions.id }).from(masterSessions).where(eq(masterSessions.id, sessionId)).limit(1);
      if (!session) fail("Sessione non trovata.");
      await tx.delete(masterSessionEvents).where(eq(masterSessionEvents.sessionId, sessionId));
      await tx.delete(masterSessionParticipants).where(eq(masterSessionParticipants.sessionId, sessionId));
      await tx.delete(masterSessionCreatures).where(eq(masterSessionCreatures.sessionId, sessionId));
      await tx.delete(masterSessions).where(eq(masterSessions.id, sessionId));
    });
    return finish({ ok: true });
  } catch (error) {
    return errorResult(error);
  }
}

export async function addParticipants(input: { sessionId: string; characterIds: string[]; creatureIds: string[] }): Promise<ActionResult> {
  try {
    const sessionId = String(input.sessionId);
    const characterIds = uniqueIds(input.characterIds);
    const creatureIds = uniqueIds(input.creatureIds);
    if (!characterIds.length && !creatureIds.length) fail("Seleziona almeno un partecipante.");
    await validIds(characters, characterIds);
    await validIds(creatures, creatureIds);
    await db.transaction(async (tx) => {
      await requireOpenSession(tx, sessionId);
      if (characterIds.length) await tx.insert(masterSessionParticipants).values(characterIds.map((characterId) => ({ sessionId, characterId }))).onConflictDoNothing();
      if (creatureIds.length) await tx.insert(masterSessionCreatures).values(creatureIds.map((creatureId) => ({ sessionId, creatureId }))).onConflictDoNothing();
      await tx.insert(masterSessionEvents).values({ id: randomUUID(), sessionId, type: "partecipanti_aggiunti", occurredAt: new Date(), payload: { title: "Partecipanti aggiunti", characters: characterIds, creatures: creatureIds } });
    });
    return finish({ ok: true });
  } catch (error) {
    return errorResult(error);
  }
}

export async function removeParticipant(input: { sessionId: string; kind: "pg" | "cr"; id: string }): Promise<ActionResult> {
  try {
    const sessionId = String(input.sessionId);
    const id = String(input.id);
    await db.transaction(async (tx) => {
      const session = await requireOpenSession(tx, sessionId);
      const removed = input.kind === "cr"
        ? await tx.delete(masterSessionCreatures).where(and(eq(masterSessionCreatures.sessionId, sessionId), eq(masterSessionCreatures.creatureId, id))).returning({ id: masterSessionCreatures.creatureId })
        : await tx.delete(masterSessionParticipants).where(and(eq(masterSessionParticipants.sessionId, sessionId), eq(masterSessionParticipants.characterId, id))).returning({ id: masterSessionParticipants.characterId });
      if (!removed.length) fail("Partecipante non trovato.");
      const [row] = await tx.select({ encounter: masterSessions.encounter }).from(masterSessions).where(eq(masterSessions.id, session.id)).limit(1);
      const encounter = row?.encounter;
      if (encounter) {
        const index = encounter.order.findIndex((entry) => entry.kind === input.kind && entry.id === id);
        if (index >= 0) {
          const order = encounter.order.filter((_, i) => i !== index);
          const turn = order.length ? Math.min(index < encounter.turn ? encounter.turn - 1 : encounter.turn, order.length - 1) : 0;
          await tx.update(masterSessions).set({ encounter: order.length ? { ...encounter, order, turn } : null }).where(eq(masterSessions.id, sessionId));
        }
      }
      const name = input.kind === "cr"
        ? (await tx.select({ name: creatures.name }).from(creatures).where(eq(creatures.id, id)).limit(1))[0]?.name
        : (await tx.select({ name: characters.name }).from(characters).where(eq(characters.id, id)).limit(1))[0]?.name;
      await tx.insert(masterSessionEvents).values({
        id: randomUUID(), sessionId, type: "partecipante_rimosso", occurredAt: new Date(),
        payload: { title: "Rimosso dalla Sessione", ...(input.kind === "cr" ? { creatureName: name } : { characterName: name }) },
      });
    });
    return finish({ ok: true });
  } catch (error) {
    return errorResult(error);
  }
}

// Ordine di iniziativa, round e turno (p. 23).
export async function saveEncounter(input: { sessionId: string; encounter: Encounter | null; log?: "inizio" | "fine" }): Promise<ActionResult> {
  try {
    const sessionId = String(input.sessionId);
    const now = new Date();
    await db.transaction(async (tx) => {
      await requireOpenSession(tx, sessionId);
      let encounter: Encounter | null = null;
      if (input.encounter) {
        const people = new Set((await tx.select({ id: masterSessionParticipants.characterId }).from(masterSessionParticipants).where(eq(masterSessionParticipants.sessionId, sessionId))).map((row) => row.id));
        const beasts = new Set((await tx.select({ id: masterSessionCreatures.creatureId }).from(masterSessionCreatures).where(eq(masterSessionCreatures.sessionId, sessionId))).map((row) => row.id));
        const order = (Array.isArray(input.encounter.order) ? input.encounter.order : []).map((entry) => ({
          kind: entry?.kind === "cr" ? "cr" as const : "pg" as const,
          id: String(entry?.id ?? ""),
          initiative: Number.isFinite(Number(entry?.initiative)) ? Math.trunc(Number(entry.initiative)) : 0,
        }));
        if (!order.length) fail("Aggiungi almeno un combattente.");
        const seen = new Set<string>();
        for (const entry of order) {
          const key = `${entry.kind}:${entry.id}`;
          if (seen.has(key)) fail("Un combattente compare due volte.");
          seen.add(key);
          if (!(entry.kind === "pg" ? people : beasts).has(entry.id)) fail("Un combattente non partecipa alla Sessione.");
        }
        const round = Math.max(1, Math.trunc(Number(input.encounter.round) || 1));
        const turn = Math.min(order.length - 1, Math.max(0, Math.trunc(Number(input.encounter.turn) || 0)));
        encounter = { round, turn, order };
      }
      await tx.update(masterSessions).set({ encounter }).where(eq(masterSessions.id, sessionId));
      if (input.log) {
        await tx.insert(masterSessionEvents).values({
          id: randomUUID(), sessionId, type: input.log === "inizio" ? "combattimento_inizio" : "combattimento_fine", occurredAt: now,
          payload: { title: input.log === "inizio" ? "Combattimento iniziato" : "Combattimento terminato", details: input.log === "inizio" && encounter ? [`${encounter.order.length} combattenti`] : [] },
        });
      }
    });
    return finish({ ok: true });
  } catch (error) {
    return errorResult(error);
  }
}
