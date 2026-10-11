"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHomeCharacterCards, getHomeCreatures, type HomeCreatureCard } from "@/app/actions";
import { CharacterCard } from "@/components/CharacterCard";
import type { CharacterCardStatus } from "@/lib/characterCardStatus";

export function HomeCharacterList({ initialCards, initialCreatures }: { initialCards: CharacterCardStatus[]; initialCreatures: HomeCreatureCard[] }) {
  const [cards, setCards] = useState(initialCards);
  const [creatures, setCreatures] = useState(initialCreatures);

  useEffect(() => setCards(initialCards), [initialCards]);
  useEffect(() => setCreatures(initialCreatures), [initialCreatures]);

  useEffect(() => {
    let active = true;
    let fetching = false;
    const sync = async () => {
      if (!active || fetching || document.visibilityState !== "visible") return;
      fetching = true;
      try {
        const [latest, latestCreatures] = await Promise.all([getHomeCharacterCards(), getHomeCreatures()]);
        if (active) {
          setCards(latest);
          setCreatures(latestCreatures);
        }
      } catch {
        // Gli errori temporanei vengono ritentati al prossimo controllo.
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

  return <div className="grid grid-cols-2 gap-3">
    {!cards.length && !creatures.length && <p className="col-span-2 rounded-xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">Nessun personaggio o creatura presente.</p>}
    {cards.map((card) => <CharacterCard key={card.id} {...card} />)}
    {creatures.map((creature) => <Link key={`creature-${creature.id}`} href={`/creatura/${creature.id}`} className="flex min-h-16 min-w-0 items-center justify-between gap-2 rounded-xl border border-line bg-card/70 px-3 py-3 shadow-sm active:bg-card">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate text-lg font-semibold text-ink">{creature.name}</span>
        {creature.hpMissing > 0 && <span className="shrink-0 text-xs font-semibold text-danger-strong">−{creature.hpMissing} PF</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {creature.conditions.length > 0 && <span aria-label={`Condizioni: ${creature.conditions.join(", ")}`} title={creature.conditions.join(", ")}
          className="flex size-6 items-center justify-center rounded-full border border-danger/50 bg-danger/10 text-xs font-bold text-danger-strong">!</span>}
        <span className="text-accent" aria-hidden>›</span>
      </span>
    </Link>)}
  </div>;
}
