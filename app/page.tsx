import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters } from "@/lib/db/schema";
import { createCharacter } from "./actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const list = await db
    .select({ id: characters.id, name: characters.name, data: characters.data })
    .from(characters)
    .orderBy(asc(characters.name));

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-accent">
          Schede della Compagnia
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Scegli un personaggio per vederlo. Per modificarlo serve il PIN.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        {list.length === 0 && (
          <p className="rounded-xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">
            Nessun personaggio ancora. Creane uno qui sotto.
          </p>
        )}

        {list.map((c) => (
          <Link
            key={c.id}
            href={`/personaggio/${c.id}`}
            className="flex items-center justify-between rounded-xl border border-line bg-card/70 px-4 py-4 shadow-sm transition-colors active:bg-card"
          >
            <div>
              <div className="text-lg font-semibold text-ink">
                {c.name}
              </div>
              <div className="text-sm text-ink-soft">
                Liv. {c.data.livello || "—"}
                {c.data.classe ? ` · ${c.data.classe}` : ""}
              </div>
            </div>
            <span className="text-accent">›</span>
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">
          Nuovo personaggio
        </h2>
        <form action={createCharacter} className="flex flex-col gap-3">
          <input
            name="name"
            required
            placeholder="Nome del personaggio"
            className="w-full rounded-lg border border-line bg-card/70 px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          <input
            name="pin"
            required
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            placeholder="PIN a 4 cifre (per modificare)"
            className="w-full rounded-lg border border-line bg-card/70 px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-3 text-base font-semibold text-parchment transition-colors active:bg-accent-strong"
          >
            Crea personaggio
          </button>
        </form>
      </section>
    </div>
  );
}
