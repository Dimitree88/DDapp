import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters, creatures, masterSessionCreatures, masterSessionEvents, masterSessionParticipants, masterSessions } from "@/lib/db/schema";
import { closeMasterSession, createMasterSession } from "./actions";
import { MasterCharacterCard, MasterCreatureCard, RestPanel } from "./MasterControls";

export const dynamic = "force-dynamic";

const dateLabel = (date: string) => new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
const timeLabel = (date: Date) => new Intl.DateTimeFormat("it-IT", { timeStyle: "short" }).format(date);
const eventLabel = (type: string) => ({
  sessione_creata: "Sessione creata", partecipanti_aggiornati: "Partecipanti aggiornati", sessione_chiusa: "Sessione chiusa",
  riposo_breve_gruppo: "Riposo breve del gruppo", riposo_lungo_gruppo: "Riposo lungo del gruppo",
  creatura_danni: "Danni alla creatura", creatura_guarigione: "Creatura guarita", "creatura_pf-registra": "PF della creatura registrati",
  danni: "Danni subiti", guarigione: "PF recuperati", "pf-registra": "PF registrati", "pf-temporanei": "PF temporanei aggiornati",
  "ispirazione-conferisci": "Ispirazione eroica conferita", "ispirazione-spendi": "Ispirazione eroica spesa",
  "condizione-aggiungi": "Condizione aggiunta", "condizione-rimuovi": "Condizione rimossa",
  "risorsa-usa": "Risorsa usata", "slot-usa": "Slot usato", "tiro-morte": "Tiro salvezza contro morte",
  stabilizza: "Personaggio stabilizzato", "indebolimento-registra": "Indebolimento registrato", "indebolimento-su": "Indebolimento aumentato", "indebolimento-giu": "Indebolimento ridotto",
  "concentrazione-imposta": "Concentrazione registrata", "concentrazione-termina": "Concentrazione terminata",
}[type] ?? type.replaceAll("_", " "));

