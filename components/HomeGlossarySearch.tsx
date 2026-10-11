"use client";

import { useEffect, useRef, useState } from "react";
import { searchHomeGlossaryEntries } from "@/app/actions";
import { Button, Sheet, TextInput } from "@/components/ui";
import type { HomeGlossaryEntry } from "@/lib/homeGlossary";

export function HomeGlossarySearch() {
  const searchRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HomeGlossaryEntry[]>([]);
  const [selected, setSelected] = useState<HomeGlossaryEntry | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const handleOutsidePointer = (event: PointerEvent) => {
      if (searchRef.current?.contains(event.target as Node)) return;
      setQuery("");
      setResults([]);
    };
    document.addEventListener("pointerdown", handleOutsidePointer);
    return () => document.removeEventListener("pointerdown", handleOutsidePointer);
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let active = true;
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const matches = await searchHomeGlossaryEntries(value);
        if (active) setResults(matches);
      } finally {
        if (active) setSearching(false);
      }
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  return <section ref={searchRef} className="mt-6 flex flex-col gap-2" aria-label="Ricerca nel glossario">
    <TextInput id="home-glossary-search" value={query} onChange={(event) => setQuery(event.target.value)}
      placeholder="Cerca nel glossario…" aria-label="Cerca nel glossario" autoComplete="off" role="combobox"
      aria-expanded={results.length > 0} aria-controls="home-glossary-results" />
    {query.trim().length >= 2 && <div id="home-glossary-results" role="listbox" aria-label="Risultati del glossario"
      className="-mt-1 overflow-hidden rounded-xl border border-line bg-card shadow-sm">
      {results.map((entry) => <button key={entry.id} type="button" role="option" aria-selected="false"
        onClick={() => setSelected(entry)} className="flex min-h-12 w-full flex-col items-start gap-0.5 border-b border-line/70 px-3 py-2 text-left last:border-0 active:bg-parchment">
        <span className="font-semibold text-ink">{entry.name}</span>
        <span className="text-xs capitalize text-ink-soft">{entry.category}</span>
      </button>)}
      {!results.length && <p className="px-3 py-3 text-sm text-ink-soft">{searching ? "Ricerca…" : "Nessuna voce trovata."}</p>}
    </div>}
    <Sheet open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name ?? ""}
      subtitle={selected ? `${selected.category} · ${selected.reference}` : undefined}>
      {selected && <div className="max-h-[65dvh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-ink">{selected.description}</div>}
      <div className="mt-4 flex justify-end"><Button onClick={() => setSelected(null)}>Chiudi</Button></div>
    </Sheet>
  </section>;
}
