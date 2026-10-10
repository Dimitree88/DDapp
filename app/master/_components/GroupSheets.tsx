"use client";

import { useState } from "react";
import { levelForXp, rollDie, xpThresholds } from "@/lib/masterRules";
import { abilityName } from "@/lib/abilityNames";
import { addParticipants } from "../actions";
import { awardXp, groupRest, type XpMode } from "../game-actions";
import { CreatureEditor } from "./CreatureEditor";
import { useMaster } from "./MasterContext";
import { Button, Chip, Field, NumberInput, Sheet, TextInput, cx, uuid } from "@/components/ui";

// --- Riposi (p. 371) --------------------------------------------------

export function RestSheet({ kind, onClose }: { kind: "breve" | "lungo" | null; onClose: () => void }) {
  return <Sheet open={Boolean(kind)} onClose={onClose} title={kind === "lungo" ? "Riposo lungo" : "Riposo breve"}
    subtitle={kind === "lungo" ? "Almeno 8 ore; serve almeno 1 PF (p. 371)" : "1 ora; serve almeno 1 PF (p. 371)"}>
    {kind && <RestBody key={kind} kind={kind} onClose={onClose} />}
  </Sheet>;
}

function RestBody({ kind, onClose }: { kind: "breve" | "lungo"; onClose: () => void }) {
  const { data, sessionId, run, pending } = useMaster();
  const eligible = (hp: number | null) => hp !== null && hp >= 1;
  const [selected, setSelected] = useState<Set<string>>(() => new Set([...data.party.filter((item) => eligible(item.hp)).map((item) => item.id), ...data.foes.filter((item) => item.data.hitPointsCurrent >= 1).map((item) => item.id)]));
  const [rolls, setRolls] = useState<Record<string, string>>({});
  const [spentBefore, setSpentBefore] = useState<Record<string, string>>({});
  const [inspiration, setInspiration] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const toggle = (id: string) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const parseRolls = (text: string) => text.split(/[\s,;]+/).filter(Boolean).map(Number);

  const submit = async () => {
    const characters = data.party.filter((item) => selected.has(item.id)).map((item) => ({
      id: item.id,
      rolls: kind === "breve" ? parseRolls(rolls[item.id] ?? "") : [],
      ...(spentBefore[item.id] ? { spentBefore: Number(spentBefore[item.id]) } : {}),
      ...(inspiration[item.id] ? { inspirationTarget: inspiration[item.id] } : {}),
    }));
    const result = await run(() => groupRest({ sessionId, commandId: uuid(), kind, characters, creatureIds: data.foes.filter((item) => selected.has(item.id)).map((item) => item.id) }));
    if (result.ok) onClose();
  };

  return <div className="flex flex-col gap-3">
    {data.session?.encounter && <p className="rounded-xl bg-warn/15 px-3 py-2 text-sm font-semibold text-warn-ink">Combattimento in corso: tirare per l&apos;iniziativa o subire danni interrompe il riposo (p. 371).</p>}
    <p className="text-sm text-ink-soft">{kind === "breve" ? "Per ogni Dado Vita speso: risultato + modificatore di Costituzione (minimo 1). Si ricaricano le capacità indicate «riposo breve»." : "Recupera tutti i PF e i Dadi Vita spesi, −1 Indebolimento, PF temporanei azzerati, ricariche «riposo lungo». Poi 16 ore prima del prossimo."}</p>
    <ul className="flex flex-col gap-2">
      {data.party.map((item) => {
        const can = eligible(item.hp);
        const on = selected.has(item.id);
        const available = item.hitDiceTotal !== null && item.hitDiceSpent !== null ? item.hitDiceTotal - item.hitDiceSpent : null;
        const values = parseRolls(rolls[item.id] ?? "");
        const healed = values.reduce((sum, roll) => sum + Math.max(1, roll + item.conMod), 0);
        const others = data.party.filter((other) => other.id !== item.id && !other.inspiration && selected.has(other.id));
        return <li key={item.id} className={cx("flex flex-col gap-2 rounded-2xl border border-line/60 bg-surface/80 p-2.5", !on && "opacity-60")}>
          <label className="flex min-h-10 items-center gap-2">
            <input type="checkbox" checked={on} disabled={!can} onChange={() => toggle(item.id)} className="size-6 accent-accent" />
            <span className="flex-1 font-semibold text-ink">{item.name}</span>
            <span className="text-sm text-ink-soft">{can ? `PF ${item.hp}/${item.hpMax}` : "0 PF: non può riposare"}</span>
          </label>
          {on && kind === "breve" && <div className="flex flex-col gap-1.5 pl-8">
            <p className="text-xs text-ink-soft">Dadi Vita {item.hitDie ? `d${item.hitDie}` : "da registrare"}{available !== null ? ` · disponibili ${available}/${item.hitDiceTotal}` : ""} · {abilityName("COS")} {item.conMod >= 0 ? "+" : ""}{item.conMod}</p>
            <div className="flex gap-1.5">
              <TextInput value={rolls[item.id] ?? ""} onChange={(event) => setRolls((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Risultati, es. 4, 7" className="flex-1" aria-label={`Risultati dei Dadi Vita di ${item.name}`} />
              {item.hitDie && <Button className="px-3" disabled={available !== null && values.length >= available} onClick={() => setRolls((current) => ({ ...current, [item.id]: [...parseRolls(current[item.id] ?? ""), rollDie(item.hitDie!)].join(", ") }))}>🎲 d{item.hitDie}</Button>}
            </div>
            {item.hitDiceSpent === null && values.length > 0 && <Field label="Dadi Vita già spesi prima del riposo"><NumberInput value={spentBefore[item.id] ?? ""} onChange={(value) => setSpentBefore((current) => ({ ...current, [item.id]: value }))} /></Field>}
            {values.length > 0 && <p className="text-sm font-semibold text-heal-strong">+{healed} PF → {Math.min(item.hpMax ?? 0, (item.hp ?? 0) + healed)}/{item.hpMax}</p>}
          </div>}
          {on && kind === "lungo" && item.human && item.inspiration && others.length > 0 && <label className="flex flex-col gap-1 pl-8 text-xs text-ink-soft">Intraprendente: possiede già Ispirazione, la nuova può andare a…
            <select value={inspiration[item.id] ?? ""} onChange={(event) => setInspiration((current) => ({ ...current, [item.id]: event.target.value }))} className="min-h-10 rounded-xl border border-line bg-surface px-2 text-base text-ink">
              <option value="">Nessuno</option>{others.map((other) => <option key={other.id} value={other.id}>{other.name}</option>)}
            </select>
          </label>}
        </li>;
      })}
      {data.foes.map((item) => {
        const can = item.data.hitPointsCurrent >= 1;
        return <li key={item.id} className={cx("rounded-2xl border border-line/60 bg-surface/80 p-2.5", !selected.has(item.id) && "opacity-60")}>
          <label className="flex min-h-10 items-center gap-2">
            <input type="checkbox" checked={selected.has(item.id)} disabled={!can} onChange={() => toggle(item.id)} className="size-6 accent-accent" />
            <span className="flex-1 font-semibold text-ink">{item.name}</span>
            <span className="text-sm text-ink-soft">{can ? `PF ${item.data.hitPointsCurrent}/${item.data.hitPointsMax}` : "0 PF"}</span>
          </label>
        </li>;
      })}
    </ul>
    <label className="flex items-start gap-3 rounded-xl bg-surface/70 p-3 text-sm text-ink">
      <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5 size-6 shrink-0 accent-accent" />
      <span>Riposo completato senza interruzioni (iniziativa, incantesimi non trucchetti, danni{kind === "lungo" ? ", 1 ora di sforzo" : ""}).</span>
    </label>
    <Button tone="primary" className="min-h-14 text-lg" disabled={pending || !confirmed || !selected.size} onClick={submit}>Applica {kind === "breve" ? "riposo breve" : "riposo lungo"} ({selected.size})</Button>
  </div>;
}

// --- Punti esperienza (pp. 41, 370) ------------------------------------

export type XpPreset = { amount: number; reason: string } | null;

export function XpSheet({ open, onClose, preset }: { open: boolean; onClose: () => void; preset?: XpPreset }) {
  return <Sheet open={open} onClose={onClose} title="Punti esperienza" subtitle="Li assegna il DM (p. 370); soglie a p. 41">{open && <XpBody onClose={onClose} preset={preset ?? null} />}</Sheet>;
}

const xpModes: { id: XpMode; label: string }[] = [
  { id: "aggiungi", label: "A testa" }, { id: "dividi", label: "Diviso" },
  { id: "livello", label: "Livello +1" }, { id: "imposta", label: "Correggi" },
];

function XpBody({ onClose, preset }: { onClose: () => void; preset: XpPreset }) {
  const { data, sessionId, run, pending } = useMaster();
  const defeated = data.foes.filter((item) => item.data.hitPointsCurrent === 0).reduce((sum, item) => sum + item.data.experiencePoints, 0);
  const [mode, setMode] = useState<XpMode | null>(preset ? null : "aggiungi");
  const [amount, setAmount] = useState(preset ? String(preset.amount) : "");
  const [reason, setReason] = useState(preset?.reason ?? "");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(data.party.filter((item) => item.death !== "morto").map((item) => item.id)));
  const [ready, setReady] = useState<string[] | null>(null);
  const value = Number(amount || 0);
  const share = mode === "dividi" && selected.size ? Math.floor(value / selected.size) : value;

  if (ready) return <div className="flex flex-col gap-3">
    <p className="rounded-2xl bg-heal/10 px-3 py-3 text-heal-ink">PE registrati.</p>
    {ready.length > 0 ? <>
      <p className="text-ink">{ready.length === 1 ? "Un personaggio può" : `${ready.length} personaggi possono`} salire di livello: {ready.map((id) => data.party.find((item) => item.id === id)?.name).join(", ")}.</p>
      <p className="rounded-2xl bg-warn/15 px-3 py-2 text-sm text-warn-ink">Ogni giocatore completa il passaggio dalla propria scheda con «⬆ Sali di livello»: le scelte (PF, sottoclasse, talenti, incantesimi) sono sue.</p>
    </> : null}
    <Button onClick={onClose}>Chiudi</Button>
  </div>;

  const submit = async () => {
    if (!mode) return;
    const result = await run(() => awardXp({ sessionId, commandId: uuid(), characterIds: [...selected], amount: value, mode, reason }));
    if (result.ok) setReady((result as { ready?: string[] }).ready ?? []);
  };
  const invalid = !mode || !selected.size || (mode === "aggiungi" && value <= 0) || (mode === "dividi" && share < 1) || (mode === "imposta" && (amount === "" || !reason.trim()));

  return <div className="flex flex-col gap-3">
    <div className="grid grid-cols-4 gap-1 rounded-2xl bg-parchment/70 p-1">
      {xpModes.map((item) => <button key={item.id} type="button" onClick={() => setMode(item.id)} className={cx("min-h-11 rounded-xl text-sm font-bold", mode === item.id ? (item.id === "imposta" ? "bg-ink text-parchment" : "bg-accent text-on-accent") : "text-ink")}>{item.label}</button>)}
    </div>
    {!mode && <p className="rounded-xl bg-warn/15 px-3 py-2 text-sm text-warn-ink">Scegli se dare il totale a ciascun personaggio o dividerlo: il Manuale del Giocatore lascia la decisione al DM (p. 370).</p>}
    {mode === "livello" ? <p className="text-sm text-ink-soft">Porta i PE di ciascun personaggio scelto alla soglia del livello successivo (p. 41): utile per far salire di livello tutto il gruppo insieme.</p>
      : mode && <Field label={mode === "aggiungi" ? "PE a ciascun personaggio" : mode === "dividi" ? "PE totali da dividere" : "Nuovo totale di PE"}><NumberInput value={amount} onChange={setAmount} className="text-2xl font-bold" placeholder="0" /></Field>}
    {mode === "dividi" && value > 0 && selected.size > 0 && <p className="text-sm text-ink-soft">{value} ÷ {selected.size} = <strong className="text-ink">{share}</strong> a testa (arrotondato per difetto, p. 8)</p>}
    {defeated > 0 && mode !== "livello" && mode !== "imposta" && !preset && <button type="button" className="self-start text-sm font-semibold text-accent" onClick={() => { setAmount(String(defeated)); setReason("Creature sconfitte"); }}>Usa i PE delle creature a 0 PF: {defeated}</button>}
    {mode !== "livello" && <Field label={mode === "imposta" ? "Motivo della correzione *" : "Motivo (facoltativo)"}><TextInput value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Es. scontro con i goblin" /></Field>}
    <ul className="flex flex-col gap-1.5">
      {data.party.map((item) => {
        const xp = /^\d+$/.test(item.xp) ? Number(item.xp) : 0;
        const level = Number(item.livello);
        const next = mode === "imposta" ? value : mode === "livello" ? Math.max(xp, xpThresholds[level] ?? xp) : xp + share;
        const on = selected.has(item.id);
        return <li key={item.id}><label className="flex min-h-12 items-center gap-2 rounded-xl bg-surface/80 px-2.5">
          <input type="checkbox" checked={on} onChange={() => setSelected((current) => { const set = new Set(current); if (set.has(item.id)) set.delete(item.id); else set.add(item.id); return set; })} className="size-6 accent-accent" />
          <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-ink">{item.name}</span><span className="text-xs text-ink-soft">Livello {item.livello}{level < 20 ? ` · prossimo a ${xpThresholds[level]?.toLocaleString("it-IT")}` : ""}</span></span>
          <span className="text-sm text-ink-soft">{xp}{on && mode && (mode === "livello" || amount) ? <strong className="text-ink"> → {next}</strong> : ""}</span>
          {on && mode && (mode === "livello" || amount) && levelForXp(next) > level && <span className="rounded-full bg-warn/30 px-2 text-xs font-bold text-warn-ink">⬆ {level + 1}</span>}
        </label></li>;
      })}
    </ul>
    <Button tone="primary" className="min-h-14 text-lg" disabled={pending || invalid} onClick={submit}>
      {!mode ? "Scegli come assegnarli" : mode === "livello" ? "Porta alla soglia" : mode === "imposta" ? "Correggi PE" : mode === "dividi" ? `Dividi ${value || ""} PE` : `Assegna ${value || ""} PE a testa`}
    </Button>
  </div>;
}

// --- Aggiungi partecipanti ----------------------------------------------

export function AddParticipantsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Sheet open={open} onClose={onClose} title="Aggiungi alla Sessione">{open && <AddBody onClose={onClose} />}</Sheet>;
}

function AddBody({ onClose }: { onClose: () => void }) {
  const { data, sessionId, run, pending } = useMaster();
  const characters = data.allCharacters.filter((item) => !data.party.some((member) => member.id === item.id));
  const beasts = data.library.filter((item) => !data.foes.some((member) => member.id === item.id));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const toggle = (id: string) => setSelected((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const submit = async () => {
    const result = await run(() => addParticipants({ sessionId, characterIds: characters.filter((item) => selected.has(item.id)).map((item) => item.id), creatureIds: beasts.filter((item) => selected.has(item.id)).map((item) => item.id) }), { quiet: true });
    if (result.ok) onClose();
  };
  return <div className="flex flex-col gap-4">
    <Button tone="primary" onClick={() => setCreating(true)}>+ Nuova creatura</Button>
    {characters.length > 0 && <div className="flex flex-col gap-2"><h3 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Personaggi</h3><div className="flex flex-wrap gap-1.5">{characters.map((item) => <Chip key={item.id} active={selected.has(item.id)} onClick={() => toggle(item.id)}>{item.name}</Chip>)}</div></div>}
    {beasts.length > 0 && <div className="flex flex-col gap-2"><h3 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Creature della libreria</h3><div className="flex flex-wrap gap-1.5">{beasts.map((item) => <Chip key={item.id} active={selected.has(item.id)} onClick={() => toggle(item.id)}>{item.name} <span className="font-normal opacity-75">PF {item.data.hitPointsCurrent}/{item.data.hitPointsMax}</span></Chip>)}</div></div>}
    {!characters.length && !beasts.length && <p className="text-sm text-ink-soft">Tutti i personaggi e le creature sono già nella Sessione.</p>}
    <Button tone="primary" disabled={pending || !selected.size} onClick={submit}>Aggiungi ({selected.size})</Button>
    <CreatureEditor open={creating} creature={null} addToSession onClose={() => setCreating(false)} onSaved={() => onClose()} />
  </div>;
}
