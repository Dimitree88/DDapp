"use client";

import { useState } from "react";
import { createCharacter } from "@/app/actions";

const inputCls =
  "w-full rounded-lg border border-line bg-card/70 px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none";

export function NewCharacter() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-line px-4 py-3 text-base font-semibold text-ink-soft transition-colors active:bg-card/60"
      >
        + Nuovo personaggio
      </button>
    );
  }

  return (
    <form action={createCharacter} className="flex flex-col gap-3">
      <input name="name" required autoFocus placeholder="Nome del personaggio" className={inputCls} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-lg border border-line px-4 py-3 text-base text-ink-soft"
        >
          Annulla
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-accent px-4 py-3 text-base font-semibold text-parchment transition-colors active:bg-accent-strong"
        >
          Crea personaggio
        </button>
      </div>
    </form>
  );
}
