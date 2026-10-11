"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { characterHistory, characters } from "@/lib/db/schema";
import { normalizeSheet, type Sheet } from "@/lib/sheet";
import { domainErrors } from "@/lib/domain";
import { coalesceHistoryChanges, diffManualSheet, equipmentAcquisitions, historyTimestampMs, withoutAppuntiChanges, type HistoryChange } from "@/lib/history";
import { creationErrors } from "@/lib/creationRules";
import { addCatalogEquipment, armorForEquipment } from "@/lib/equipmentSelection";
import { gearById, gearByName } from "@/lib/gearCatalog";
import { stableJson } from "@/lib/masterView";
import { characterCardStatus, type CharacterCardStatus } from "@/lib/characterCardStatus";
import { payCoins } from "@/lib/coins";
import { searchHomeGlossary, type HomeGlossaryEntry } from "@/lib/homeGlossary";

export type HistoryEntry = { id: string; occurredAt: string; changes: HistoryChange[] };
export type BundleReceipt = { name: string };

export type CharacterLiveFields = Pick<Sheet, "puntiFerita" | "ispirazioneEroica" | "puntiEsperienza"> & {
  puntiFeritaTemporanei: string;
  dadiVitaSpesi: string;
  tiriMorte: NonNullable<Sheet["tiriMorte"]> | null;
  statoMorte: Sheet["statoMorte"] | null;
  condizioni: NonNullable<Sheet["condizioni"]>;
  indebolimento: number;
  concentrazione: Sheet["concentrazione"] | null;
  risorse: NonNullable<Sheet["risorse"]>;
  slotSpesi: Record<string, number>;
};

export async function getHomeCharacterCards(): Promise<CharacterCardStatus[]> {
  const rows = await db.select({ id: characters.id, name: characters.name, data: characters.data })
    .from(characters).orderBy(asc(characters.name));
  return rows.map((row) => characterCardStatus(row.id, row.name, normalizeSheet(row.data)));
}

export async function searchHomeGlossaryEntries(query: string): Promise<HomeGlossaryEntry[]> {
  return searchHomeGlossary(query.slice(0, 100));
}

export async function getCharacterLiveFields(id: string): Promise<CharacterLiveFields | null> {
  const [row] = await db.select({ data: characters.data }).from(characters).where(eq(characters.id, id));
  if (!row) return null;
  const sheet = normalizeSheet(row.data);
  return {
    puntiFerita: sheet.puntiFerita,
    puntiFeritaTemporanei: sheet.puntiFeritaTemporanei ?? "0",
    dadiVitaSpesi: sheet.dadiVitaSpesi ?? "0",
    tiriMorte: sheet.tiriMorte ?? null,
    statoMorte: sheet.statoMorte ?? null,
    condizioni: sheet.condizioni ?? [],
    indebolimento: sheet.indebolimento ?? 0,
    concentrazione: sheet.concentrazione ?? null,
    ispirazioneEroica: sheet.ispirazioneEroica,
    puntiEsperienza: sheet.puntiEsperienza,
    risorse: sheet.risorse ?? [],
    slotSpesi: sheet.slotSpesi ?? {},
  };
}

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
  return rows.flatMap((row) => {
    const changes = withoutAppuntiChanges(row.changes);
    if (!changes.length) return [];
    return [{
      id: row.id,
      occurredAt: new Date(historyTimestampMs(Number(row.occurredAt))).toISOString(),
      changes,
    }];
  }).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || b.id.localeCompare(a.id));
}

