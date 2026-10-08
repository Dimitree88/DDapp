"use client";

import { useState } from "react";
import type { EventView } from "./types";
import { cx } from "@/components/ui";

const time = (iso: string) => new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" }).format(new Date(iso));
const day = (iso: string) => new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Rome" }).format(new Date(iso));

export function EventList({ events, onUndo, undoDisabled, filterNames }: { events: EventView[]; onUndo?: (event: EventView) => void; undoDisabled?: boolean; filterNames?: { id: string; name: string }[] }) {
  const [filter, setFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const visible = filter ? events.filter((event) => event.targetIds.includes(filter)) : events;
  return <div className="flex flex-col gap-3">
    {filterNames && filterNames.length > 1 && <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 no-scrollbar">
      <button type="button" onClick={() => setFilter(null)} className={cx("min-h-9 shrink-0 rounded-full border px-3 text-sm font-semibold", !filter ? "border-accent bg-accent text-white" : "border-line bg-white/70")}>Tutti</button>
      {filterNames.map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={cx("min-h-9 shrink-0 rounded-full border px-3 text-sm font-semibold", filter === item.id ? "border-accent bg-accent text-white" : "border-line bg-white/70")}>{item.name}</button>)}
    </div>}
    {!visible.length && <p className="text-sm text-ink-soft">Nessun evento.</p>}
    <ol className="flex flex-col gap-1.5">
      {visible.map((event, index) => {
        const currentDay = day(event.at);
        const header = index === 0 || day(visible[index - 1].at) !== currentDay ? currentDay : null;
        const open = expanded.has(event.id);
        const lines = open ? event.lines : event.lines.slice(0, 2);
        return <li key={event.id} className="flex flex-col gap-1.5">
          {header && <p className="mt-1 text-xs font-bold uppercase tracking-wide text-ink-faint">{header}</p>}
          <div className={cx("flex gap-3 rounded-xl bg-white/75 px-3 py-2", event.undone && "opacity-55")}>
            <time className="w-11 shrink-0 pt-0.5 text-xs tabular-nums text-ink-soft">{time(event.at)}</time>
            <div className="min-w-0 flex-1 text-sm">
              <p className={cx("text-ink", event.undone && "line-through")}>{event.subject && <strong>{event.subject} · </strong>}{event.title}</p>
              {lines.map((line, index) => <p key={index} className="text-ink-soft">{line}</p>)}
              {event.lines.length > 2 && <button type="button" className="text-xs font-semibold text-accent" onClick={() => setExpanded((current) => { const next = new Set(current); if (next.has(event.id)) next.delete(event.id); else next.add(event.id); return next; })}>{open ? "meno" : `altri ${event.lines.length - 2}`}</button>}
              {event.warnings.map((line, index) => <p key={`w${index}`} className="mt-0.5 font-semibold text-amber-800">⚠ {line}</p>)}
              {event.undone && <p className="text-xs font-semibold text-ink-soft">annullato</p>}
            </div>
            {onUndo && event.undoable && !event.undone && <button type="button" disabled={undoDisabled} onClick={() => onUndo(event)} className="min-h-10 shrink-0 self-center rounded-lg px-2 text-sm font-semibold text-accent active:bg-parchment disabled:opacity-40">Annulla</button>}
          </div>
        </li>;
      })}
    </ol>
  </div>;
}
