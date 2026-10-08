import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters, creatures, masterSessionEvents, masterSessions } from "@/lib/db/schema";
import { describeEvents } from "@/lib/masterEvents";
import { ArchiveActions, ArchiveLog } from "./ArchiveClient";

export const dynamic = "force-dynamic";

const dateLabel = (date: string) => new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

type SummaryEntry = { name?: unknown; current?: Record<string, unknown>; statiAttivi?: unknown[]; datiMancanti?: unknown[]; modificheSessione?: { action?: unknown; details?: unknown[] }[] };
const list = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export default async function ArchivedSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [session] = await db.select().from(masterSessions).where(eq(masterSessions.id, id)).limit(1);
  if (!session) notFound();
  if (session.status === "aperta") redirect("/master");
  const [eventRows, people, beasts, [open]] = await Promise.all([
    db.select().from(masterSessionEvents).where(eq(masterSessionEvents.sessionId, id)).orderBy(desc(masterSessionEvents.occurredAt)),
    db.select({ id: characters.id, name: characters.name }).from(characters),
    db.select({ id: creatures.id, name: creatures.name }).from(creatures),
    db.select({ id: masterSessions.id, name: masterSessions.name }).from(masterSessions).where(eq(masterSessions.status, "aperta")).limit(1),
  ]);
  const events = describeEvents(eventRows, new Map([...people, ...beasts].map((row) => [row.id, row.name])));
  const closing = eventRows.find((event) => event.type === "sessione_chiusa")?.payload as { participants?: SummaryEntry[]; creatures?: SummaryEntry[] } | undefined;
  const entries = [...(closing?.participants ?? []).map((entry) => ({ ...entry, creature: false })), ...(closing?.creatures ?? []).map((entry) => ({ ...entry, creature: true }))];

  return <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 pb-10 pt-4">
    <header className="flex items-center gap-2">
      <Link href="/master" aria-label="Torna al Master" className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl text-ink-soft active:bg-card">‹</Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold text-ink">{session.name}</h1>
        <p className="text-sm text-ink-soft">{dateLabel(session.localDate)} · chiusa{session.closedAt ? ` il ${new Intl.DateTimeFormat("it-IT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Rome" }).format(session.closedAt)}` : ""}</p>
      </div>
    </header>
    <ArchiveActions sessionId={id} name={session.name} openName={open?.name ?? null} />

    {entries.length > 0 && <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Riepilogo finale</h2>
      <div className="grid gap-2 sm:grid-cols-2">{entries.map((entry, index) => {
        const current = entry.current ?? {};
        const states = list(entry.statiAttivi);
        const missing = list(entry.datiMancanti);
        return <article key={index} className="rounded-2xl border border-line/60 bg-card/90 p-3 text-sm">
          <h3 className="font-bold text-ink">{String(entry.name)}{entry.creature && <span className="font-normal text-ink-soft"> · creatura</span>}</h3>
          <p className="text-ink-soft">PF {String(current.puntiFerita ?? "—")}/{String(current.puntiFeritaMax ?? "—")} · CA {String(current.classeArmatura ?? "—")}{current.puntiEsperienza !== undefined ? ` · ${String(current.puntiEsperienza)} PE` : ""}</p>
          {states.length > 0 && <p className="mt-1 text-ink">Stati: {states.join(", ")}</p>}
          {missing.length > 0 && <p className="mt-1 text-amber-800">Da registrare: {missing.join(", ")}</p>}
          {Array.isArray(entry.modificheSessione) && entry.modificheSessione.length > 0 && <p className="mt-1 text-ink-soft">{entry.modificheSessione.length} azioni registrate</p>}
        </article>;
      })}</div>
    </section>}

    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-ink-soft">Registro</h2>
      {session.notes && <details className="rounded-2xl bg-white/70 p-3 text-sm"><summary className="cursor-pointer font-semibold text-ink">Appunti</summary><p className="mt-2 whitespace-pre-line text-ink">{session.notes}</p></details>}
      <ArchiveLog events={events} />
    </section>
  </main>;
}
