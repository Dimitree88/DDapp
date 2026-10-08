"use server";

import { randomUUID } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { creatures, masterSessionCreatures, masterSessionEvents, masterSessionParticipants, masterSessions, type Encounter, type EncounterEntry } from "@/lib/db/schema";
import { normalizeCreature, type CreatureData } from "@/lib/creature";
import { cleanText, errorResult, fail, requireOpenSession, type ActionResult } from "@/lib/masterCommand";

// Nemico da creare all'inizio del combattimento: copia di un modello della
// libreria oppure nemico rapido con i soli valori essenziali.
export type EnemyDraft = {
  key: string;
  name: string;
  templateId?: string;
  quick?: { armorClass: number; hitPoints: number; initiativeBonus: number; attack?: { name: string; hitBonus: number; damageFormula: string; damageType: string } };
};
export type OrderDraft = { kind: "pg" | "cr" | "nuovo"; id: string; initiative: number };

function quickCreature(draft: EnemyDraft): CreatureData {
  const quick = draft.quick!;
  return normalizeCreature({
    origin: "personalizzata", description: "Nemico rapido", creatureType: "", size: "Media",
    armorClass: quick.armorClass, armorClassNote: "", hitPointsMax: quick.hitPoints, hitPointsCurrent: quick.hitPoints,
    initiativeBonus: quick.initiativeBonus, speedMeters: 9, challengeRating: "", experiencePoints: 0,
    actions: quick.attack?.name ? [{
      name: quick.attack.name, attackType: "Tiro per colpire in mischia", hitBonus: quick.attack.hitBonus, reachMeters: 1.5,
      hitDamage: 0, damageFormula: quick.attack.damageFormula, damageType: quick.attack.damageType, category: "azione",
    }] : [],
    traits: [], esemplare: true,
  });
}

// Prepara o aggiorna il combattimento: crea i nuovi nemici, li aggiunge alla
// Sessione e salva l'ordine d'iniziativa (p. 23) in un'unica transazione.
export async function setupCombat(input: { sessionId: string; drafts: EnemyDraft[]; order: OrderDraft[]; round?: number; currentId?: string | null }): Promise<ActionResult> {
  try {
    const sessionId = String(input.sessionId);
    const drafts = Array.isArray(input.drafts) ? input.drafts.slice(0, 60) : [];
    const now = new Date();
    const created: string[] = [];
    await db.transaction(async (tx) => {
      await requireOpenSession(tx, sessionId);
      const [row] = await tx.select({ encounter: masterSessions.encounter }).from(masterSessions).where(eq(masterSessions.id, sessionId)).limit(1);
      const templateIds = [...new Set(drafts.map((draft) => draft.templateId).filter((id): id is string => Boolean(id)))];
      const templates = templateIds.length ? await tx.select().from(creatures).where(inArray(creatures.id, templateIds)) : [];
      const keyToId = new Map<string, string>();
      for (const draft of drafts) {
        const name = cleanText(draft.name, 120);
        if (!name) fail("Ogni nemico deve avere un nome.");
        let data: CreatureData;
        if (draft.templateId) {
          const template = templates.find((item) => item.id === draft.templateId);
          if (!template) fail("Modello di creatura non trovato.");
          const source = normalizeCreature(template!.data);
          data = { ...source, hitPointsCurrent: source.hitPointsMax, hitPointsTemp: 0, conditions: [], esemplare: true, modello: template!.name };
          delete data.concentration;
        } else {
          const quick = draft.quick;
          if (!quick || !Number.isInteger(quick.hitPoints) || quick.hitPoints < 1 || !Number.isInteger(quick.armorClass) || quick.armorClass < 0) fail(`${name}: inserisci CA e PF validi.`);
          data = quickCreature(draft);
        }
        const id = randomUUID();
        await tx.insert(creatures).values({ id, name, data, createdAt: now, updatedAt: now });
        await tx.insert(masterSessionCreatures).values({ sessionId, creatureId: id });
        keyToId.set(String(draft.key), id);
        created.push(name);
      }
      const people = new Set((await tx.select({ id: masterSessionParticipants.characterId }).from(masterSessionParticipants).where(eq(masterSessionParticipants.sessionId, sessionId))).map((item) => item.id));
      const beasts = new Set((await tx.select({ id: masterSessionCreatures.creatureId }).from(masterSessionCreatures).where(eq(masterSessionCreatures.sessionId, sessionId))).map((item) => item.id));
      const order: EncounterEntry[] = [];
      const seen = new Set<string>();
      for (const entry of Array.isArray(input.order) ? input.order : []) {
        const kind = entry.kind === "pg" ? "pg" : "cr";
        const id = entry.kind === "nuovo" ? keyToId.get(String(entry.id)) : String(entry.id);
        if (!id) fail("Nemico non riconosciuto nell'ordine d'iniziativa.");
        if (!(kind === "pg" ? people : beasts).has(id!)) fail("Un combattente non partecipa alla Sessione.");
        const initiative = Math.trunc(Number(entry.initiative));
        if (!Number.isFinite(initiative)) fail("Iniziativa non valida.");
        if (seen.has(`${kind}:${id}`)) continue;
        seen.add(`${kind}:${id}`);
        order.push({ kind, id: id!, initiative });
      }
      if (!order.length) fail("Aggiungi almeno un combattente all'ordine d'iniziativa.");
      const previous = row?.encounter ?? null;
      const currentIndex = input.currentId ? order.findIndex((entry) => `${entry.kind}:${entry.id}` === input.currentId) : -1;
      const encounter: Encounter = {
        round: Math.max(1, Math.trunc(Number(input.round ?? previous?.round ?? 1)) || 1),
        turn: previous ? Math.max(0, currentIndex) : 0,
        order,
      };
      await tx.update(masterSessions).set({ encounter }).where(eq(masterSessions.id, sessionId));
      if (!previous || created.length) {
        await tx.insert(masterSessionEvents).values({
          id: randomUUID(), sessionId, type: previous ? "combattimento_rinforzi" : "combattimento_inizio", occurredAt: now,
          payload: { title: previous ? "Nuovi combattenti" : "Combattimento iniziato", details: [
            ...(created.length ? [`Nemici: ${created.join(", ")}`] : []),
            ...(!previous ? [`Ordine: ${order.length} combattenti`] : []),
          ] },
        });
      }
    });
    revalidatePath("/master");
    refresh();
    return { ok: true, title: created.length ? `Nemici aggiunti: ${created.length}` : undefined };
  } catch (error) {
    return errorResult(error);
  }
}

