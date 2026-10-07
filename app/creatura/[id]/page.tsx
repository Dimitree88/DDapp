import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatures } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function CreaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [creature] = await db.select().from(creatures).where(eq(creatures.id, id));
  if (!creature) notFound();
  const data = creature.data;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 py-8 text-ink">
      <Link href="/" className="text-sm font-semibold text-accent">← Creature</Link>
      <header>
        <h1 className="text-3xl font-bold">{creature.name}</h1>
        <p className="text-ink-soft">{data.description} · {data.creatureType} {data.size}</p>
        <p className="mt-1 text-xs text-ink-faint">Creatura personalizzata del tavolo</p>
      </header>

      <section className="rounded-xl border border-line bg-card/80 p-4 shadow-sm" aria-label="Statistiche principali">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div><dt className="text-sm text-ink-soft">Classe Armatura</dt><dd className="font-semibold">{data.armorClass} <span className="font-normal">({data.armorClassNote})</span></dd></div>
          <div><dt className="text-sm text-ink-soft">Punti Ferita</dt><dd className="font-semibold">{data.hitPointsCurrent}/{data.hitPointsMax}</dd></div>
          <div><dt className="text-sm text-ink-soft">Velocità</dt><dd className="font-semibold">{data.speedMeters} m</dd></div>
          <div><dt className="text-sm text-ink-soft">Grado di sfida</dt><dd className="font-semibold">{data.challengeRating} ({data.experiencePoints} PE)</dd></div>
        </dl>
      </section>

      <section className="rounded-xl border border-line bg-card/80 p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">Azioni</h2>
        {data.actions.map((action) => (
          <p key={action.name} className="text-sm leading-relaxed">
            <strong>{action.name}.</strong> {action.attackType}: +{action.hitBonus} a colpire; portata {action.reachMeters === null ? "da definire" : `${action.reachMeters} m`}. Colpito: {action.hitDamage} ({action.damageFormula}) danni {action.damageType}.
          </p>
        ))}
      </section>

      <section className="rounded-xl border border-line bg-card/80 p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">Tratti del tavolo</h2>
        {data.traits.map((trait) => (
          <p key={trait.name} className="text-sm leading-relaxed"><strong>{trait.name}.</strong> {trait.description}</p>
        ))}
      </section>
    </main>
  );
}