export async function saveSheet(
  id: string,
  name: string,
  sheet: Sheet,
  bundleReceipts: BundleReceipt[] = [],
): Promise<{ ok: boolean; error?: string }> {
  const cleanName = name.trim() || "Senza nome";
  let normalized = normalizeSheet(sheet);
  if (normalized.equipaggiamento.some((item) => !item.nome.trim())) {
    return { ok: false, error: "Ogni oggetto dell'equipaggiamento deve avere un nome." };
  }
  const invalid = domainErrors(normalized);
  if (invalid.length) return { ok: false, error: `Valori fuori catalogo: ${invalid.join("; ")}` };
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(characters).where(eq(characters.id, id));
    if (!current) return { ok: false, error: "Personaggio non trovato" };
    const previous = normalizeSheet(current.data);
    const hitPointsNeedNormalization = String(current.data.puntiFerita ?? "") !== previous.puntiFerita;
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
    const appuntiChanged = stableJson(previous.note) !== stableJson(normalized.note);
    const hasRemovedBonus = [...current.data.armi, ...current.data.equipaggiamento]
      .some((item) => Object.hasOwn(item, "bonusMagico"));
    const manualChangesExist = changes.length > 0;
    if (!manualChangesExist && !appuntiChanged && bundleReceipts.length === 0 && !hasRemovedBonus && current.name === cleanName && !hitPointsNeedNormalization) return { ok: true };
    const now = new Date();
    if (hitPointsNeedNormalization) changes.push({ field: "Punti ferita", before: String(current.data.puntiFerita ?? "—") || "—", after: previous.puntiFerita });
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
    const onlyHitPointsRepair = hitPointsNeedNormalization && !manualChangesExist && !appuntiChanged && bundleReceipts.length === 0 && !hasRemovedBonus && current.name === cleanName;
    const dataToSave = onlyHitPointsRepair ? { ...current.data, puntiFerita: previous.puntiFerita } : normalized;
    await tx.update(characters).set({ name: cleanName, data: dataToSave, updatedAt: now }).where(eq(characters.id, id));
    if (changes.length) {
      const [recent] = await tx.select({ id: characterHistory.id, occurredAt: characterHistory.occurredAt, changes: characterHistory.changes })
        .from(characterHistory)
        .where(eq(characterHistory.characterId, id))
        .orderBy(desc(characterHistory.occurredAt), desc(characterHistory.id))
        .limit(1);
      const elapsed = recent ? now.getTime() - historyTimestampMs(Number(recent.occurredAt)) : Infinity;
      if (recent && elapsed >= 0 && elapsed <= 15_000) {
        const combined = coalesceHistoryChanges(recent.changes, changes);
        if (combined.length) {
          await tx.update(characterHistory).set({ occurredAt: now, changes: combined }).where(eq(characterHistory.id, recent.id));
        } else {
          await tx.delete(characterHistory).where(eq(characterHistory.id, recent.id));
        }
      } else {
        await tx.insert(characterHistory).values({ id: randomUUID(), characterId: id, occurredAt: now, changes });
      }
    }
    return { ok: true };
  });
  if (!result.ok) return result;
  revalidatePath(`/personaggio/${id}`);
  revalidatePath("/");
  return result;
}

export async function addCharacterEquipment(
  id: string,
  input: { catalogId?: string; nome?: string; quantita: number; dettaglio?: string },
): Promise<{ ok: boolean; error?: string }> {
  const quantity = Number(input.quantita);
  const catalogItem = input.catalogId ? gearById(input.catalogId) : undefined;
  const name = (catalogItem?.name ?? input.nome ?? "").trim();
  if (input.catalogId && !catalogItem) return { ok: false, error: "Oggetto non valido." };
  if (!name) return { ok: false, error: "Inserisci il nome dell'oggetto." };
  if (!Number.isSafeInteger(quantity) || quantity < 1) return { ok: false, error: "La quantità deve essere un intero maggiore di zero." };
  if (catalogItem?.contents?.length) return { ok: false, error: "Le dotazioni complete si aggiungono dalla pagina Equipaggiamento." };

  const result = await db.transaction(async (tx) => {
    const [row] = await tx.select().from(characters).where(eq(characters.id, id));
    if (!row) return { ok: false, error: "Personaggio non trovato." };
    const previous = normalizeSheet(row.data);
    const now = new Date();
    const normalized = normalizeSheet({
      ...previous,
      equipaggiamento: [...previous.equipaggiamento, {
        nome: name,
        quantita: String(quantity),
        dettaglio: input.dettaglio?.trim() ?? "",
        ...(catalogItem ? { catalogId: catalogItem.id } : {}),
      }],
    });
    const changes = diffManualSheet(previous, normalized);
    const acquisitions = equipmentAcquisitions(previous.equipaggiamento, normalized.equipaggiamento);
    if (acquisitions.length) {
      normalized.eventiStoria = [...(previous.eventiStoria ?? []), {
        capitolo: "Dotazioni ricevute",
        titolo: "Equipaggiamento aggiunto",
        dettagli: acquisitions,
        data: now.toISOString(),
      }];
    }
    await tx.update(characters).set({ data: normalized, updatedAt: now }).where(eq(characters.id, id));
    if (changes.length) {
      const [recent] = await tx.select({ id: characterHistory.id, occurredAt: characterHistory.occurredAt, changes: characterHistory.changes })
        .from(characterHistory)
        .where(eq(characterHistory.characterId, id))
        .orderBy(desc(characterHistory.occurredAt), desc(characterHistory.id))
        .limit(1);
      const elapsed = recent ? now.getTime() - historyTimestampMs(Number(recent.occurredAt)) : Infinity;
      if (recent && elapsed >= 0 && elapsed <= 15_000) {
        const combined = coalesceHistoryChanges(recent.changes, changes);
        if (combined.length) await tx.update(characterHistory).set({ occurredAt: now, changes: combined }).where(eq(characterHistory.id, recent.id));
        else await tx.delete(characterHistory).where(eq(characterHistory.id, recent.id));
      } else {
        await tx.insert(characterHistory).values({ id: randomUUID(), characterId: id, occurredAt: now, changes });
      }
    }
    return { ok: true };
  });
  if (result.ok) {
    revalidatePath(`/personaggio/${id}`);
    revalidatePath("/");
  }
  return result;
}