// Termina il combattimento: azzera l'ordine e, se richiesto, toglie dalla
// Sessione i nemici a 0 PF (gli esemplari creati per lo scontro si eliminano).
export async function endCombat(input: { sessionId: string; removeDefeated: boolean }): Promise<ActionResult & { xp?: number; defeated?: string[] }> {
  try {
    const sessionId = String(input.sessionId);
    const now = new Date();
    let xp = 0;
    const defeated: string[] = [];
    await db.transaction(async (tx) => {
      await requireOpenSession(tx, sessionId);
      const [row] = await tx.select({ encounter: masterSessions.encounter }).from(masterSessions).where(eq(masterSessions.id, sessionId)).limit(1);
      const ids = (row?.encounter?.order ?? []).filter((entry) => entry.kind === "cr").map((entry) => entry.id);
      const fought = ids.length ? await tx.select().from(creatures).where(inArray(creatures.id, ids)) : [];
      for (const beast of fought) {
        const data = normalizeCreature(beast.data);
        if (data.hitPointsCurrent > 0) continue;
        defeated.push(beast.name);
        xp += data.experiencePoints;
        if (!input.removeDefeated) continue;
        await tx.delete(masterSessionCreatures).where(and(eq(masterSessionCreatures.sessionId, sessionId), eq(masterSessionCreatures.creatureId, beast.id)));
        if (data.esemplare) {
          await tx.update(masterSessionEvents).set({ creatureId: null }).where(eq(masterSessionEvents.creatureId, beast.id));
          await tx.delete(masterSessionCreatures).where(eq(masterSessionCreatures.creatureId, beast.id));
          await tx.delete(creatures).where(eq(creatures.id, beast.id));
        }
      }
      await tx.update(masterSessions).set({ encounter: null }).where(eq(masterSessions.id, sessionId));
      await tx.insert(masterSessionEvents).values({
        id: randomUUID(), sessionId, type: "combattimento_fine", occurredAt: now,
        payload: { title: "Combattimento terminato", details: [
          ...(defeated.length ? [`Sconfitti: ${defeated.join(", ")}`] : []),
          ...(xp ? [`PE delle creature sconfitte: ${xp}`] : []),
        ] },
      });
    });
    revalidatePath("/master");
    refresh();
    return { ok: true, xp, defeated };
  } catch (error) {
    return errorResult(error);
  }
}
