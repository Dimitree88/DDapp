"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { DeleteCharacter } from "./DeleteCharacter";

export function CharacterCard({
  id,
  name,
  hpMissing,
  conditions,
  inspiration,
  coins,
}: {
  id: string;
  name: string;
  hpMissing: number;
  conditions: string[];
  inspiration: boolean;
  coins: { key: "rame" | "argento" | "electrum" | "oro" | "platino"; label: string; amount: string }[];
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const start = useRef({ x: 0, y: 0 });

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
    else router.push(`/personaggio/${id}#equipaggiamento`);
  };

  return (
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
              {hpMissing > 0 && <span className="shrink-0 text-xs font-semibold text-danger-strong">−{hpMissing} PF</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {conditions.length > 0 && <span aria-label={`Condizioni: ${conditions.join(", ")}`} title={conditions.join(", ")}
                className="flex size-6 items-center justify-center rounded-full border border-danger/50 bg-danger/10 text-xs font-bold text-danger-strong">!</span>}
              {inspiration && <span aria-label="Ispirazione eroica" title="Ispirazione eroica" className="text-lg leading-none text-gold">★</span>}
              <span className="text-accent" aria-hidden>{revealed ? "" : "›"}</span>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {coins.map((coin) => <button key={coin.key} type="button" title={`${coin.amount} monete di ${coin.label.toLocaleLowerCase("it")}`}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onClick={(event) => { event.stopPropagation(); router.push(`/personaggio/${id}#monete`); }}
              aria-label={`${coin.amount} monete di ${coin.label.toLocaleLowerCase("it")}`}
              className={`flex size-8 items-center justify-center rounded-full border text-[10px] font-bold tabular-nums ${coinColors[coin.key]}`}>
              {coin.amount}
            </button>)}
          </div>
        </div>
      </div>
      {revealed && <DeleteCharacter id={id} name={name} />}
    </div>
  );
}

const coinColors: Record<"rame" | "argento" | "electrum" | "oro" | "platino", string> = {
  rame: "border-orange-700/60 bg-orange-700/15 text-orange-900",
  argento: "border-slate-400/70 bg-slate-200/70 text-slate-700",
  electrum: "border-yellow-500/70 bg-yellow-200/70 text-yellow-800",
  oro: "border-amber-500/80 bg-amber-300/60 text-amber-900",
  platino: "border-cyan-500/70 bg-cyan-100 text-cyan-800",
};
