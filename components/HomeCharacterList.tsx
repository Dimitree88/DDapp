"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHomeCharacterCards } from "@/app/actions";
import { CharacterCard } from "@/components/CharacterCard";
import type { CharacterCardStatus } from "@/lib/characterCardStatus";

export function HomeCharacterList({ initialCards, creatures }: { initialCards: CharacterCardStatus[]; creatures: { id: string; name: string }[] }) {
  const [cards, setCards] = useState(initialCards);

  useEffect(() => setCards(initialCards), [initialCards]);

  useEffect(() => {
    let active = true;
    let fetching = false;
    const sync = async () => {
      if (!active || fetching || document.visibilityState !== "visible") return;
      fetching = true;
      try {
        const latest = await getHomeCharacterCards();
        if (active) setCards(latest);
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
      <span className="min-w-0 truncate text-base font-semibold text-ink">{creature.name}</span>
      <span className="shrink-0 text-accent" aria-hidden>›</span>
    </Link>)}
  </div>;
}
