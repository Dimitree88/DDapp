import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { characters, creatures } from "@/lib/db/schema";
import { CharacterCard } from "@/components/CharacterCard";
import { normalizeSheet } from "@/lib/sheet";

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

      <section className="flex flex-col gap-3" aria-labelledby="characters-title">
        <h1 id="characters-title" className="text-lg font-bold text-heading">Personaggi</h1>
        {list.length === 0 && (
          <p className="rounded-xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">
            Nessun personaggio presente.
          </p>
        )}

        {list.map((c) => {
          const sheet = normalizeSheet(c.data);
          const currentHp = Number(sheet.puntiFerita);
          const maxHp = Number(sheet.puntiFeritaMax);
          const hpMissing = Number.isFinite(currentHp) && Number.isFinite(maxHp) && maxHp > currentHp
            ? maxHp - currentHp : 0;
          const conditions = [
            ...(sheet.condizioni ?? []).map((condition) => condition.nome),
            ...(sheet.indebolimento ? [`Indebolimento ${sheet.indebolimento}`] : []),
          ];
          const coins = ([
            ["rame", "Rame"], ["argento", "Argento"], ["electrum", "Electrum"], ["oro", "Oro"], ["platino", "Platino"],
          ] as const).flatMap(([key, label]) => {
            const amount = Number(sheet.monete[key] || 0);
            return Number.isSafeInteger(amount) && amount > 0 ? [{ key, label, amount: String(amount) }] : [];
          });
          return <CharacterCard key={c.id} id={c.id} name={c.name} hpMissing={hpMissing}
            conditions={conditions} inspiration={sheet.ispirazioneEroica} coins={coins} />;
        })}
      </section>

      <section className="mt-6 flex flex-col gap-3" aria-labelledby="creatures-title">
        <h2 id="creatures-title" className="text-lg font-bold text-heading">Creature</h2>
        {creatureList.length === 0 && (
          <p className="rounded-xl border border-line bg-card/60 px-4 py-6 text-center text-sm text-ink-soft">
            Nessuna creatura presente.
          </p>
        )}
        {creatureList.map((creature) => (
          <Link key={creature.id} href={`/creatura/${creature.id}`} className="flex items-center justify-between rounded-xl border border-line bg-card/70 px-4 py-4 shadow-sm active:bg-card">
            <span className="text-lg font-semibold text-ink">{creature.name}</span>
            <span className="text-accent" aria-hidden>›</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
