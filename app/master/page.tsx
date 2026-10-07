import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters, masterSessionEvents, masterSessionParticipants, masterSessions } from "@/lib/db/schema";
import { closeMasterSession, createMasterSession, saveMasterParticipants } from "./actions";

export const dynamic = "force-dynamic";

const dateLabel = (date: string) => new Intl.DateTimeFormat("it-IT", {
  dateStyle: "long", timeZone: "UTC",
}).format(new Date(`${date}T12:00:00Z`));

export default async function MasterPage() {
  const [people, openSessions, closedSessions, events] = await Promise.all([
    db.select({ id: characters.id, name: characters.name, data: characters.data }).from(characters).orderBy(asc(characters.name)),
    db.select().from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1),
    db.select().from(masterSessions).where(eq(masterSessions.status, "chiusa")).orderBy(desc(masterSessions.closedAt)),
    db.select().from(masterSessionEvents).orderBy(asc(masterSessionEvents.occurredAt)),
  ]);
  const active = openSessions[0];
  const activeParticipantRows = active
    ? await db.select({ characterId: masterSessionParticipants.characterId }).from(masterSessionParticipants)
      .where(eq(masterSessionParticipants.sessionId, active.id))
    : [];
  const activeParticipantIds = new Set(activeParticipantRows.map(({ characterId }) => characterId));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex items-center gap-3">
        <Link href="/" aria-label="Torna alla home" className="grid size-11 place-items-center rounded-xl border border-line bg-card text-xl text-ink">‹</Link>
        <div>
          <p className="text-sm text-ink-soft">Pannello operativo</p>
          <h1 className="text-2xl font-bold text-ink">Master</h1>
        </div>
      </header>

      {active ? (
        <section className="rounded-2xl border border-accent/50 bg-card p-4 shadow-sm sm:p-6" aria-labelledby="active-session-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent">Sessione aperta</p>
              <h2 id="active-session-title" className="mt-1 text-xl font-bold text-ink">{active.name}</h2>
              <p className="text-sm text-ink-soft">{dateLabel(active.localDate)}</p>
            </div>
            <form action={closeMasterSession}>
              <input type="hidden" name="sessionId" value={active.id} />
              <button className="min-h-11 rounded-xl border border-line px-4 font-semibold text-ink">Chiudi Sessione</button>
            </form>
          </div>
          <form action={saveMasterParticipants} className="mt-5 border-t border-line pt-4">
            <input type="hidden" name="sessionId" value={active.id} />
            <fieldset>
              <legend className="mb-3 font-semibold text-ink">Partecipanti</legend>
              {people.length ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {people.map((person) => (
                  <label key={person.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 py-2 text-ink">
                    <input type="checkbox" name="participant" value={person.id} defaultChecked={activeParticipantIds.has(person.id)} className="size-5 accent-accent" />
                    <span>{person.name}</span>
                  </label>
                ))}
              </div> : <p className="text-sm text-ink-soft">Nessun personaggio disponibile.</p>}
            </fieldset>
            <button className="mt-4 min-h-11 w-full rounded-xl bg-accent px-4 font-bold text-white">Salva partecipanti</button>
          </form>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {people.map((person) => {
              const data = person.data;
              return <article key={person.id} className="rounded-xl border border-line bg-card/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-ink">{person.name}</h3>
                    <p className="text-sm text-ink-soft">{data.classe || "Classe da registrare"} · livello {data.livello || "—"}</p>
                  </div>
                  {activeParticipantIds.has(person.id) && <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">Partecipa</span>}
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-ink">
                  <span>PF <strong>{data.puntiFerita || "da registrare"}</strong> / {data.puntiFeritaMax || "da registrare"}</span>
                  <span>CA <strong>{data.classeArmatura ?? "da registrare"}</strong></span>
                </div>
                <Link href={`/personaggio/${person.id}`} className="mt-3 inline-block min-h-10 pt-2 text-sm font-semibold text-accent">Apri scheda ›</Link>
              </article>;
            })}
          </div>
          <section className="mt-5 border-t border-line pt-4" aria-labelledby="events-title">
            <h3 id="events-title" className="font-semibold text-ink">Eventi</h3>
            <ol className="mt-2 flex flex-col gap-2">
              {events.filter((event) => event.sessionId === active.id).map((event) => (
                <li key={event.id} className="rounded-lg bg-card/70 px-3 py-2 text-sm text-ink">
                  <time className="mr-2 text-ink-soft">{new Intl.DateTimeFormat("it-IT", { timeStyle: "short" }).format(event.occurredAt)}</time>
                  {event.type === "sessione_creata" ? "Sessione creata" : event.type === "partecipanti_aggiornati" ? "Partecipanti aggiornati" : event.type}
                </li>
              ))}
            </ol>
          </section>
        </section>
      ) : (
        <section className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-6" aria-labelledby="new-session-title">
          <h2 id="new-session-title" className="text-xl font-bold text-ink">Nuova Sessione</h2>
          <p className="mt-1 text-sm text-ink-soft">La data viene fissata automaticamente al momento della creazione. Puoi modificare i partecipanti finché la Sessione è aperta.</p>
          <form action={createMasterSession} className="mt-5">
            <label htmlFor="session-name" className="mb-2 block font-semibold text-ink">Nome della Sessione</label>
            <input id="session-name" name="name" required maxLength={120} placeholder="Es. La torre sommersa" className="min-h-12 w-full rounded-xl border border-line bg-white px-3 text-base text-ink" />
            <fieldset className="mt-5">
              <legend className="mb-3 font-semibold text-ink">Personaggi partecipanti</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {people.map((person) => <label key={person.id} className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 py-2 text-ink">
                  <input type="checkbox" name="participant" value={person.id} defaultChecked className="size-5 accent-accent" />
                  <span>{person.name}</span>
                </label>)}
              </div>
              {!people.length && <p className="text-sm text-ink-soft">Nessun personaggio: la Sessione può essere creata e aggiornata in seguito.</p>}
            </fieldset>
            <button className="mt-5 min-h-12 w-full rounded-xl bg-accent px-4 font-bold text-white">Crea Sessione</button>
          </form>
        </section>
      )}

      <section aria-labelledby="archive-title">
        <h2 id="archive-title" className="mb-3 text-lg font-bold text-ink">Sessioni concluse</h2>
        {closedSessions.length ? <ul className="flex flex-col gap-2">
          {closedSessions.map((session) => <li key={session.id} className="rounded-xl border border-line bg-card/70 px-4 py-3">
            <details>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <span><span className="block font-semibold text-ink">{session.name}</span><span className="text-sm text-ink-soft">{dateLabel(session.localDate)}</span></span>
                <span className="shrink-0 text-sm text-ink-soft">Chiusa</span>
              </summary>
              <ol className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                {events.filter((event) => event.sessionId === session.id).map((event) => (
                  <li key={event.id} className="text-sm text-ink">
                    <time className="mr-2 text-ink-soft">{new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short" }).format(event.occurredAt)}</time>
                    {event.type === "sessione_creata" ? "Sessione creata" : event.type === "partecipanti_aggiornati" ? "Partecipanti aggiornati" : "Sessione chiusa"}
                  </li>
                ))}
              </ol>
            </details>
          </li>)}
        </ul> : <p className="rounded-xl border border-line bg-card/60 px-4 py-5 text-sm text-ink-soft">Nessuna Sessione archiviata.</p>}
      </section>
    </main>
  );
}
