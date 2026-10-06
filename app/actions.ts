"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { characterHistory, characters } from "@/lib/db/schema";
import { normalizeSheet, type Sheet } from "@/lib/sheet";
import { domainErrors } from "@/lib/domain";
import { diffSheet, historyTimestampMs, type HistoryChange } from "@/lib/history";
import { creationErrors } from "@/lib/creationRules";
import { addClassSkillChoice, availableClassSkillChoices } from "@/lib/classSkillChoices";
import { armorForEquipment } from "@/lib/equipmentSelection";

export type HistoryEntry = { id: string; occurredAt: string; changes: HistoryChange[] };

export async function deleteCharacter(id: string) {
  await db.transaction(async (tx) => {
    await tx.delete(characterHistory).where(eq(characterHistory.characterId, id));
    await tx.delete(characters).where(eq(characters.id, id));
  });
  revalidatePath("/");
}

export async function getCharacterHistory(id: string): Promise<HistoryEntry[]> {
  const rows = await db.select({
    id: characterHistory.id,
    occurredAt: sql<number>`${characterHistory.occurredAt}`,
    changes: characterHistory.changes,
  }).from(characterHistory)
    .where(eq(characterHistory.characterId, id));
  return rows.map((row) => ({
    id: row.id,
    occurredAt: new Date(historyTimestampMs(Number(row.occurredAt))).toISOString(),
    changes: row.changes,
  })).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id));
}

export async function saveSheet(
  id: string,
  name: string,
  sheet: Sheet,
): Promise<{ ok: boolean; error?: string }> {
  const cleanName = name.trim() || "Senza nome";
  const normalized = normalizeSheet(sheet);
  const invalid = domainErrors(normalized);
  if (invalid.length) return { ok: false, error: `Valori fuori catalogo: ${invalid.join("; ")}` };
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(characters).where(eq(characters.id, id));
    if (!current) return { ok: false, error: "Personaggio non trovato" };
    const previous = normalizeSheet(current.data);
    const locked = creationErrors(previous, normalized);
    if (locked.length) return { ok: false, error: `Scelte bloccate: ${locked.join(", ")}` };
    const protectedFields = ["livello", "puntiFeritaMax", "dadiVita", "velocita", "allineamento", "ispirazioneEroica", "puntiEsperienza"] as const;
    const directChanges = protectedFields.filter((field) => previous[field] !== normalized[field]);
    if (directChanges.length) return { ok: false, error: `Modifiche non consentite dalla scheda: ${directChanges.join(", ")}` };
    if (JSON.stringify(previous.lingue) !== JSON.stringify(normalized.lingue)) {
      return { ok: false, error: "Le lingue si modificano solo nei flussi guidati di creazione e avanzamento." };
    }
    if (JSON.stringify(previous.caratteristiche) !== JSON.stringify(normalized.caratteristiche)) {
      return { ok: false, error: "Punteggi di caratteristica e competenze nei tiri salvezza si modificano solo tramite gli eventi previsti dalle regole." };
    }
    const savingThrowSources = (value: Sheet) => (value.fontiCompetenze ?? []).filter((record) => record.tipo === "tiroSalvezza");
    if (JSON.stringify(savingThrowSources(previous)) !== JSON.stringify(savingThrowSources(normalized))) {
      return { ok: false, error: "Le fonti delle competenze nei tiri salvezza si modificano solo tramite gli eventi previsti dalle regole." };
    }
    const skillSources = (value: Sheet) => (value.fontiCompetenze ?? []).filter((record) => record.tipo === "abilita");
    const skillChanges = JSON.stringify(previous.abilita) !== JSON.stringify(normalized.abilita)
      || JSON.stringify(skillSources(previous)) !== JSON.stringify(skillSources(normalized));
    if (skillChanges) {
      const validClassChoice = availableClassSkillChoices(previous).some((skill) => {
        const choice = addClassSkillChoice(previous, skill);
        return JSON.stringify(choice.abilita) === JSON.stringify(normalized.abilita)
          && JSON.stringify(skillSources({ ...previous, ...choice })) === JSON.stringify(skillSources(normalized));
      });
      if (!validClassChoice) return { ok: false, error: "Competenze e Maestria nelle abilità si modificano solo tramite le scelte previste dalle regole." };
    }
    if (!previous.scudo && normalized.scudo && !normalized.equipaggiamento.some((item) =>
      item.impugnato && armorForEquipment(item)?.category === "scudi" && Number(item.quantita ?? "1") > 0)) {
      return { ok: false, error: "Registra prima lo scudo nell'inventario." };
    }
    const changes = diffSheet(previous, normalized);
    if (current.name !== cleanName) changes.unshift({ field: "Nome del personaggio", before: current.name, after: cleanName });
    const hasRemovedBonus = [...current.data.armi, ...current.data.equipaggiamento]
      .some((item) => Object.hasOwn(item, "bonusMagico"));
    if (changes.length === 0 && !hasRemovedBonus) return { ok: true };
    const now = new Date();
    await tx.update(characters).set({ name: cleanName, data: normalized, updatedAt: now }).where(eq(characters.id, id));
    if (changes.length) await tx.insert(characterHistory).values({ id: randomUUID(), characterId: id, occurredAt: now, changes });
    return { ok: true };
  });
  if (!result.ok) return result;
  revalidatePath(`/personaggio/${id}`);
  revalidatePath("/");
  return result;
}
