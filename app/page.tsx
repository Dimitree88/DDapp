import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { CharacterCard } from "@/components/CharacterCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const list = await db
    .select({ id: characters.id, name: characters.name })
    .from(characters)
    .orderBy(asc(characters.name));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <Link href="/master" className="mb-6 flex min-h-16 items-center justify-between rounded-xl border border-accent bg-card/80 px-4 text-lg font-bold text-accent shadow-sm active:bg-card">
        Master <span aria-hidden>›</span>
      </Link>

      <section className="flex flex-col gap-3" aria-labelledby="characters-title">
        <h1 id="characters-title" className="text-lg font-bold text-ink">Personaggi</h1>
        {list.length === 0 && (
          <p className="rounded-xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">
            Nessun personaggio presente.
          </p>
        )}

        {list.map((c) => (
          <CharacterCard
            key={c.id}
            id={c.id}
            name={c.name}
          />
        ))}
      </section>

      <section className="mt-6 flex flex-col gap-3" aria-labelledby="creatures-title">
        <h2 id="creatures-title" className="text-lg font-bold text-ink">Creature</h2>
        <p className="rounded-xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">
          Nessuna creatura presente.
        </p>
      </section>
    </div>
  );
}
