import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters, creatures, masterSessionCreatures, masterSessionEvents, masterSessionParticipants, masterSessions } from "@/lib/db/schema";
import { describeEvents } from "@/lib/masterEvents";
import { characterView, creatureView } from "@/lib/masterView";
import { MasterApp } from "./_components/MasterApp";
import type { MasterData } from "./_components/types";

export const dynamic = "force-dynamic";

export default async function MasterPage() {
  const [[active], closedRows, characterRows, creatureRows] = await Promise.all([
    db.select().from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1),
    db.select({ id: masterSessions.id, name: masterSessions.name, localDate: masterSessions.localDate, closedAt: masterSessions.closedAt })
      .from(masterSessions).where(eq(masterSessions.status, "chiusa")).orderBy(desc(masterSessions.closedAt)),
    db.select({ id: characters.id, name: characters.name }).from(characters).orderBy(asc(characters.name)),
    db.select({ id: creatures.id, name: creatures.name, data: creatures.data }).from(creatures).orderBy(asc(creatures.name)),
  ]);
  const creaturesAll = creatureRows.map((row) => creatureView(row.id, row.name, row.data));
  // La libreria mostra i modelli; gli esemplari dei combattimenti restano nella Sessione.
  const library = creaturesAll.filter((creature) => !creature.data.esemplare);
  const data: MasterData = {
    session: null, party: [], foes: [], events: [],
    allCharacters: characterRows,
    library,
    closed: closedRows.map((row) => ({ id: row.id, name: row.name, localDate: row.localDate, closedAt: row.closedAt?.toISOString() ?? null })),
  };
  if (active) {
    const [participantRows, foeRows, eventRows] = await Promise.all([
      db.select({ id: masterSessionParticipants.characterId }).from(masterSessionParticipants).where(eq(masterSessionParticipants.sessionId, active.id)),
      db.select({ id: masterSessionCreatures.creatureId }).from(masterSessionCreatures).where(eq(masterSessionCreatures.sessionId, active.id)),
      db.select().from(masterSessionEvents).where(eq(masterSessionEvents.sessionId, active.id)).orderBy(desc(masterSessionEvents.occurredAt)),
    ]);
    const partyIds = participantRows.map((row) => row.id);
    const partyRows = partyIds.length ? await db.select({ id: characters.id, name: characters.name, data: characters.data }).from(characters).where(inArray(characters.id, partyIds)).orderBy(asc(characters.name)) : [];
    const foeIds = new Set(foeRows.map((row) => row.id));
    data.session = { id: active.id, name: active.name, localDate: active.localDate, notes: active.notes, encounter: active.encounter ?? null };
    data.party = partyRows.map((row) => characterView(row.id, row.name, row.data));
    data.foes = creaturesAll.filter((creature) => foeIds.has(creature.id));
    const names = new Map([...characterRows, ...creatureRows].map((row) => [row.id, row.name]));
    data.events = describeEvents(eventRows, names);
  }
  return <MasterApp data={data} />;
}
