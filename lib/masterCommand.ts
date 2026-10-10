import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { characterHistory, characters, creatures, masterSessionCreatures, masterSessionEvents, masterSessionParticipants, masterSessions } from "./db/schema";
import { diffSheet, equipmentAcquisitions, type HistoryChange } from "./history";
import { normalizeCreature, type CreatureData } from "./creature";
import { sheetPatch, type SheetPatch } from "./masterView";
import { normalizeSheet, type EventoStoria, type Sheet } from "./sheet";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ActionResult =
  | { ok: true; eventId?: string; title?: string; details?: string[]; warnings?: string[]; id?: string }
  | { ok: false; error: string };

export type TargetChange =
  | { kind: "pg"; id: string; name: string; before: Sheet; after: Sheet }
  | { kind: "cr"; id: string; name: string; before: CreatureData; after: CreatureData; nameAfter?: string };

export type CommandOutcome = {
  type: string;
  title: string;
  details?: string[];
  warnings?: string[];
  targets: TargetChange[];
  undoable?: boolean;
  extra?: Record<string, unknown>;
};

export type UndoTarget =
  | { kind: "pg"; id: string; before: SheetPatch; after: SheetPatch }
  | { kind: "cr"; id: string; before: { name: string; data: CreatureData }; after: { name: string; data: CreatureData } };

export class UserError extends Error {}

export const fail = (message: string): never => { throw new UserError(message); };

export function errorResult(error: unknown): ActionResult {
  if (error instanceof UserError) return { ok: false, error: error.message };
  if (error instanceof Error && /UNIQUE constraint failed: master_sessions\.status|master_sessions_single_open_idx/.test(error.message)) {
    return { ok: false, error: "Esiste già una Sessione aperta: chiudila prima." };
  }
  if (error instanceof Error && error.message && !/SQLITE|LibsqlError|constraint/i.test(error.message)) return { ok: false, error: error.message };
  console.error(error);
  return { ok: false, error: "Operazione non riuscita. Riprova." };
}

export function requireCommandId(value: unknown): string {
  const id = String(value ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) fail("Comando non valido. Ricarica la pagina e riprova.");
  return id;
}

export function positiveInt(value: unknown, label: string, max = 100000): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0 || number > max) fail(`${label}: inserisci un intero maggiore di zero.`);
  return number;
}

export function nonNegativeInt(value: unknown, label: string, max = 1000000): number {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0 || number > max) fail(`${label}: inserisci un intero pari o superiore a zero.`);
  return number;
}

export const cleanText = (value: unknown, max = 300) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function requireOpenSession(tx: Tx, sessionId: string) {
  const [session] = await tx.select({ id: masterSessions.id, name: masterSessions.name }).from(masterSessions)
    .where(and(eq(masterSessions.id, sessionId), eq(masterSessions.status, "aperta"))).limit(1);
  if (!session) fail("La Sessione non è aperta.");
  return session!;
}

export async function loadParticipantCharacter(tx: Tx, sessionId: string, characterId: string) {
  const [member] = await tx.select({ id: masterSessionParticipants.characterId }).from(masterSessionParticipants)
    .where(and(eq(masterSessionParticipants.sessionId, sessionId), eq(masterSessionParticipants.characterId, characterId))).limit(1);
  if (!member) fail("Il personaggio non è tra i partecipanti della Sessione.");
  const [row] = await tx.select().from(characters).where(eq(characters.id, characterId)).limit(1);
  if (!row) fail("Personaggio non trovato.");
  return { id: row!.id, name: row!.name, sheet: normalizeSheet(row!.data) };
}

export async function loadParticipantCreature(tx: Tx, sessionId: string, creatureId: string) {
  const [member] = await tx.select({ id: masterSessionCreatures.creatureId }).from(masterSessionCreatures)
    .where(and(eq(masterSessionCreatures.sessionId, sessionId), eq(masterSessionCreatures.creatureId, creatureId))).limit(1);
  if (!member) fail("La creatura non è tra i partecipanti della Sessione.");
  const [row] = await tx.select().from(creatures).where(eq(creatures.id, creatureId)).limit(1);
  if (!row) fail("Creatura non trovata.");
  return { id: row!.id, name: row!.name, data: normalizeCreature(row!.data) };
}

