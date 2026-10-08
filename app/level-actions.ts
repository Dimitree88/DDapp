"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { characters, masterSessionEvents, masterSessionParticipants, masterSessions } from "@/lib/db/schema";
import { domainErrors } from "@/lib/domain";
import { applyLevelUp, levelUpErrors, manualSpell, planLevelUp, type LevelUpChoices, type LevelUpPlan, type SummaryItem } from "@/lib/levelUp";
import { errorResult, fail, storeCharacter } from "@/lib/masterCommand";
import { normalizeSheet, type Sheet } from "@/lib/sheet";

export async function prepareLevelUp(characterId: string): Promise<{ ok: true; plan: LevelUpPlan } | { ok: false; error: string }> {
  try {
    const [row] = await db.select().from(characters).where(eq(characters.id, String(characterId))).limit(1);
    if (!row) fail("Personaggio non trovato.");
    const plan = planLevelUp(row!.id, row!.name, row!.data);
    if ("error" in plan) fail(plan.error);
    return { ok: true, plan: plan as LevelUpPlan };
  } catch (error) {
    const result = errorResult(error);
    return result.ok ? { ok: false, error: "Impossibile preparare il cambio di livello." } : result;
  }
}

// Testo dell'incantesimo dal manuale, chiesto quando il giocatore apre la descrizione.
export async function spellDescription(name: string): Promise<{ text: string; page?: number } | null> {
  const found = manualSpell(String(name).slice(0, 120));
  return found ? { text: found.text, page: found.voce.pagina } : null;
}

export type LevelUpResult = { ok: true; level: number; summary: SummaryItem[]; sheet: Sheet } | { ok: false; error: string };

export async function confirmLevelUp(input: { characterId: string; fromLevel: number; choices: LevelUpChoices }): Promise<LevelUpResult> {
  const characterId = String(input.characterId);
  try {
    const now = new Date();
    const result = await db.transaction(async (tx) => {
      const [row] = await tx.select().from(characters).where(eq(characters.id, characterId)).limit(1);
      if (!row) fail("Personaggio non trovato.");
      const before = normalizeSheet(row!.data);
      if (Number(before.livello) !== Number(input.fromLevel)) fail(`La scheda è già al livello ${before.livello}: ricarica per continuare.`);
      const plan = planLevelUp(row!.id, row!.name, before);
      if ("error" in plan) fail(plan.error);
      const ready = plan as LevelUpPlan;
      const errors = levelUpErrors(before, ready, input.choices ?? ({} as LevelUpChoices));
      if (errors.length) fail(errors.join(" "));
      const applied = applyLevelUp(before, ready, input.choices);
      const previousErrors = new Set(domainErrors(before));
      const newErrors = domainErrors(applied.sheet).filter((item) => !previousErrors.has(item));
      if (newErrors.length) fail(`Scelte non valide per la scheda: ${newErrors.join("; ")}`);
      const stored = await storeCharacter(tx, characterId, before, applied.sheet, now);
      // Se il personaggio partecipa alla Sessione aperta, il passaggio compare nel registro.
      const [session] = await tx.select({ id: masterSessions.id }).from(masterSessions)
        .innerJoin(masterSessionParticipants, eq(masterSessionParticipants.sessionId, masterSessions.id))
        .where(and(eq(masterSessions.status, "aperta"), eq(masterSessionParticipants.characterId, characterId))).limit(1);
      if (session) {
        await tx.insert(masterSessionEvents).values({
          id: randomUUID(), sessionId: session.id, characterId, type: "livello", occurredAt: now,
          payload: { title: `Livello ${ready.from} → ${ready.to}`, characterName: row!.name, details: applied.summary.filter((item) => item.kind !== "in gioco").map((item) => item.text) },
        });
      }
      return { ok: true as const, level: ready.to, summary: applied.summary, sheet: stored.sheet };
    });
    // Niente refresh qui: la scheda aperta si ricarica quando si chiude il
    // riepilogo delle novità, altrimenti verrebbe rimontata subito.
    revalidatePath("/master");
    return result;
  } catch (error) {
    const result = errorResult(error);
    return result.ok ? { ok: false, error: "Cambio di livello non riuscito." } : result;
  }
}