export async function changeCharacterCoins(
  id: string,
  operation: { kind: "set"; coins: Sheet["monete"] } | { kind: "pay"; amount: number; denomination: keyof Sheet["monete"] },
): Promise<{ ok: boolean; error?: string; coins?: Sheet["monete"] }> {
  const result = await db.transaction(async (tx) => {
    const [row] = await tx.select().from(characters).where(eq(characters.id, id));
    if (!row) return { ok: false, error: "Personaggio non trovato." };
    const previous = normalizeSheet(row.data);
    let coins: Sheet["monete"] | null;
    if (operation.kind === "pay") {
      coins = payCoins(previous.monete, operation.amount, operation.denomination);
      if (!coins) return { ok: false, error: "Monete insufficienti o importo non valido." };
    } else {
      const keys: (keyof Sheet["monete"])[] = ["rame", "argento", "electrum", "oro", "platino"];
      if (keys.some((key) => !/^\d+$/.test(operation.coins[key]) || !Number.isSafeInteger(Number(operation.coins[key])))) {
        return { ok: false, error: "Quantità di monete non valida." };
      }
      coins = Object.fromEntries(keys.map((key) => [key, String(Number(operation.coins[key]))])) as Sheet["monete"];
    }
    const normalized = normalizeSheet({ ...previous, monete: coins });
    const changes = diffManualSheet(previous, normalized);
    if (!changes.length) return { ok: true, coins: normalized.monete };
    const now = new Date();
    await tx.update(characters).set({ data: normalized, updatedAt: now }).where(eq(characters.id, id));
    const [recent] = await tx.select({ id: characterHistory.id, occurredAt: characterHistory.occurredAt, changes: characterHistory.changes })
      .from(characterHistory)
      .where(eq(characterHistory.characterId, id))
      .orderBy(desc(characterHistory.occurredAt), desc(characterHistory.id))
      .limit(1);
    const elapsed = recent ? now.getTime() - historyTimestampMs(Number(recent.occurredAt)) : Infinity;
    if (recent && elapsed >= 0 && elapsed <= 15_000) {
      const combined = coalesceHistoryChanges(recent.changes, changes);
      if (combined.length) await tx.update(characterHistory).set({ occurredAt: now, changes: combined }).where(eq(characterHistory.id, recent.id));
      else await tx.delete(characterHistory).where(eq(characterHistory.id, recent.id));
    } else {
      await tx.insert(characterHistory).values({ id: randomUUID(), characterId: id, occurredAt: now, changes });
    }
    return { ok: true, coins: normalized.monete };
  });
  if (result.ok) {
    revalidatePath(`/personaggio/${id}`);
    revalidatePath("/");
  }
  return result;
}