export function storyEvent(sessionName: string, title: string, details: string[], date: Date): EventoStoria {
  return { capitolo: `Sessione: ${sessionName}`, titolo: title, dettagli: details, data: date.toISOString() };
}

const withoutStory = (sheet: Sheet) => { const copy = { ...sheet } as Partial<Sheet>; delete copy.eventiStoria; return copy; };

export async function storeCharacter(tx: Tx, id: string, before: Sheet, after: Sheet, now: Date, story?: EventoStoria) {
  const clean = normalizeSheet(story ? { ...after, eventiStoria: [...(after.eventiStoria ?? []), story] } : after);
  const acquisitions = equipmentAcquisitions(before.equipaggiamento, clean.equipaggiamento);
  if (acquisitions.length) clean.eventiStoria = [...(clean.eventiStoria ?? []), {
    capitolo: story?.capitolo ?? "Dotazioni ricevute",
    titolo: "Equipaggiamento ricevuto",
    dettagli: acquisitions,
    data: now.toISOString(),
  }];
  const changes = diffSheet(withoutStory(before), withoutStory(clean));
  if (changes.length) await tx.insert(characterHistory).values({ id: randomUUID(), characterId: id, occurredAt: now, changes });
  await tx.update(characters).set({ data: clean, updatedAt: now }).where(eq(characters.id, id));
  return { sheet: clean, changes };
}

export function creatureChanges(before: CreatureData, after: CreatureData): HistoryChange[] {
  return diffSheet(before as unknown as Partial<Sheet>, after as unknown as Partial<Sheet>);
}

// Esegue un comando della Sessione in una transazione: verifica Sessione e
// duplicati, salva schede/creature e registra un evento annullabile.
export async function runCommand(sessionId: string, commandId: string, body: (tx: Tx, session: { id: string; name: string }, now: Date) => Promise<CommandOutcome | null>): Promise<ActionResult> {
  try {
    const now = new Date();
    return await db.transaction(async (tx) => {
      const [duplicate] = await tx.select({ id: masterSessionEvents.id }).from(masterSessionEvents).where(eq(masterSessionEvents.id, commandId)).limit(1);
      if (duplicate) return { ok: true, eventId: commandId } as ActionResult;
      const session = await requireOpenSession(tx, sessionId);
      const outcome = await body(tx, session, now);
      if (!outcome) return { ok: true } as ActionResult;
      const details = outcome.details ?? [];
      const targets: { kind: "pg" | "cr"; id: string; name: string; changes: HistoryChange[] }[] = [];
      const undo: UndoTarget[] = [];
      for (const target of outcome.targets) {
        if (target.kind === "pg") {
          const stored = await storeCharacter(tx, target.id, target.before, target.after, now, storyEvent(session.name, outcome.title, [...details, ...(outcome.warnings ?? [])], now));
          targets.push({ kind: "pg", id: target.id, name: target.name, changes: stored.changes });
          undo.push({ kind: "pg", id: target.id, before: sheetPatch(target.before), after: sheetPatch(stored.sheet) });
        } else {
          const after = normalizeCreature(target.after);
          const name = target.nameAfter ?? target.name;
          await tx.update(creatures).set({ name, data: after, updatedAt: now }).where(eq(creatures.id, target.id));
          targets.push({ kind: "cr", id: target.id, name, changes: creatureChanges(target.before, after) });
          undo.push({ kind: "cr", id: target.id, before: { name: target.name, data: target.before }, after: { name, data: after } });
        }
      }
      const single = outcome.targets.length === 1 ? outcome.targets[0] : null;
      await tx.insert(masterSessionEvents).values({
        id: commandId, sessionId, type: outcome.type, occurredAt: now,
        characterId: single?.kind === "pg" ? single.id : null,
        creatureId: single?.kind === "cr" ? single.id : null,
        payload: {
          title: outcome.title, details, warnings: outcome.warnings ?? [],
          ...(single?.kind === "pg" ? { characterName: single.name } : single?.kind === "cr" ? { creatureName: single.name } : {}),
          changes: targets.length === 1 ? targets[0].changes : [],
          targets,
          ...(outcome.undoable === false || !undo.length ? {} : { undo: { targets: undo } }),
          ...outcome.extra,
        },
      });
      return { ok: true, eventId: commandId, title: outcome.title, details, warnings: outcome.warnings ?? [] } as ActionResult;
    });
  } catch (error) {
    return errorResult(error);
  }
}
