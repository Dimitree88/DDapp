import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatures } from "@/lib/db/schema";
import { abilityModifierValue, creatureActionCategories, creatureActionSummary, normalizeCreature, signedNumber } from "@/lib/creature";

export const dynamic = "force-dynamic";

export default async function CreaturePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [creature] = await db.select().from(creatures).where(eq(creatures.id, id));
  if (!creature) notFound();
  const data = normalizeCreature(creature.data);
  const groups = creatureActionCategories.map((category) => ({ ...category, actions: data.actions.filter((action) => (action.category ?? "azione") === category.id) })).filter((group) => group.actions.length);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-5 py-8 text-ink">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-accent">← Creature</Link>
        <Link href="/master" className="text-sm font-semibold text-accent">Modifica dal Master ›</Link>
      </div>
      <header>
        <h1 className="text-3xl font-bold">{creature.name}</h1>
        <p className="text-ink-soft">{[[data.creatureType, data.size].filter(Boolean).join(" "), data.alignment].filter(Boolean).join(", ")}</p>
        {data.description && <p className="mt-1 text-sm text-ink-soft">{data.description}</p>}
        <p className="mt-1 text-xs text-ink-faint">Creatura personalizzata del tavolo</p>
      </header>

      <section className="rounded-xl border border-line bg-card/80 p-4 shadow-sm" aria-label="Statistiche principali">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div><dt className="text-sm text-ink-soft">Classe Armatura</dt><dd className="font-semibold">{data.armorClass}{data.armorClassNote && <span className="font-normal"> ({data.armorClassNote})</span>}</dd></div>
          <div><dt className="text-sm text-ink-soft">Punti Ferita</dt><dd className="font-semibold">{data.hitPointsCurrent}/{data.hitPointsMax}{data.hitPointsFormula && <span className="font-normal"> ({data.hitPointsFormula})</span>}</dd></div>
          <div><dt className="text-sm text-ink-soft">Iniziativa</dt><dd className="font-semibold">{data.initiativeBonus === null || data.initiativeBonus === undefined ? "—" : signedNumber(data.initiativeBonus)}</dd></div>
          <div><dt className="text-sm text-ink-soft">Velocità</dt><dd className="font-semibold">{String(data.speedMeters).replace(".", ",")} m{data.speedNote && <span className="font-normal">, {data.speedNote}</span>}</dd></div>
          <div className="col-span-2"><dt className="text-sm text-ink-soft">Grado di sfida</dt><dd className="font-semibold">{data.challengeRating || "—"} ({data.experiencePoints} PE{data.proficiencyBonus ? `; BC ${signedNumber(data.proficiencyBonus)}` : ""})</dd></div>
        </dl>
        {data.abilities?.some((ability) => ability.score !== null) && <div className="mt-4 grid grid-cols-6 gap-1 text-center">
          {data.abilities.map((ability) => {
            const mod = abilityModifierValue(ability.score);
            return <div key={ability.abbr} className="rounded-lg bg-white/60 py-1">
              <div className="text-[11px] font-bold text-ink-soft">{ability.abbr}</div>
              <div className="text-sm font-bold">{ability.score ?? "—"}</div>
              <div className="text-[10px] text-ink-soft">{mod === null ? "" : signedNumber(mod)} · TS {ability.save === null ? (mod === null ? "—" : signedNumber(mod)) : signedNumber(ability.save)}</div>
            </div>;
          })}
        </div>}
        {(data.skills || data.senses || data.languages) && <div className="mt-3 flex flex-col gap-1 text-sm">
          {data.skills && <p><strong>Abilità</strong> {data.skills}</p>}
          {data.senses && <p><strong>Sensi</strong> {data.senses}</p>}
          {data.languages && <p><strong>Lingue</strong> {data.languages}</p>}
        </div>}
      </section>

      {data.traits.length > 0 && <section className="rounded-xl border border-line bg-card/80 p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">Tratti</h2>
        {data.traits.map((trait) => (
          <p key={trait.name} className="text-sm leading-relaxed"><strong>{trait.name}.</strong> {trait.description}</p>
        ))}
      </section>}

      {groups.map((group) => <section key={group.id} className="rounded-xl border border-line bg-card/80 p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-bold">{group.label}</h2>
        <div className="flex flex-col gap-2">{group.actions.map((action, index) => (
          <p key={`${action.name}-${index}`} className="text-sm leading-relaxed"><strong>{action.name}.</strong> {creatureActionSummary(action)}</p>
        ))}</div>
      </section>)}

      {data.notes && <section className="rounded-xl border border-line bg-card/80 p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-bold">Note del Master</h2>
        <p className="whitespace-pre-line text-sm">{data.notes}</p>
      </section>}
    </main>
  );
}
