"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { addCharacterEquipment, changeCharacterCoins } from "@/app/actions";
import { HpBar, Sheet as ModalSheet } from "@/components/ui";
import { compareOptionLabels } from "@/lib/sortOptions";
import { gearCatalog } from "@/lib/gearCatalog";
import type { Sheet } from "@/lib/sheet";
import { DeleteCharacter } from "./DeleteCharacter";

const quickAddObjects = gearCatalog.filter((gear) => !gear.contents?.length)
  .sort((a, b) => compareOptionLabels(a.name, b.name));
const coinEntries: { key: keyof Sheet["monete"]; label: string }[] = [
  { key: "rame", label: "Rame" }, { key: "argento", label: "Argento" },
  { key: "electrum", label: "Electrum" }, { key: "oro", label: "Oro" }, { key: "platino", label: "Platino" },
];

export function CharacterCard({
  id,
  name,
  hpCurrent,
  hpMax,
  hpTemp,
  conditions,
  inspiration,
  coinBalances,
  coins,
}: {
  id: string;
  name: string;
  hpCurrent: number | null;
  hpMax: number | null;
  hpTemp: number;
  conditions: string[];
  inspiration: boolean;
  coinBalances: Sheet["monete"];
  coins: { key: "rame" | "argento" | "electrum" | "oro" | "platino"; label: string; amount: string }[];
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [objectName, setObjectName] = useState("");
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [quantity, setQuantity] = useState("1");
  const [detail, setDetail] = useState("");
  const [addError, setAddError] = useState("");
  const [saving, setSaving] = useState(false);
  const [coinsOpen, setCoinsOpen] = useState(false);
  const [coinDraft, setCoinDraft] = useState(coinBalances);
  const [coinSaving, setCoinSaving] = useState(false);
  const [coinError, setCoinError] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("1");
  const [payDenomination, setPayDenomination] = useState<keyof Sheet["monete"]>("argento");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const suggestions = objectName.trim()
    ? quickAddObjects.filter((gear) => gear.name.toLocaleLowerCase("it").includes(objectName.trim().toLocaleLowerCase("it"))).slice(0, 8)
    : [];
  const chooseSuggestion = (gear: (typeof quickAddObjects)[number]) => {
    setObjectName(gear.name);
    setSelectedCatalogId(gear.id);
    setSuggestionsOpen(false);
  };

  const openCoins = (denomination: keyof Sheet["monete"]) => {
    setCoinDraft(coinBalances);
    setCoinError("");
    setPayOpen(false);
    setPayAmount("1");
    setPayDenomination(denomination);
    setCoinsOpen(true);
  };

  const updateCoin = async (key: keyof Sheet["monete"], delta: 1 | -1) => {
    if (coinSaving) return;
    const current = Number(coinDraft[key] || 0);
    const next = current + delta;
    if (!Number.isSafeInteger(current) || current < 0 || next < 0 || !Number.isSafeInteger(next)) return;
    const nextCoins = { ...coinDraft, [key]: String(next) };
    setCoinDraft(nextCoins);
    setCoinSaving(true);
    setCoinError("");
    try {
      const result = await changeCharacterCoins(id, { kind: "set", coins: nextCoins });
      if (!result.ok || !result.coins) {
        setCoinDraft(coinDraft);
        setCoinError(result.error ?? "Impossibile aggiornare le monete.");
      } else {
        setCoinDraft(result.coins);
        router.refresh();
      }
    } catch {
      setCoinDraft(coinDraft);
      setCoinError("Impossibile aggiornare le monete. Riprova.");
    } finally {
      setCoinSaving(false);
    }
  };

  const submitPayment = async () => {
    if (coinSaving) return;
    setCoinSaving(true);
    setCoinError("");
    try {
      const result = await changeCharacterCoins(id, { kind: "pay", amount: Number(payAmount), denomination: payDenomination });
      if (!result.ok || !result.coins) {
        setCoinError(result.error ?? "Impossibile completare il pagamento.");
      } else {
        setCoinDraft(result.coins);
        setPayOpen(false);
        setPayAmount("1");
        router.refresh();
      }
    } catch {
      setCoinError("Impossibile completare il pagamento. Riprova.");
    } finally {
      setCoinSaving(false);
    }
  };

  const cancelTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const onDown = (e: PointerEvent) => {
    longPressed.current = false;
    start.current = { x: e.clientX, y: e.clientY };
    cancelTimer();
    timer.current = setTimeout(() => {
      longPressed.current = true;
      setRevealed(true);
    }, 2000);
  };

  const onMove = (e: PointerEvent) => {
    if (!timer.current) return;
    if (Math.abs(e.clientX - start.current.x) > 10 || Math.abs(e.clientY - start.current.y) > 10)
      cancelTimer();
  };

  const onUp = () => {
    const wasLong = longPressed.current;
    cancelTimer();
    if (wasLong) return; // il long press ha rivelato il cestino: non navigare
    if (revealed) setRevealed(false);
    else router.push(`/personaggio/${id}`);
  };

  const submitEquipment = async () => {
    if (!objectName.trim()) return;
    setSaving(true);
    setAddError("");
    try {
      const result = await addCharacterEquipment(id, {
        ...(selectedCatalogId ? { catalogId: selectedCatalogId } : { nome: objectName.trim() }),
        quantita: Number(quantity),
        dettaglio: detail.trim(),
      });
      if (!result.ok) {
        setAddError(result.error ?? "Impossibile aggiungere l'oggetto.");
        return;
      }
      setAddOpen(false);
      setObjectName("");
      setSelectedCatalogId("");
      setSuggestionsOpen(false);
      setQuantity("1");
      setDetail("");
      router.refresh();
    } catch {
      setAddError("Impossibile aggiungere l'oggetto. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <div className="flex select-none items-stretch overflow-hidden rounded-xl border border-line bg-card/70 shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={cancelTimer}
        onPointerCancel={cancelTimer}
        onContextMenu={(e) => e.preventDefault()}
        style={{ WebkitTouchCallout: "none" }}
        className="flex flex-1 cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors active:bg-card"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate text-lg font-semibold text-ink">{name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {conditions.length > 0 && <span aria-label={`Condizioni: ${conditions.join(", ")}`} title={conditions.join(", ")}
                className="flex size-6 items-center justify-center rounded-full border border-danger/50 bg-danger/10 text-xs font-bold text-danger-strong">!</span>}
              {inspiration && <span aria-label="Ispirazione eroica" title="Ispirazione eroica" className="text-lg leading-none text-gold">★</span>}
              <span className="text-accent" aria-hidden>{revealed ? "" : "›"}</span>
            </span>
          </div>
          <div className="relative mt-1" role="img" aria-label={`Punti ferita: ${hpCurrent ?? "non registrati"}${hpMax !== null ? ` su ${hpMax}` : ""}`}>
            <HpBar current={hpCurrent} max={hpMax} temp={hpTemp} />
            <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-[9px] font-bold leading-none text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]">{hpCurrent ?? "—"}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {coins.map((coin) => <button key={coin.key} type="button" title={`${coin.amount} monete di ${coin.label.toLocaleLowerCase("it")}`}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => { event.stopPropagation(); openCoins(coin.key); }}
              aria-label={`${coin.amount} monete di ${coin.label.toLocaleLowerCase("it")}`}
              className={`flex size-8 items-center justify-center rounded-full border text-[10px] font-bold tabular-nums ${coinColors[coin.key]}`}>
              {coin.amount}
            </button>)}
            <button type="button" title={`Aggiungi oggetto all'equipaggiamento di ${name}`} aria-label={`Aggiungi oggetto all'equipaggiamento di ${name}`}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => { event.stopPropagation(); setAddError(""); setObjectName(""); setSelectedCatalogId(""); setSuggestionsOpen(false); setQuantity("1"); setDetail(""); setAddOpen(true); }}
              className="flex size-8 items-center justify-center rounded-full border border-accent/60 bg-accent/10 text-lg font-semibold leading-none text-accent active:bg-accent/20">+</button>
            <button type="button" title={`Apri equipaggiamento di ${name}`} aria-label={`Apri equipaggiamento di ${name}`}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => { event.stopPropagation(); router.push(`/personaggio/${id}#equipaggiamento`); }}
              className="flex size-8 items-center justify-center rounded-full border border-line bg-card text-ink-soft active:bg-parchment">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-4">
                <path d="M8 7V6a4 4 0 0 1 8 0v1M6 8l-1 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9l-1-2H6Z" />
                <path d="M9 8v2a3 3 0 0 0 6 0V8M9 15h6v4H9zM5 12h3m8 0h3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {revealed && <DeleteCharacter id={id} name={name} />}
    </div>
    <ModalSheet open={addOpen} onClose={() => { if (!saving) setAddOpen(false); }} title={`Aggiungi oggetto · ${name}`}
      subtitle="Scegli l’oggetto e indica quantità e descrizione facoltativa."
      footer={<div className="flex gap-2">
        <button type="button" disabled={saving} onClick={() => setAddOpen(false)} className="min-h-11 flex-1 rounded-lg border border-line px-4 text-sm font-semibold text-ink disabled:opacity-50">Annulla</button>
        <button type="button" disabled={saving || !objectName.trim() || !Number.isSafeInteger(Number(quantity)) || Number(quantity) < 1}
          onClick={() => void submitEquipment()} className="min-h-11 flex-1 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-40">{saving ? "Aggiunta…" : "Aggiungi"}</button>
      </div>}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 text-sm font-medium text-ink">
          <label htmlFor={`oggetto-home-${id}`}>Oggetto</label>
          <div className="relative">
            <input id={`oggetto-home-${id}`} autoFocus required role="combobox" aria-autocomplete="list"
              aria-expanded={suggestionsOpen && suggestions.length > 0} aria-controls={`oggetti-suggeriti-${id}`}
              aria-activedescendant={suggestionsOpen && suggestions[activeSuggestion] ? `oggetto-suggerito-${id}-${suggestions[activeSuggestion].id}` : undefined}
              value={objectName} onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => setSuggestionsOpen(false)}
              onChange={(event) => { setObjectName(event.target.value); setSelectedCatalogId(""); setActiveSuggestion(0); setSuggestionsOpen(true); }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSuggestionsOpen(false);
                else if (event.key === "ArrowDown" && suggestions.length) { event.preventDefault(); setSuggestionsOpen(true); setActiveSuggestion((index) => Math.min(index + 1, suggestions.length - 1)); }
                else if (event.key === "ArrowUp" && suggestions.length) { event.preventDefault(); setActiveSuggestion((index) => Math.max(index - 1, 0)); }
                else if (event.key === "Enter" && suggestionsOpen && suggestions[activeSuggestion]) { event.preventDefault(); chooseSuggestion(suggestions[activeSuggestion]); }
              }}
              placeholder="Cerca nel catalogo o scrivi un nome personalizzato"
              className="min-h-11 w-full rounded-lg border border-line bg-parchment px-3 text-base text-ink" />
            {suggestionsOpen && suggestions.length > 0 && <div id={`oggetti-suggeriti-${id}`} role="listbox" aria-label="Oggetti disponibili"
              className="absolute inset-x-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-lg border border-line bg-card shadow-lg">
              {suggestions.map((gear, index) => <button key={gear.id} id={`oggetto-suggerito-${id}-${gear.id}`} type="button" role="option" aria-selected={selectedCatalogId === gear.id || activeSuggestion === index}
                onPointerDown={(event) => event.preventDefault()}
                onPointerMove={() => setActiveSuggestion(index)}
                onClick={() => chooseSuggestion(gear)}
                className={`block min-h-11 w-full border-b border-line/60 px-3 py-2 text-left text-sm text-ink last:border-0 ${activeSuggestion === index ? "bg-parchment" : "hover:bg-parchment"}`}>
                {gear.name}
              </button>)}
            </div>}
          </div>
          <span className="text-xs font-normal text-ink-soft">Se non scegli un suggerimento e continui a scrivere, l’oggetto sarà personalizzato.</span>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">Quantità
          <input type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="min-h-11 rounded-lg border border-line bg-parchment px-3 text-base text-ink" />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-ink">Descrizione (facoltativa)
          <textarea value={detail} onChange={(event) => setDetail(event.target.value)} rows={3} className="rounded-lg border border-line bg-parchment px-3 py-2 text-base text-ink" />
        </label>
        {addError && <p role="alert" className="text-sm font-medium text-danger-strong">{addError}</p>}
      </div>
    </ModalSheet>
    <ModalSheet open={coinsOpen} onClose={() => { if (!coinSaving) setCoinsOpen(false); }} title={`Monete · ${name}`}
      footer={<div className="flex gap-2">
        <button type="button" disabled={coinSaving} onClick={() => setCoinsOpen(false)} className="min-h-11 flex-1 rounded-lg border border-line px-4 text-sm font-semibold text-ink disabled:opacity-50">Chiudi</button>
        <button type="button" disabled={coinSaving} onClick={() => setPayOpen((open) => !open)} className="min-h-11 flex-1 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent disabled:opacity-50">Paga</button>
      </div>}>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {coinEntries.map(({ key, label }) => {
            const count = Number(coinDraft[key] || 0);
            return <div key={key} className="flex min-w-0 items-center gap-1.5 rounded-xl border border-line bg-card/70 p-2">
              <span title={label} aria-label={`${label}: ${coinDraft[key]}`} className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold tabular-nums ${coinColors[key]}`}>{coinDraft[key] || "0"}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">{label}</span>
              <button type="button" aria-label={`Diminuisci ${label.toLowerCase()}`} disabled={coinSaving || !Number.isSafeInteger(count) || count <= 0}
                onClick={() => void updateCoin(key, -1)} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-parchment/70 text-lg text-accent disabled:opacity-40">−</button>
              <button type="button" aria-label={`Aumenta ${label.toLowerCase()}`} disabled={coinSaving || !Number.isSafeInteger(count) || count < 0 || count >= Number.MAX_SAFE_INTEGER}
                onClick={() => void updateCoin(key, 1)} className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-parchment/70 text-lg text-accent disabled:opacity-40">+</button>
            </div>;
          })}
        </div>
        {payOpen && <div className="flex flex-col gap-2 rounded-xl border border-line bg-card/70 p-3">
          <h3 className="text-sm font-semibold text-heading">Pagamento</h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs font-medium text-ink">Quantità
              <input type="number" min="1" step="1" inputMode="numeric" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} className="min-h-10 rounded-lg border border-line bg-parchment px-2 text-base text-ink" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-ink">Moneta
              <select value={payDenomination} onChange={(event) => setPayDenomination(event.target.value as keyof Sheet["monete"])} className="min-h-10 rounded-lg border border-line bg-parchment px-2 text-sm text-ink">
                {coinEntries.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
              </select>
            </label>
          </div>
          <button type="button" disabled={coinSaving || !Number.isSafeInteger(Number(payAmount)) || Number(payAmount) < 1}
            onClick={() => void submitPayment()} className="min-h-10 rounded-lg bg-accent px-3 text-sm font-semibold text-on-accent disabled:opacity-40">{coinSaving ? "Salvataggio…" : "Conferma pagamento"}</button>
        </div>}
        {coinError && <p role="alert" className="text-sm font-medium text-danger-strong">{coinError}</p>}
      </div>
    </ModalSheet>
    </>
  );
}

const coinColors: Record<"rame" | "argento" | "electrum" | "oro" | "platino", string> = {
  rame: "border-orange-700/60 bg-orange-700/15 text-orange-900",
  argento: "border-slate-400/70 bg-slate-200/70 text-slate-700",
  electrum: "border-yellow-500/70 bg-yellow-200/70 text-yellow-800",
  oro: "border-amber-500/80 bg-amber-300/60 text-amber-900",
  platino: "border-cyan-500/70 bg-cyan-100 text-cyan-800",
};
