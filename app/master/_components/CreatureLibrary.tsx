"use client";

import { useState } from "react";
import { CreatureEditor } from "./CreatureEditor";
import type { CreatureView } from "./types";
import { Button } from "@/components/ui";

export function CreatureLibrary({ title, creatures }: { title: string; creatures: CreatureView[] }) {
  const [editing, setEditing] = useState<CreatureView | null | "nuova">(null);
  return <section className="flex flex-col gap-2">
    <div className="flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">{title}</h2><Button tone="ghost" onClick={() => setEditing("nuova")}>+ Nuova</Button></div>
    {creatures.length ? <ul className="flex flex-col gap-1.5">{creatures.map((creature) => <li key={creature.id}>
      <button type="button" onClick={() => setEditing(creature)} className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-surface/70 px-4 py-1.5 text-left text-sm active:bg-surface">
        <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-ink">{creature.name}</span><span className="block truncate text-xs text-ink-soft">{[creature.data.creatureType, creature.data.challengeRating && `GS ${creature.data.challengeRating}`, `${creature.data.actions.length} azioni`].filter(Boolean).join(" · ")}</span></span>
        <span className="shrink-0 text-xs text-ink-soft">CA {creature.data.armorClass} · PF {creature.data.hitPointsCurrent}/{creature.data.hitPointsMax}</span>
        <span className="text-accent" aria-hidden>✎</span>
      </button>
    </li>)}</ul> : <p className="rounded-xl bg-surface/60 px-4 py-3 text-sm text-ink-soft">Nessuna creatura: creane una con «+ Nuova».</p>}
    <CreatureEditor open={editing !== null} creature={editing === "nuova" ? null : editing} onClose={() => setEditing(null)} />
  </section>;
}
