"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { creatures, masterSessionCreatures, masterSessionEvents, masterSessions } from "@/lib/db/schema";
import { normalizeCreature, type CreatureData } from "@/lib/creature";
import { cleanText, creatureChanges, errorResult, fail, type ActionResult } from "@/lib/masterCommand";

function finish(result: ActionResult, creatureId?: string) {
  if (result.ok) {
    revalidatePath("/master");
    revalidatePath("/");
    if (creatureId) revalidatePath(`/creatura/${creatureId}`);
    refresh();
  }
  return result;
}

async function openSession() {
  const [session] = await db.select({ id: masterSessions.id }).from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1);
  return session?.id ?? null;
}

// Crea o modifica una creatura. Se partecipa alla Sessione aperta, la modifica
// è registrata come evento annullabile.
export async function saveCreature(input: { id?: string | null; name: string; data: CreatureData; addToSession?: boolean }): Promise<ActionResult> {
  try {
    const name = cleanText(input.name, 120);
    if (!name) fail("Inserisci il nome della creatura.");
    const data = normalizeCreature(input.data);
    if (data.hitPointsMax < 1) fail("I PF massimi devono essere almeno 1.");
    const now = new Date();
    const sessionId = await openSession();
    const id = input.id ? String(input.id) : randomUUID();
    await db.transaction(async (tx) => {
      if (input.id) {
        const [row] = await tx.select().from(creatures).where(eq(creatures.id, id)).limit(1);
        if (!row) fail("Creatura non trovata.");
        const before = normalizeCreature(row!.data);
        await tx.update(creatures).set({ name, data, updatedAt: now }).where(eq(creatures.id, id));
        if (sessionId) {
          const [member] = await tx.select({ id: masterSessionCreatures.creatureId }).from(masterSessionCreatures)
            .where(and(eq(masterSessionCreatures.sessionId, sessionId), eq(masterSessionCreatures.creatureId, id))).limit(1);
          if (member) {
            const changes = creatureChanges(before, data);
            if (row!.name !== name) changes.unshift({ field: "Nome", before: row!.name, after: name });
            if (changes.length) await tx.insert(masterSessionEvents).values({
              id: randomUUID(), sessionId, creatureId: id, type: "creatura_modificata", occurredAt: now,
              payload: {
                title: "Scheda della creatura modificata", creatureName: name, details: [], changes,
                targets: [{ kind: "cr", id, name, changes }],
                undo: { targets: [{ kind: "cr", id, before: { name: row!.name, data: before }, after: { name, data } }] },
              },
            });
          }
        }
      } else {
        await tx.insert(creatures).values({ id, name, data, createdAt: now, updatedAt: now });
        if (sessionId && input.addToSession) {
          await tx.insert(masterSessionCreatures).values({ sessionId, creatureId: id });
          await tx.insert(masterSessionEvents).values({ id: randomUUID(), sessionId, creatureId: id, type: "creatura_aggiunta", occurredAt: now, payload: { title: "Nuova creatura nella Sessione", creatureName: name } });
        }
      }
    });
    return finish({ ok: true, id }, id);
  } catch (error) {
    return errorResult(error);
  }
}

// Copie numerate per gruppi di creature identiche (p. 23: stessa iniziativa).
export async function duplicateCreature(input: { id: string; count: number; addToSession?: boolean }): Promise<ActionResult> {
  try {
    const count = Math.trunc(Number(input.count));
    if (!Number.isInteger(count) || count < 1 || count > 20) fail("Puoi creare da 1 a 20 copie.");
    const [row] = await db.select().from(creatures).where(eq(creatures.id, String(input.id))).limit(1);
    if (!row) fail("Creatura non trovata.");
    const base = row!.name.replace(/\s+\d+$/, "");
    const names = new Set((await db.select({ name: creatures.name }).from(creatures)).map((item) => item.name));
    const source = normalizeCreature(row!.data);
    const copy: CreatureData = { ...source, hitPointsCurrent: source.hitPointsMax, hitPointsTemp: 0, conditions: [], esemplare: true, modello: row!.data.modello ?? row!.name };
    delete copy.concentration;
    const sessionId = input.addToSession ? await openSession() : null;
    const now = new Date();
    const created: string[] = [];
    await db.transaction(async (tx) => {
      let number = 2;
      for (let index = 0; index < count; index += 1) {
        while (names.has(`${base} ${number}`)) number += 1;
        const name = `${base} ${number}`;
        names.add(name);
        const id = randomUUID();
        await tx.insert(creatures).values({ id, name, data: copy, createdAt: now, updatedAt: now });
        if (sessionId) await tx.insert(masterSessionCreatures).values({ sessionId, creatureId: id });
        created.push(name);
      }
      if (sessionId) await tx.insert(masterSessionEvents).values({ id: randomUUID(), sessionId, type: "creatura_aggiunta", occurredAt: now, payload: { title: "Creature aggiunte alla Sessione", details: created } });
    });
    return finish({ ok: true, title: `Create: ${created.join(", ")}` });
  } catch (error) {
    return errorResult(error);
  }
}

// Elimina la creatura dalla libreria. Gli eventi passati restano con il nome.
export async function deleteCreature(input: { id: string }): Promise<ActionResult> {
  try {
    const id = String(input.id);
    await db.transaction(async (tx) => {
      const [row] = await tx.select({ id: creatures.id }).from(creatures).where(eq(creatures.id, id)).limit(1);
      if (!row) fail("Creatura non trovata.");
      await tx.update(masterSessionEvents).set({ creatureId: null }).where(eq(masterSessionEvents.creatureId, id));
      await tx.delete(masterSessionCreatures).where(eq(masterSessionCreatures.creatureId, id));
      const [open] = await tx.select({ id: masterSessions.id, encounter: masterSessions.encounter }).from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1);
      if (open?.encounter?.order.some((entry) => entry.kind === "cr" && entry.id === id)) {
        const order = open.encounter.order.filter((entry) => !(entry.kind === "cr" && entry.id === id));
        await tx.update(masterSessions).set({ encounter: order.length ? { ...open.encounter, order, turn: Math.min(open.encounter.turn, order.length - 1) } : null }).where(eq(masterSessions.id, open.id));
      }
      await tx.delete(creatures).where(eq(creatures.id, id));
    });
    return finish({ ok: true });
  } catch (error) {
    return errorResult(error);
  }
}
