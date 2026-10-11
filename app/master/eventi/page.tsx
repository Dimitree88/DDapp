import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { characterHistory, characters } from "@/lib/db/schema";
import { formatHistoryValue, groupHistoryByDay, historyTimestampMs, withoutAppuntiChanges, type HistoryChange } from "@/lib/history";

export const dynamic = "force-dynamic";

const dayFormatter = new Intl.DateTimeFormat("it-IT", {
  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome",
});
const timeFormatter = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
});

export default async function MasterEventsPage() {
  const rows = await db.select({
    id: characterHistory.id,
    characterId: characters.id,
    characterName: characters.name,
    occurredAt: sql<number>`${characterHistory.occurredAt}`,
    changes: characterHistory.changes,
  }).from(characterHistory)
    .innerJoin(characters, eq(characterHistory.characterId, characters.id))
    .orderBy(desc(characterHistory.occurredAt), desc(characterHistory.id));

  const entries = rows.flatMap((row) => {
    const changes = withoutAppuntiChanges(row.changes);
    if (!changes.length) return [];
    return [{
      ...row,
      occurredAt: new Date(historyTimestampMs(Number(row.occurredAt))).toISOString(),
      changes,
    }];
  });
  const days = groupHistoryByDay(entries);

  return <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 pb-10 pt-4">
    <header className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-line/60 bg-parchment/95 px-3 py-2 backdrop-blur">
      <Link href="/master" aria-label="Torna a Master" className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-accent active:bg-card">←</Link>
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-bold text-heading">Eventi dei personaggi</h1>
        <p className="text-xs text-ink-soft">Tutti i personaggi · dal più recente</p>
      </div>
    </header>

    {!entries.length ? <p className="rounded-2xl border border-line bg-card/70 px-4 py-5 text-sm text-ink-soft">Nessun evento registrato.</p> :
      <ol className="flex flex-col gap-3">
        {days.map((day) => <li key={day.day} className="rounded-xl border border-line bg-card/70 p-3 shadow-sm">
          <h2 className="text-sm font-semibold capitalize text-heading">{dayFormatter.format(new Date(day.timeGroups[0].newest))}</h2>
          <ol className="mt-2 flex flex-col gap-3">
            {day.timeGroups.map((group) => <li key={group.oldest} className="border-t border-line/60 pt-2 first:border-0 first:pt-0">
              <time className="text-xs font-semibold tabular-nums text-ink-soft" dateTime={group.oldest}>
                {timeFormatter.format(new Date(group.oldest))}
                {timeFormatter.format(new Date(group.oldest)) !== timeFormatter.format(new Date(group.newest)) && `–${timeFormatter.format(new Date(group.newest))}`}
              </time>
              <ol className="mt-1 flex flex-col gap-2">
                {group.entries.map((entry) => <li key={entry.id}>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <time className="text-xs tabular-nums text-ink-soft" dateTime={entry.occurredAt}>{timeFormatter.format(new Date(entry.occurredAt))}</time>
                    <Link href={`/personaggio/${entry.characterId}`} className="text-sm font-bold text-accent underline decoration-accent/40 underline-offset-2">{entry.characterName}</Link>
                  </div>
                  <ul className="mt-1 list-disc list-fantasy space-y-1 pl-5 marker:text-accent">
                    {(entry.changes as HistoryChange[]).map((change, index) => <li key={`${entry.id}-${index}`} className="break-words text-sm text-ink">
                      <span className="font-semibold">{change.field}</span>{"  "}<span>{formatHistoryValue(change.before)} → {formatHistoryValue(change.after)}</span>
                    </li>)}
                  </ul>
                </li>)}
              </ol>
            </li>)}
          </ol>
        </li>)}
      </ol>}
  </main>;
}
