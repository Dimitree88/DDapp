"use client";

import { useEffect, useState } from "react";
import { damageCharacter, damageCreature, healCharacter, healCreature, setTemporaryHp, type HpOutcome, type HpState } from "@/lib/masterRules";
import { useMaster, type PadMode, type PadRequest } from "./MasterContext";
import { Button, Sheet, TextInput, cx } from "@/components/ui";

const modes: { id: PadMode; label: string; tone: "danger" | "heal" | "temp" | "secondary" }[] = [
  { id: "danni", label: "Danno", tone: "danger" },
  { id: "guarigione", label: "Cura", tone: "heal" },
  { id: "pf-temporanei", label: "PF temp", tone: "temp" },
  { id: "pf-registra", label: "Imposta", tone: "secondary" },
];

const modeColor: Record<PadMode, string> = {
  danni: "bg-red-700 text-white border-red-700",
  guarigione: "bg-emerald-700 text-white border-emerald-700",
  "pf-temporanei": "bg-sky-700 text-white border-sky-700",
  "pf-registra": "bg-ink text-parchment border-ink",
};

export function HpPad({ request, onClose }: { request: PadRequest | null; onClose: () => void }) {
  return <Sheet open={Boolean(request)} onClose={onClose} title={request ? <PadTitle request={request} /> : ""}>
    {request && <PadBody key={`${request.target.kind}:${request.target.id}:${request.mode}:${request.amount ?? ""}`} request={request} onClose={onClose} />}
  </Sheet>;
}

function PadTitle({ request }: { request: PadRequest }) {
  const { nameOf } = useMaster();
  return <>{nameOf(request.target)}</>;
}

