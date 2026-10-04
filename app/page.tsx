import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { CharacterCard } from "@/components/CharacterCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const list = await db
    .select({ id: characters.id, name: characters.name, data: characters.data })
    .from(characters)
    .orderBy(asc(characters.name));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <section className="flex flex-col gap-3">
        {list.length === 0 && (
          <p className="rounded-xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">
            Nessun personaggio ancora. Creane uno qui sotto.
          </p>
        )}

        {list.map((c) => (
          <CharacterCard
            key={c.id}
            id={c.id}
            name={c.name}
            livello={c.data.livello}
            classe={c.data.classe}
          />
        ))}
      </section>
    </div>
  );
}
