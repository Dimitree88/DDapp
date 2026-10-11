import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { HomeCharacterList } from "@/components/HomeCharacterList";
import { normalizeSheet } from "@/lib/sheet";
import { characterCardStatus } from "@/lib/characterCardStatus";
import { HomeGlossarySearch } from "@/components/HomeGlossarySearch";
import { HomeGeneralEvents } from "@/components/HomeGeneralEvents";
import { getHomeCreatures, getHomeGeneralHistory } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [list, creatureList, eventEntries] = await Promise.all([
    db.select({ id: characters.id, name: characters.name, data: characters.data }).from(characters).orderBy(asc(characters.name)),
    getHomeCreatures(),
    getHomeGeneralHistory(),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <Link href="/master" className="mb-6 flex min-h-16 items-center justify-between rounded-xl border border-accent bg-card/80 px-4 text-lg font-bold text-accent shadow-sm active:bg-card">
        Master <span aria-hidden>›</span>
      </Link>

      <section className="flex flex-col gap-3" aria-label="Personaggi e creature">
        <HomeCharacterList initialCards={list.map((character) =>
          characterCardStatus(character.id, character.name, normalizeSheet(character.data)))} initialCreatures={creatureList} />
      </section>

      <HomeGlossarySearch />
      <HomeGeneralEvents initialEntries={eventEntries} />
    </div>
  );
}
