import { creatureActionStats, type CreatureAction } from "@/lib/creature";
import { Badge, StatTile } from "@/components/StatTile";
import { cx } from "@/components/ui";

const damageNote = (damage: NonNullable<ReturnType<typeof creatureActionStats>["damage"]>) =>
  [damage.average !== null && damage.formula ? `(${damage.formula})` : "", damage.type].filter(Boolean).join(" ");

// Colpire / TS, portata o gittata e danni di un'azione, in riquadri affiancati.
export function ActionStats({ action }: { action: CreatureAction }) {
  const stats = creatureActionStats(action);
  const tiles = [
    stats.hit && <StatTile key="hit" icon="hit" label="Colpire" tone="accent" value={stats.hit} />,
    stats.save && <StatTile key="save" icon="save" label={`TS ${stats.save.ability}`.trim()} tone="accent" value={stats.save.dc ? `CD ${stats.save.dc}` : ""} />,
    (stats.reach || stats.range) && <StatTile key="distance" icon={stats.reach ? "reach" : "range"} label={stats.reach ? "Portata" : "Gittata"} tone="sky" size="sm"
      value={stats.reach ?? stats.range} sub={stats.reach && stats.range ? `gittata ${stats.range}` : undefined} />,
    stats.damage && <StatTile key="damage" icon="damage" label="Danni" tone="red" value={stats.damage.average ?? stats.damage.formula} sub={damageNote(stats.damage)} />,
  ].filter(Boolean);
  if (!tiles.length) return null;
  return <div className={cx("grid gap-1.5", tiles.length >= 3 ? "grid-cols-3" : tiles.length === 2 ? "grid-cols-2" : "grid-cols-1")}>{tiles}</div>;
}

// Versione compatta su una riga, per le righe del Tavolo.
export function ActionBadges({ action }: { action: CreatureAction }) {
  const stats = creatureActionStats(action);
  return <div className="flex min-w-0 flex-wrap items-center gap-1 text-xs">
    <strong className="mr-0.5 text-ink">{action.name}</strong>
    {stats.hit && <Badge icon="hit" tone="accent">{stats.hit}</Badge>}
    {stats.save && <Badge icon="save" tone="accent">TS {stats.save.ability}{stats.save.dc ? ` CD ${stats.save.dc}` : ""}</Badge>}
    {(stats.reach || stats.range) && <Badge icon={stats.reach ? "reach" : "range"} tone="sky">{stats.reach ?? stats.range}</Badge>}
    {stats.damage && <Badge icon="damage" tone="red">{stats.damage.average ?? stats.damage.formula}{stats.damage.type ? ` ${stats.damage.type}` : ""}</Badge>}
  </div>;
}
