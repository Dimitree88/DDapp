"use client";

import { useState } from "react";
import { conditionNames, rollFormula } from "@/lib/masterRules";
import { groupCommand } from "../game-actions";
import { useMaster } from "./MasterContext";
import { Button, Chip, Field, NumberInput, Sheet, TextInput, cx, uuid } from "@/components/ui";

type Mode = "danni" | "guarigione" | "condizione";
const modeLabels: Record<Mode, string> = { danni: "Danno", guarigione: "Cura", condizione: "Condizione" };

export function GroupActionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <Sheet open={open} onClose={onClose} title="Azione su più bersagli" subtitle="Danni ad area: un solo tiro per tutti, metà a chi supera il TS (p. 28)">
    {open && <GroupBody onClose={onClose} />}
  </Sheet>;
}

function GroupBody({ onClose }: { onClose: () => void }) {
  const { data, sessionId, run, pending } = useMaster();
  const [mode, setMode] = useState<Mode>("danni");
  const [amount, setAmount] = useState("");
  const [formula, setFormula] = useState("");
  const [rolled, setRolled] = useState("");
  const [source, setSource] = useState("");
  const [duration, setDuration] = useState("");
  const [condition, setCondition] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [half, setHalf] = useState<Set<string>>(new Set());
  const value = Number(amount || 0);
  const targets = [
    ...data.party.filter((item) => item.death !== "morto").map((item) => ({ key: `pg:${item.id}`, kind: "pg" as const, id: item.id, name: item.name, hp: item.hp, max: item.hpMax, enemy: false })),
    ...data.foes.filter((item) => item.data.hitPointsCurrent > 0 || mode === "guarigione").map((item) => ({ key: `cr:${item.id}`, kind: "cr" as const, id: item.id, name: item.name, hp: item.data.hitPointsCurrent, max: item.data.hitPointsMax, enemy: true })),
  ];
  const toggle = (setter: typeof setSelected, key: string) => setter((current) => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const roll = () => {
    const result = rollFormula(formula);
    if (!result) { setRolled("Formula non valida"); return; }
    setAmount(String(result.total));
    setRolled(`${formula}: ${result.text} = ${result.total}`);
  };
  const submit = async () => {
    const result = await run(() => groupCommand({
      sessionId, commandId: uuid(), mode, amount: value, condition, source, duration,
      targets: targets.filter((item) => selected.has(item.key)).map((item) => ({ kind: item.kind, id: item.id, half: half.has(item.key) })),
    }));
    if (result.ok) onClose();
  };
  const invalid = !selected.size || (mode === "condizione" ? !condition : value <= 0);

  return <div className="flex flex-col gap-3">
    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-parchment/70 p-1">
      {(Object.keys(modeLabels) as Mode[]).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={cx("min-h-11 rounded-xl text-sm font-bold", mode === item ? item === "danni" ? "bg-red-700 text-white" : item === "guarigione" ? "bg-emerald-700 text-white" : "bg-accent text-white" : "text-ink")}>{modeLabels[item]}</button>)}
    </div>
    {mode !== "condizione" ? <>
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <Field label={mode === "danni" ? "Danno (già calcolato)" : "PF recuperati"}><NumberInput value={amount} onChange={setAmount} className="text-2xl font-bold" placeholder="0" /></Field>
      </div>
      <div className="flex items-end gap-2">
        <Field label="Oppure tira una formula" className="flex-1"><TextInput value={formula} onChange={(event) => setFormula(event.target.value)} placeholder="Es. 8d6" /></Field>
        <Button disabled={!formula.trim()} onClick={roll}>🎲</Button>
      </div>
      {rolled && <p className="text-sm text-ink-soft">{rolled}</p>}
      <Field label="Fonte (facoltativa)"><TextInput value={source} onChange={(event) => setSource(event.target.value)} placeholder="Es. Palla di fuoco" /></Field>
    </> : <>
      <div className="flex flex-wrap gap-1.5">{conditionNames.map((name) => <Chip key={name} active={condition === name} onClick={() => setCondition(condition === name ? "" : name)}>{name}</Chip>)}</div>
      <div className="grid grid-cols-2 gap-2">
        <TextInput value={source} onChange={(event) => setSource(event.target.value)} placeholder="Fonte" aria-label="Fonte della condizione" />
        <TextInput value={duration} onChange={(event) => setDuration(event.target.value)} placeholder="Durata" aria-label="Durata della condizione" />
      </div>
    </>}
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-ink">Bersagli ({selected.size})</p>
      <div className="flex gap-1">
        <Button tone="ghost" className="min-h-9 px-2 text-sm" onClick={() => setSelected(new Set(targets.filter((item) => !item.enemy).map((item) => item.key)))}>PG</Button>
        <Button tone="ghost" className="min-h-9 px-2 text-sm" onClick={() => setSelected(new Set(targets.filter((item) => item.enemy).map((item) => item.key)))}>Nemici</Button>
        <Button tone="ghost" className="min-h-9 px-2 text-sm" onClick={() => setSelected(new Set())}>Nessuno</Button>
      </div>
    </div>
    <ul className="flex flex-col gap-1.5">
      {targets.map((item) => {
        const on = selected.has(item.key);
        const taken = mode === "danni" && on ? (half.has(item.key) ? Math.floor(value / 2) : value) : 0;
        return <li key={item.key} className={cx("flex items-center gap-2 rounded-xl border p-1.5", item.enemy ? "border-red-200 bg-red-50/60" : "border-line/60 bg-white/80")}>
          <label className="flex min-h-10 min-w-0 flex-1 items-center gap-2">
            <input type="checkbox" checked={on} onChange={() => toggle(setSelected, item.key)} className="size-6 shrink-0 accent-accent" />
            <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-ink">{item.name}</span><span className="text-xs text-ink-soft">PF {item.hp ?? "—"}/{item.max ?? "—"}{taken ? ` · −${taken}` : ""}</span></span>
          </label>
          {mode === "danni" && on && <button type="button" onClick={() => toggle(setHalf, item.key)} className={cx("min-h-10 shrink-0 rounded-lg border px-2.5 text-xs font-bold", half.has(item.key) ? "border-sky-700 bg-sky-700 text-white" : "border-line bg-white text-ink")}>{half.has(item.key) ? "TS ok: metà" : "TS fallito"}</button>}
        </li>;
      })}
    </ul>
    <Button tone={mode === "danni" ? "danger" : mode === "guarigione" ? "heal" : "primary"} className="min-h-14 text-lg" disabled={pending || invalid} onClick={submit}>
      {mode === "condizione" ? `Applica ${condition || "condizione"} (${selected.size})` : `${mode === "danni" ? "Applica" : "Cura"} ${value || ""} a ${selected.size}`}
    </Button>
  </div>;
}
