import dotenv from "dotenv";
import { createClient } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { normalizeSheet } from "../lib/sheet.ts";
import { gearById, gearByName } from "../lib/gearCatalog.ts";

dotenv.config({ path: ".env.local", quiet: true });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL non impostata");
const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN });
const apply = process.argv.includes("--apply");
const [characters, histories] = await Promise.all([
  client.execute("SELECT id, name, data, created_at FROM characters"),
  client.execute("SELECT id, character_id, occurred_at, changes FROM character_history ORDER BY occurred_at"),
]);
const historyByCharacter = new Map();
for (const entry of histories.rows) {
  const list = historyByCharacter.get(String(entry.character_id)) ?? [];
  list.push({ ...entry, changes: JSON.parse(String(entry.changes)) });
  historyByCharacter.set(String(entry.character_id), list);
}
const plans = [];
for (const row of characters.rows) {
  const original = String(row.data);
  const sheet = JSON.parse(original);
  const packs = new Map();
  for (const item of sheet.equipaggiamento ?? []) {
    const gear = gearById(item.catalogId ?? "") ?? gearByName(item.nome);
    if (gear?.contents?.length) packs.set(gear.name, gear);
    const source = gearByName(item.dettaglio ?? "");
    if (source?.contents?.length) packs.set(source.name, source);
  }
  for (const entry of historyByCharacter.get(String(row.id)) ?? []) {
    for (const change of entry.changes) {
      if (change.field !== "Equipaggiamento · aggiunta") continue;
      try {
        const added = JSON.parse(change.after);
        const gear = gearById(added.catalogId ?? "") ?? gearByName(added.nome);
        if (gear?.contents?.length) packs.set(gear.name, gear);
      } catch { /* Le vecchie voci possono contenere testo non JSON. */ }
    }
  }
  const cleaned = normalizeSheet(sheet);
  const history = historyByCharacter.get(String(row.id)) ?? [];
  const historyUpdates = [];
  const newHistory = [];
  for (const pack of packs.values()) {
    const receipt = {
      field: `Dotazione ricevuta · ${pack.name}`,
      before: "",
      after: "",
      items: pack.contents.map(({ name, quantity }) => `${name}${quantity && quantity > 1 ? ` ×${quantity}` : ""}`),
    };
    const matchingOriginEntry = history.find((entry) => entry.changes.some((change) =>
      change.field === "Equipaggiamento · aggiunta" && change.after.includes(`\"nome\": \"${pack.name}\"`)));
    const existingReceipt = history.some((entry) => entry.changes.some((change) => change.field === receipt.field));
    if (existingReceipt) {
      if (matchingOriginEntry) {
        historyUpdates.push({ id: String(matchingOriginEntry.id), changes: matchingOriginEntry.changes.filter((change) =>
          !(change.field === "Equipaggiamento · aggiunta" && change.after.includes(`\"nome\": \"${pack.name}\"`))) });
      }
      continue;
    }
    if (matchingOriginEntry) {
      historyUpdates.push({ id: String(matchingOriginEntry.id), changes: [
        ...matchingOriginEntry.changes.filter((change) => !(change.field === "Equipaggiamento · aggiunta" && change.after.includes(`\"nome\": \"${pack.name}\"`))),
        receipt,
      ] });
    } else {
      newHistory.push({ id: randomUUID(), characterId: String(row.id), occurredAt: Number(row.created_at), changes: [{
        ...receipt,
        field: `Creazione personaggio · ${receipt.field}`,
      }] });
    }
  }
  if (!isDeepStrictEqual(cleaned, sheet) || historyUpdates.length || newHistory.length) {
    plans.push({ id: String(row.id), name: String(row.name), original, cleaned, createdAt: Number(row.created_at), historyUpdates, newHistory });
  }
}
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", target: new URL(process.env.DATABASE_URL).host,
  characters: plans.map(({ id, name, cleaned, historyUpdates, newHistory }) => ({
    id, name,
    equipment: cleaned.equipaggiamento,
    historyUpdates: historyUpdates.map(({ id: historyId }) => historyId),
    newHistory: newHistory.map(({ changes }) => changes),
  })) }, null, 2));
if (!apply || plans.length === 0) process.exit(0);

const backupDir = path.join(process.cwd(), ".db-backups");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `equipment-bundles-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
await writeFile(backupPath, JSON.stringify({ characters: plans.map(({ id, name, original }) => ({ id, name, data: JSON.parse(original) })),
  history: histories.rows.filter((row) => plans.some((plan) => plan.historyUpdates.some((entry) => entry.id === String(row.id)))) }, null, 2));
const tx = await client.transaction("write");
try {
  for (const plan of plans) {
    const current = await tx.execute({ sql: "SELECT data FROM characters WHERE id = ?", args: [plan.id] });
    if (current.rows.length !== 1 || String(current.rows[0].data) !== plan.original) throw new Error(`Scheda modificata durante la bonifica: ${plan.name}`);
    await tx.execute({ sql: "UPDATE characters SET data = ?, updated_at = ? WHERE id = ? AND data = ?",
      args: [JSON.stringify(plan.cleaned), Math.floor(Date.now() / 1000), plan.id, plan.original] });
    for (const entry of plan.historyUpdates) {
      await tx.execute({ sql: "UPDATE character_history SET changes = ? WHERE id = ?", args: [JSON.stringify(entry.changes), entry.id] });
    }
    for (const entry of plan.newHistory) {
      await tx.execute({ sql: "INSERT INTO character_history (id, character_id, occurred_at, changes) VALUES (?, ?, ?, ?)",
        args: [entry.id, entry.characterId, entry.occurredAt, JSON.stringify(entry.changes)] });
    }
  }
  await tx.commit();
  console.log(JSON.stringify({ applied: true, characters: plans.length, backupPath }));
} catch (error) {
  await tx.rollback();
  throw error;
}
