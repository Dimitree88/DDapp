"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { DeleteCharacter } from "./DeleteCharacter";

export function CharacterCard({
  id,
  name,
  livello,
  classe,
}: {
  id: string;
  name: string;
  livello: string;
  classe: string;
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
    else router.push(`/personaggio/${id}`);
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
        className="flex flex-1 cursor-pointer items-center justify-between px-4 py-4 transition-colors active:bg-card"
      >
        <div>
          <div className="text-lg font-semibold text-ink">{name}</div>
          <div className="text-sm text-ink-soft">
            Liv. {livello || "—"}
            {classe ? ` · ${classe}` : ""}
          </div>
        </div>
        <span className="text-accent">{revealed ? "" : "›"}</span>
      </div>
      {revealed && <DeleteCharacter id={id} name={name} />}
    </div>
  );
}
