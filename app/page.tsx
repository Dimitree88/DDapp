import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { characters, creatures } from "@/lib/db/schema";
import { HomeCharacterList } from "@/components/HomeCharacterList";
import { normalizeSheet } from "@/lib/sheet";
import { characterCardStatus } from "@/lib/characterCardStatus";
import { HomeGlossarySearch } from "@/components/HomeGlossarySearch";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [list, creatureList] = await Promise.all([
    db.select({ id: characters.id, name: characters.name, data: characters.data }).from(characters).orderBy(asc(characters.name)),
    db.select({ id: creatures.id, name: creatures.name }).from(creatures).orderBy(asc(creatures.name)),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <Link href="/master" className="mb-6 flex min-h-16 items-center justify-between rounded-xl border border-accent bg-card/80 px-4 text-lg font-bold text-accent shadow-sm active:bg-card">
        Master <span aria-hidden>›</span>
      </Link>

      <section className="flex flex-col gap-3" aria-label="Personaggi">
        <HomeCharacterList initialCards={list.map((character) =>
          characterCardStatus(character.id, character.name, normalizeSheet(character.data)))} />
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3" aria-label="Creature">
        {creatureList.length === 0 && (
          <p className="col-span-2 rounded-xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">
            Nessuna creatura presente.
          </p>
        )}
        {creatureList.map((creature) => (
          <Link key={creature.id} href={`/creatura/${creature.id}`} className="flex min-h-16 min-w-0 items-center justify-between gap-2 rounded-xl border border-line bg-card/70 px-3 py-3 shadow-sm active:bg-card">
            <span className="min-w-0 truncate text-base font-semibold text-ink">{creature.name}</span>
            <span className="shrink-0 text-accent" aria-hidden>›</span>
          </Link>
        ))}
      </section>

      <Link href="/master/eventi" className="mt-6 flex min-h-14 items-center justify-between rounded-xl border border-line bg-card/70 px-4 text-base font-semibold text-ink shadow-sm active:bg-card">
        Eventi <span className="text-accent" aria-hidden>›</span>
      </Link>

      <HomeGlossarySearch />
    </div>
  );
}
