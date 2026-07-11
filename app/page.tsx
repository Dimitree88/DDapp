import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { DeleteCharacter } from "@/components/DeleteCharacter";
import { NewCharacter } from "@/components/NewCharacter";

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
          <div
            key={c.id}
            className="flex items-stretch overflow-hidden rounded-xl border border-line bg-card/70 shadow-sm"
          >
            <Link
              href={`/personaggio/${c.id}`}
              className="flex flex-1 items-center justify-between px-4 py-4 transition-colors active:bg-card"
            >
              <div>
                <div className="text-lg font-semibold text-ink">{c.name}</div>
                <div className="text-sm text-ink-soft">
                  Liv. {c.data.livello || "—"}
                  {c.data.classe ? ` · ${c.data.classe}` : ""}
                </div>
              </div>
              <span className="text-accent">›</span>
            </Link>
            <DeleteCharacter id={c.id} name={c.name} />
          </div>
        ))}
      </section>

      <section className="mt-8">
        <NewCharacter />
      </section>
    </div>
  );
}
