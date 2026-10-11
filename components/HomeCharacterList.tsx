"use client";

import { useEffect, useState } from "react";
import { getHomeCharacterCards } from "@/app/actions";
import { CharacterCard } from "@/components/CharacterCard";
import type { CharacterCardStatus } from "@/lib/characterCardStatus";

export function HomeCharacterList({ initialCards }: { initialCards: CharacterCardStatus[] }) {
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

  if (!cards.length) return <p className="rounded-xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">Nessun personaggio presente.</p>;
  return <div className="grid grid-cols-2 gap-3">
    {cards.map((card) => <CharacterCard key={card.id} {...card} />)}
  </div>;
}