export default async function MasterPage({ searchParams }: { searchParams?: Promise<{ errore?: string; chiusa?: string }> }) {
  const query = searchParams ? await searchParams : {};
  const [people, creatureList, openSessions, closedSessions, events] = await Promise.all([
    db.select({ id: characters.id, name: characters.name, data: characters.data }).from(characters).orderBy(asc(characters.name)),
    db.select({ id: creatures.id, name: creatures.name, data: creatures.data }).from(creatures).orderBy(asc(creatures.name)),
    db.select().from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1),
    db.select().from(masterSessions).where(eq(masterSessions.status, "chiusa")).orderBy(desc(masterSessions.closedAt)),
    db.select().from(masterSessionEvents).orderBy(desc(masterSessionEvents.occurredAt)),
  ]);
  const active = openSessions[0];
  const activeParticipantRows = active ? await db.select({ characterId: masterSessionParticipants.characterId }).from(masterSessionParticipants).where(eq(masterSessionParticipants.sessionId, active.id)) : [];
  const activeParticipantIds = new Set(activeParticipantRows.map(({ characterId }) => characterId));
  const activeCreatureRows = active ? await db.select({ creatureId: masterSessionCreatures.creatureId }).from(masterSessionCreatures).where(eq(masterSessionCreatures.sessionId, active.id)) : [];
  const activeCreatureIds = new Set(activeCreatureRows.map(({ creatureId }) => creatureId));
  const party = people.filter((person) => activeParticipantIds.has(person.id));
  const selectedCreatures = creatureList.filter((creature) => activeCreatureIds.has(creature.id));
  const restCharacters = party.map((person) => ({ ...person, isSessionParticipant: true }));
  const restCreatures = selectedCreatures.map((creature) => ({ ...creature, isSessionParticipant: true }));

  return <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
    <header className="flex items-center"><Link href="/" aria-label="Torna alla home" className="flex min-h-11 items-center gap-1.5 text-left text-ink"><span className="text-lg leading-none text-ink-soft" aria-hidden>⌂</span><h1 className="text-base font-bold">Master</h1></Link></header>
    {query.errore && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">{query.errore}</p>}
    {active ? <section className="rounded-2xl border border-accent/50 bg-card p-4 shadow-sm sm:p-6" aria-labelledby="active-session-title">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wide text-accent">Sessione aperta</p><h2 id="active-session-title" className="mt-1 text-xl font-bold text-ink">{active.name}</h2><p className="text-sm text-ink-soft">{dateLabel(active.localDate)}</p></div><form action={closeMasterSession}><input type="hidden" name="sessionId" value={active.id} /><button className="min-h-11 rounded-xl border border-line px-4 font-semibold text-ink">Chiudi Sessione</button></form></div>
      <section className="mt-5 border-t border-line pt-4"><h3 className="mb-3 font-semibold text-ink">Riposi</h3><div className="grid gap-3 sm:grid-cols-2"><RestPanel sessionId={active.id} kind="breve" characters={restCharacters} creatures={restCreatures} /><RestPanel sessionId={active.id} kind="lungo" characters={restCharacters} creatures={restCreatures} /></div></section>
      {party.length > 0 && <section className="mt-5 border-t border-line pt-4"><h3 className="mb-3 font-semibold text-ink">Personaggi</h3><div className="grid gap-3 sm:grid-cols-2">{party.map((person) => <MasterCharacterCard key={person.id} sessionId={active.id} character={person} party={party} canAct />)}</div></section>}
      {selectedCreatures.length > 0 && <section className="mt-5 border-t border-line pt-4"><h3 className="mb-3 font-semibold text-ink">Creature</h3><div className="grid gap-3 sm:grid-cols-2">{selectedCreatures.map((creature) => <MasterCreatureCard key={creature.id} sessionId={active.id} creature={creature} canAct />)}</div></section>}
      <section className="mt-5 border-t border-line pt-4" aria-labelledby="events-title"><h3 id="events-title" className="font-semibold text-ink">Eventi</h3><ol className="mt-2 flex flex-col gap-2">{events.filter((event) => event.sessionId === active.id).map((event) => {
        const payload = event.payload as Record<string, unknown>;
        const actorName = event.characterId ? people.find((person) => person.id === event.characterId)?.name : event.creatureId ? creatureList.find((creature) => creature.id === event.creatureId)?.name : typeof payload.participantName === "string" ? payload.participantName : "";
        const targetName = typeof payload.targetId === "string" ? people.find((person) => person.id === payload.targetId)?.name : "";
        const title = typeof payload.title === "string" ? payload.title : event.type === "partecipante_modificato" ? `${payload.selected ? "Aggiunto" : "Rimosso"} dalla Sessione` : eventLabel(event.type);
        const details = Array.isArray(payload.details) ? payload.details.filter((detail): detail is string => typeof detail === "string" && detail.length > 0) : [];
        const changes = Array.isArray(payload.changes) ? payload.changes.filter((change): change is { field: string; before: string; after: string } => Boolean(change && typeof change === "object" && "field" in change && typeof change.field === "string" && "before" in change && typeof change.before === "string" && "after" in change && typeof change.after === "string")) : [];
        const participants = Array.isArray(payload.participants) ? payload.participants.filter((item): item is { name: string; details: string[] } => Boolean(item && typeof item === "object" && "name" in item && typeof item.name === "string")) : [];
        const targetChanges = Array.isArray(payload.targetChanges) ? payload.targetChanges.filter((change): change is { field: string; before: string; after: string } => Boolean(change && typeof change === "object" && "field" in change && typeof change.field === "string" && "before" in change && typeof change.before === "string" && "after" in change && typeof change.after === "string")) : [];
        const before = payload.before as { hitPointsCurrent?: unknown } | undefined;
        const after = payload.after as { hitPointsCurrent?: unknown } | undefined;
        const creatureHpChange = Number.isInteger(before?.hitPointsCurrent) && Number.isInteger(after?.hitPointsCurrent) && before?.hitPointsCurrent !== after?.hitPointsCurrent ? `PF creatura: ${before?.hitPointsCurrent} → ${after?.hitPointsCurrent}` : "";
        const note = typeof payload.note === "string" ? payload.note : "";
        return <li key={event.id} className="rounded-lg bg-card/70 px-3 py-2 text-sm text-ink"><time className="mr-2 text-ink-soft">{timeLabel(event.occurredAt)}</time><strong>{title}</strong>{actorName && <span> · {actorName}</span>}{targetName && <span> → {targetName}</span>}{details.length > 0 && <ul className="mt-1 list-inside list-disc text-ink-soft">{details.map((detail, index) => <li key={index}>{detail}</li>)}</ul>}{creatureHpChange && <p className="mt-1 text-ink-soft">{creatureHpChange}</p>}{note && <p className="mt-1 text-ink-soft">{note}</p>}{changes.length > 0 && <ul className="mt-1 list-inside list-disc text-ink-soft">{changes.map((change, index) => <li key={index}>{change.field}: {change.before} → {change.after}</li>)}</ul>}{targetChanges.map((change, index) => <p key={`target-${index}`} className="ml-3 text-ink-soft">{targetName || "Destinatario"} · {change.field}: {change.before} → {change.after}</p>)}{participants.map((participant, index) => <p key={index} className="mt-1 text-ink-soft"><strong>{participant.name}</strong>{Array.isArray(participant.details) && participant.details.length ? ` · ${participant.details.join("; ")}` : ""}</p>)}</li>;
      })}</ol></section>
    </section> : <details className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-6"><summary className="min-h-12 cursor-pointer list-none rounded-xl bg-accent px-4 py-3 text-center font-bold text-white">Nuova sessione</summary><form action={createMasterSession} className="mt-5"><label htmlFor="session-name" className="mb-2 block font-semibold text-ink">Nome della Sessione</label><input id="session-name" name="name" required maxLength={120} className="min-h-12 w-full rounded-xl border border-line bg-white px-3 text-base text-ink" /><fieldset className="mt-5"><legend className="mb-3 font-semibold text-ink">Personaggi partecipanti</legend><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{people.map((person) => <label key={person.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 py-2 text-ink"><input type="checkbox" name="participant" value={person.id} defaultChecked className="size-5 accent-accent" /><span>{person.name}</span></label>)}</div>{creatureList.length > 0 && <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{creatureList.map((creature) => <label key={creature.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 py-2 text-ink"><input type="checkbox" name="creature" value={creature.id} defaultChecked className="size-5 accent-accent" /><span>{creature.name} <span className="text-xs text-ink-soft">(creatura)</span></span></label>)}</div>}{!people.length && <p className="text-sm text-ink-soft">Nessun personaggio: la Sessione può essere creata e aggiornata in seguito.</p>}</fieldset><button className="mt-5 min-h-12 w-full rounded-xl bg-accent px-4 font-bold text-white">Crea Sessione</button></form></details>}
    <section aria-labelledby="archive-title"><h2 id="archive-title" className="mb-3 text-lg font-bold text-ink">Sessioni concluse</h2>{closedSessions.length ? <ul className="flex flex-col gap-2">{closedSessions.map((session) => <li key={session.id} className="rounded-xl border border-line bg-card/70 px-4 py-3"><details open={query.chiusa === session.id}><summary className="flex cursor-pointer list-none items-center justify-between gap-3"><span><span className="block font-semibold text-ink">{session.name}</span><span className="text-sm text-ink-soft">{dateLabel(session.localDate)}</span></span><span className="shrink-0 text-sm text-ink-soft">Chiusa</span></summary><ol className="mt-3 flex flex-col gap-2 border-t border-line pt-3">{events.filter((event) => event.sessionId === session.id).map((event) => {
      const payload = event.payload as Record<string, unknown>;
      const name = event.characterId ? people.find((person) => person.id === event.characterId)?.name : event.creatureId ? creatureList.find((creature) => creature.id === event.creatureId)?.name : typeof payload.participantName === "string" ? payload.participantName : "";
      const title = typeof payload.title === "string" ? payload.title : eventLabel(event.type);
      const details = Array.isArray(payload.details) ? payload.details.filter((detail): detail is string => typeof detail === "string") : [];
      const changes = Array.isArray(payload.changes) ? payload.changes.filter((change): change is { field: string; before: string; after: string } => Boolean(change && typeof change === "object" && "field" in change && typeof change.field === "string" && "before" in change && typeof change.before === "string" && "after" in change && typeof change.after === "string")) : [];
      const closedParticipants = Array.isArray(payload.participants) ? payload.participants.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && "name" in item && typeof item.name === "string")) : [];
      const closedCreatures = Array.isArray(payload.creatures) ? payload.creatures.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && "name" in item && typeof item.name === "string")) : [];
      return <li key={event.id} className="text-sm text-ink"><time className="mr-2 text-ink-soft">{new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(event.occurredAt)}</time><strong>{title}</strong>{name && <span> · {name}</span>}{details.map((detail, index) => <p key={`detail-${index}`} className="ml-4 text-ink-soft">{detail}</p>)}{changes.map((change, index) => <p key={`change-${index}`} className="ml-4 text-ink-soft">{change.field}: {change.before} → {change.after}</p>)}{event.type === "sessione_chiusa" && <details open={query.chiusa === session.id} className="mt-2 rounded-lg border border-line p-3"><summary className="cursor-pointer font-semibold text-accent">Riepilogo finale della Sessione</summary><div className="mt-3 flex flex-col gap-3">{closedParticipants.map((participant, index) => {
        const current = participant.current && typeof participant.current === "object" ? participant.current as Record<string, unknown> : {};
        const states = Array.isArray(participant.statiAttivi) ? participant.statiAttivi.filter((item): item is string => typeof item === "string") : [];
        const missing = Array.isArray(participant.datiMancanti) ? participant.datiMancanti.filter((item): item is string => typeof item === "string") : [];
        const modifications = Array.isArray(participant.modificheSessione) ? participant.modificheSessione.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];
        return <article key={index} className="rounded-lg bg-white p-3"><h4 className="font-semibold">{String(participant.name)}</h4><p className="text-ink-soft">PF {String(current.puntiFerita ?? "da registrare")}/{String(current.puntiFeritaMax ?? "da registrare")} · CA {String(current.classeArmatura ?? "da registrare")}</p><p className="mt-1">Stati attivi: {states.length ? states.join(", ") : "nessuno registrato"}</p><p className="mt-1">Dati mancanti: {missing.length ? missing.join(", ") : "nessuno"}</p>{modifications.length > 0 && <ul className="mt-1 list-inside list-disc text-ink-soft">{modifications.map((modification, changeIndex) => {
          const deltas = Array.isArray(modification.changes) ? modification.changes.filter((change): change is Record<string, unknown> => Boolean(change && typeof change === "object")) : [];
          return <li key={changeIndex}>{String(modification.action ?? "Azione")}{Array.isArray(modification.details) && modification.details.length ? ` — ${(modification.details as unknown[]).map(String).join("; ")}` : ""}{deltas.map((delta, deltaIndex) => <p key={deltaIndex} className="ml-4">{String(delta.field)}: {String(delta.before)} → {String(delta.after)}</p>)}</li>;
        })}</ul>}</article>;
      })}{closedCreatures.map((creature, index) => {
        const current = creature.current && typeof creature.current === "object" ? creature.current as Record<string, unknown> : {};
        const modifications = Array.isArray(creature.modificheSessione) ? creature.modificheSessione.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];
        return <article key={`creature-${index}`} className="rounded-lg bg-white p-3"><h4 className="font-semibold">{String(creature.name)} · creatura</h4><p className="text-ink-soft">PF {String(current.puntiFerita ?? "da registrare")}/{String(current.puntiFeritaMax ?? "da registrare")} · CA {String(current.classeArmatura ?? "da registrare")}</p>{modifications.map((modification, changeIndex) => <p key={changeIndex} className="text-ink-soft">{String(modification.action ?? "Azione")}{Array.isArray(modification.details) && modification.details.length ? ` — ${(modification.details as unknown[]).map(String).join("; ")}` : ""}</p>)}</article>;
      })}</div></details>}</li>;
    })}</ol></details></li>)}</ul> : <p className="rounded-xl border border-line bg-card/60 px-4 py-5 text-sm text-ink-soft">Nessuna Sessione archiviata.</p>}</section>
  </main>;
}