function PadBody({ request, onClose }: { request: PadRequest; onClose: () => void }) {
  const { data, command, pending } = useMaster();
  const [mode, setMode] = useState<PadMode>(request.mode);
  const [digits, setDigits] = useState(request.amount ? String(request.amount) : "");
  const [critical, setCritical] = useState(Boolean(request.critical));
  const [source, setSource] = useState(request.source ?? "");
  const [showSource, setShowSource] = useState(Boolean(request.source));
  const amount = Number(digits || 0);

  const character = request.target.kind === "pg" ? data.party.find((item) => item.id === request.target.id) : undefined;
  const creature = request.target.kind === "cr" ? data.foes.find((item) => item.id === request.target.id) : undefined;
  const state: HpState | null = character
    ? (character.hp === null || character.hpMax === null ? null : { current: character.hp, max: character.hpMax, temp: character.temp, saves: character.saves, death: character.death ?? undefined, conditions: character.conditions, concentration: character.concentration ?? undefined })
    : creature ? { current: creature.data.hitPointsCurrent, max: creature.data.hitPointsMax, temp: creature.data.hitPointsTemp ?? 0, saves: { successi: 0, fallimenti: 0 }, death: undefined, conditions: creature.data.conditions ?? [], concentration: creature.data.concentration } : null;

  const preview = ((): HpOutcome | { error: string } | null => {
    if (!state || amount <= 0 && mode !== "pf-registra" && mode !== "pf-temporanei") return null;
    try {
      if (mode === "danni") return character ? damageCharacter(state, amount, critical) : damageCreature(state, amount);
      if (mode === "guarigione") return character ? healCharacter(state, amount) : healCreature(state, amount);
      if (mode === "pf-temporanei") return digits === "" ? null : setTemporaryHp(state, amount, false);
      if (mode === "pf-registra") return digits === "" ? null : amount > state.max ? { error: `Massimo ${state.max}` } : { next: { ...state, current: amount }, details: [`PF: ${state.current} → ${amount}`], warnings: [] };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Non applicabile" };
    }
    return null;
  })();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === "INPUT") return;
      if (/^\d$/.test(event.key)) setDigits((value) => (value + event.key).replace(/^0+(?=\d)/, "").slice(0, 4));
      else if (event.key === "Backspace") setDigits((value) => value.slice(0, -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!state) return <p className="text-ink-soft">PF attuali o massimi da registrare nella scheda prima di usare questo comando.</p>;

  const press = (key: string) => {
    if (key === "⌫") setDigits((value) => value.slice(0, -1));
    else if (key === "C") setDigits("");
    else setDigits((value) => (value + key).replace(/^0+(?=\d)/, "").slice(0, 4));
  };

  const submit = async (keep = false) => {
    const params: Record<string, unknown> = { amount };
    if (mode === "danni") { params.critical = critical; if (source.trim()) params.source = source.trim(); }
    if (mode === "pf-temporanei") params.keep = keep;
    const result = await command(request.target, mode, params);
    if (result.ok) onClose();
  };

  const canSubmit = !pending && preview && !("error" in preview) && (mode === "pf-registra" || mode === "pf-temporanei" ? digits !== "" : amount > 0);
  const tempChoice = mode === "pf-temporanei" && state.temp > 0 && digits !== "";

  return <div className="flex flex-col gap-3">
    <div className="grid grid-cols-4 gap-1 rounded-2xl bg-parchment/70 p-1" role="tablist" aria-label="Tipo di modifica">
      {modes.map((item) => <button key={item.id} type="button" role="tab" aria-selected={mode === item.id} onClick={() => setMode(item.id)}
        className={cx("min-h-11 rounded-xl border text-sm font-bold", mode === item.id ? modeColor[item.id] : "border-transparent text-ink")}>{item.label}</button>)}
    </div>

    <div className="flex items-end justify-between gap-3 px-1">
      <div className="text-sm text-ink-soft">
        <div>PF <strong className="text-ink">{state.current}</strong> / {state.max}{state.temp ? <span className="text-sky-700"> · temp {state.temp}</span> : null}</div>
        {character?.death && <div className="font-semibold text-red-800">{character.death === "morto" ? "Morto" : character.death === "stabile" ? "Stabile a 0 PF" : `Tiri contro morte ✓${character.saves.successi} ✗${character.saves.fallimenti}`}</div>}
      </div>
      <output className={cx("min-w-28 rounded-2xl px-4 py-1 text-right text-5xl font-bold tabular-nums", digits ? "text-ink" : "text-ink-faint")} aria-live="polite">{digits || "0"}</output>
    </div>

    <div className="grid grid-cols-3 gap-2">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map((key) => <button key={key} type="button" onClick={() => press(key)}
        className={cx("min-h-14 rounded-2xl border border-line/60 text-2xl font-semibold active:bg-parchment", key === "C" || key === "⌫" ? "bg-parchment/60 text-ink-soft" : "bg-white text-ink")}
        aria-label={key === "⌫" ? "Cancella cifra" : key === "C" ? "Azzera" : key}>{key}</button>)}
    </div>

    {mode === "danni" && <div className="flex flex-wrap items-center gap-2">
      {character && state.current === 0 && <label className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-semibold"><input type="checkbox" checked={critical} onChange={(event) => setCritical(event.target.checked)} className="size-5 accent-red-700" />Colpo critico (2 fallimenti)</label>}
      {showSource ? <TextInput value={source} onChange={(event) => setSource(event.target.value)} placeholder="Fonte o tipo (facoltativo)" className="flex-1" />
        : <button type="button" onClick={() => setShowSource(true)} className="min-h-11 px-2 text-sm font-semibold text-accent">+ fonte/tipo</button>}
    </div>}

    {preview && <div className={cx("rounded-2xl px-3 py-2 text-sm", "error" in preview ? "bg-red-50 text-red-900" : "bg-white/70 text-ink")}>
      {"error" in preview ? preview.error : <>
        {preview.details.map((line, index) => <p key={index}>{line}</p>)}
        {preview.warnings.map((line, index) => <p key={`w${index}`} className="mt-1 rounded-lg bg-amber-100 px-2 py-1 font-semibold text-amber-900">⚠ {line}</p>)}
      </>}
    </div>}

    {tempChoice ? <div className="grid grid-cols-2 gap-2">
      <Button tone="secondary" disabled={!canSubmit} onClick={() => submit(true)}>Tieni {state.temp}</Button>
      <Button tone="temp" disabled={!canSubmit} onClick={() => submit(false)}>Usa {amount}</Button>
      <p className="col-span-2 text-xs text-ink-soft">I PF temporanei non si sommano: scegli quale valore tenere (p. 29).</p>
    </div> : <Button tone={modes.find((item) => item.id === mode)!.tone === "secondary" ? "primary" : modes.find((item) => item.id === mode)!.tone} className="min-h-14 text-lg" disabled={!canSubmit} onClick={() => submit(false)}>
      {pending ? "Salvo…" : mode === "danni" ? `Applica ${amount || ""} danni` : mode === "guarigione" ? `Cura ${amount || ""} PF` : mode === "pf-temporanei" ? `PF temporanei: ${digits || "—"}` : `Imposta PF a ${digits || "—"}`}
    </Button>}
  </div>;
}
