"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getHomeGeneralHistory, type HomeGeneralHistoryEntry } from "@/app/actions";
import { HistoryChangeDisplay } from "@/components/HistoryChangeDisplay";
import { groupHistoryByDay } from "@/lib/history";

const dayFormatter = new Intl.DateTimeFormat("it-IT", {
  weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome",
});
const timeFormatter = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome",
});

export function HomeGeneralEvents({ initialEntries }: { initialEntries: HomeGeneralHistoryEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);

  useEffect(() => setEntries(initialEntries), [initialEntries]);

  useEffect(() => {
    let active = true;
    let fetching = false;
    const sync = async () => {
      if (!active || fetching || document.visibilityState !== "visible") return;
      fetching = true;
      try {
        const latest = await getHomeGeneralHistory();
        if (active) setEntries(latest);
      } catch {
        // Ritenta al prossimo aggiornamento automatico.
      } finally {
        fetching = false;
      }
    };
    const interval = window.setInterval(sync, 3000);
    window.addEventListener("focus", sync);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const days = groupHistoryByDay(entries);
  return <section className="mt-6 flex flex-col gap-2" aria-label="Eventi generali">
    <h2 className="text-base font-bold text-heading">Eventi</h2>
    {!entries.length ? <p className="rounded-xl border border-line bg-card/60 px-3 py-4 text-sm text-ink-soft">Nessun evento registrato.</p> :
      <ol className="flex flex-col gap-2">
        {days.map((day) => <li key={day.day} className="rounded-xl border border-line bg-card/70 p-3 shadow-sm">
          <h3 className="text-sm font-semibold capitalize text-heading">{dayFormatter.format(new Date(day.timeGroups[0].newest))}</h3>
          <ol className="mt-2 flex flex-col gap-2">
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
                    {entry.changes.map((change, index) => <li key={`${entry.id}-${index}`} className="break-words text-sm text-ink"><HistoryChangeDisplay change={change} /></li>)}
                  </ul>
                </li>)}
              </ol>
            </li>)}
          </ol>
        </li>)}
      </ol>}
  </section>;
}
