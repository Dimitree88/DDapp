"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { characterHistory, characters } from "@/lib/db/schema";
import { normalizeSheet, type Sheet } from "@/lib/sheet";
import { domainErrors } from "@/lib/domain";
import { diffManualSheet, equipmentAcquisitions, historyTimestampMs, type HistoryChange } from "@/lib/history";
import { creationErrors } from "@/lib/creationRules";
import { addCatalogEquipment, armorForEquipment } from "@/lib/equipmentSelection";
import { gearByName } from "@/lib/gearCatalog";
import { stableJson } from "@/lib/masterView";

export type HistoryEntry = { id: string; occurredAt: string; changes: HistoryChange[] };
export type BundleReceipt = { name: string };

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
  bundleReceipts: BundleReceipt[] = [],
): Promise<{ ok: boolean; error?: string }> {
  const cleanName = name.trim() || "Senza nome";
  let normalized = normalizeSheet(sheet);
  const invalid = domainErrors(normalized);
  if (invalid.length) return { ok: false, error: `Valori fuori catalogo: ${invalid.join("; ")}` };
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(characters).where(eq(characters.id, id));
    if (!current) return { ok: false, error: "Personaggio non trovato" };
    const previous = normalizeSheet(current.data);
    const receiptPacks = bundleReceipts.map((receipt) => gearByName(receipt.name));
    if (receiptPacks.some((pack) => !pack?.contents?.length)) return { ok: false, error: "Dotazione non valida." };
    if (bundleReceipts.length) {
      const now = new Date();
      normalized = normalizeSheet({
        ...normalized,
        eventiStoria: [
          ...(previous.eventiStoria ?? []),
          ...receiptPacks.map((pack) => ({
            capitolo: "Dotazioni ricevute",
            titolo: `Dotazione ricevuta: ${pack!.name}`,
            dettagli: pack!.contents!.map(({ name, quantity }) => `${name}${quantity && quantity > 1 ? ` ×${quantity}` : ""}`),
            data: now.toISOString(),
          })),
        ],
      });
    }
    const locked = creationErrors(previous, normalized);
    if (locked.length) return { ok: false, error: `Scelte bloccate: ${locked.join(", ")}` };
    const protectedFields = [
      "livello", "puntiFerita", "puntiFeritaMax", "puntiFeritaTemporanei", "dadiVita", "dadiVitaSpesi",
      "tiriMorte", "condizioni", "indebolimento", "concentrazione", "risorse", "slotSpesi",
      "velocita", "allineamento", "ispirazioneEroica", "puntiEsperienza",
    ] as const;
    // Confronto per valore: array e oggetti normalizzati sono sempre istanze nuove.
    const directChanges = protectedFields.filter((field) => stableJson(previous[field]) !== stableJson(normalized[field]));
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
    const weaponSources = (value: Sheet) => (value.fontiCompetenze ?? []).filter((record) => record.tipo === "arma");
    if (JSON.stringify(previous.competenzeArmi) !== JSON.stringify(normalized.competenzeArmi)
      || JSON.stringify(weaponSources(previous)) !== JSON.stringify(weaponSources(normalized))) {
      return { ok: false, error: "Le competenze nelle armi si modificano solo tramite i flussi guidati previsti dalle regole." };
    }
    if (JSON.stringify(previous.padronanzeArmi ?? []) !== JSON.stringify(normalized.padronanzeArmi ?? [])) {
      return { ok: false, error: "Le Padronanze si modificano solo durante la creazione, il cambio livello o il riposo lungo previsto dalle regole." };
    }
    const skillSources = (value: Sheet) => (value.fontiCompetenze ?? []).filter((record) => record.tipo === "abilita");
    const skillChanges = JSON.stringify(previous.abilita) !== JSON.stringify(normalized.abilita)
      || JSON.stringify(skillSources(previous)) !== JSON.stringify(skillSources(normalized));
    if (skillChanges) return { ok: false, error: "Competenze e Maestria nelle abilità si modificano solo tramite i flussi guidati previsti dalle regole." };
    if (JSON.stringify(previous.incantesimi) !== JSON.stringify(normalized.incantesimi)) {
      return { ok: false, error: "Incantesimi e caratteristiche di lancio si modificano solo tramite i flussi guidati previsti dalle regole." };
    }
    if (JSON.stringify(previous.privilegi) !== JSON.stringify(normalized.privilegi)
      || JSON.stringify(previous.talenti) !== JSON.stringify(normalized.talenti)) {
      return { ok: false, error: "Privilegi, talenti e relative scelte si modificano solo tramite i flussi guidati previsti dalle regole." };
    }
    if (JSON.stringify(previous.risorse ?? []) !== JSON.stringify(normalized.risorse ?? [])) {
      return { ok: false, error: "Le risorse e i loro utilizzi si modificano solo tramite i flussi guidati previsti dalle regole." };
    }
    if (JSON.stringify(previous.competenzeArmatura) !== JSON.stringify(normalized.competenzeArmatura)
      || JSON.stringify(previous.competenzeStrumenti ?? []) !== JSON.stringify(normalized.competenzeStrumenti ?? [])
      || JSON.stringify(previous.fontiCompetenze ?? []) !== JSON.stringify(normalized.fontiCompetenze ?? [])) {
      return { ok: false, error: "Competenze e relative fonti si modificano solo tramite i flussi guidati previsti dalle regole." };
    }
    if (!previous.scudo && normalized.scudo && !normalized.equipaggiamento.some((item) =>
      item.impugnato && armorForEquipment(item)?.category === "scudi" && Number(item.quantita ?? "1") > 0)) {
      return { ok: false, error: "Registra prima lo scudo nell'inventario." };
    }
    let equipmentBeforeManual = previous.equipaggiamento;
    for (const pack of receiptPacks) equipmentBeforeManual = addCatalogEquipment(equipmentBeforeManual, pack!.id);
    const changes = diffManualSheet({ ...previous, equipaggiamento: equipmentBeforeManual }, normalized);
    const hasRemovedBonus = [...current.data.armi, ...current.data.equipaggiamento]
      .some((item) => Object.hasOwn(item, "bonusMagico"));
    if (changes.length === 0 && bundleReceipts.length === 0 && !hasRemovedBonus && current.name === cleanName) return { ok: true };
    const now = new Date();
    const acquisitions = equipmentAcquisitions(equipmentBeforeManual, normalized.equipaggiamento);
    if (acquisitions.length) {
      normalized = {
        ...normalized,
        eventiStoria: [...(normalized.eventiStoria ?? []), {
          capitolo: "Dotazioni ricevute",
          titolo: "Equipaggiamento aggiunto",
          dettagli: acquisitions,
          data: now.toISOString(),
        }],
      };
    }
    await tx.update(characters).set({ name: cleanName, data: normalized, updatedAt: now }).where(eq(characters.id, id));
    if (changes.length) await tx.insert(characterHistory).values({ id: randomUUID(), characterId: id, occurredAt: now, changes });
    return { ok: true };
  });
  if (!result.ok) return result;
  revalidatePath(`/personaggio/${id}`);
  revalidatePath("/");
  return result;
}
