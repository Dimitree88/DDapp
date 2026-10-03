"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { characterHistory, characters } from "@/lib/db/schema";
import { emptySheet, normalizeSheet, type Sheet } from "@/lib/sheet";
import { domainErrors } from "@/lib/domain";
import { diffSheet, type HistoryChange } from "@/lib/history";

export type HistoryEntry = { id: string; occurredAt: string; changes: HistoryChange[] };

export async function createCharacter(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const id = randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(characters).values({ id, name, pinHash: "", data: emptySheet() });
    await tx.insert(characterHistory).values({
      id: randomUUID(), characterId: id, occurredAt: new Date(),
      changes: [{ field: "Personaggio creato", before: "—", after: name }],
    });
  });
  redirect(`/personaggio/${id}`);
}

export async function deleteCharacter(id: string) {
  await db.transaction(async (tx) => {
    await tx.delete(characterHistory).where(eq(characterHistory.characterId, id));
    await tx.delete(characters).where(eq(characters.id, id));
  });
  revalidatePath("/");
}

export async function getCharacterHistory(id: string): Promise<HistoryEntry[]> {
  const rows = await db.select().from(characterHistory)
    .where(eq(characterHistory.characterId, id))
    .orderBy(desc(characterHistory.occurredAt), desc(characterHistory.id));
  return rows.map((row) => ({ id: row.id, occurredAt: row.occurredAt.toISOString(), changes: row.changes }));
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
    const changes = diffSheet(normalizeSheet(current.data), normalized);
    if (current.name !== cleanName) changes.unshift({ field: "Nome del personaggio", before: current.name, after: cleanName });
    if (changes.length === 0) return { ok: true };
    const now = new Date();
    await tx.update(characters).set({ name: cleanName, data: normalized, updatedAt: now }).where(eq(characters.id, id));
    await tx.insert(characterHistory).values({ id: randomUUID(), characterId: id, occurredAt: now, changes });
    return { ok: true };
  });
  if (!result.ok) return result;
  revalidatePath(`/personaggio/${id}`);
  revalidatePath("/");
  return result;
}
