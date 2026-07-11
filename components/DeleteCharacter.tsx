"use client";

import { deleteCharacter } from "@/app/actions";

export function DeleteCharacter({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteCharacter.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm(`Eliminare "${name}"? L'operazione è irreversibile.`))
          e.preventDefault();
      }}
      className="flex"
    >
      <button
        type="submit"
        aria-label={`Elimina ${name}`}
        className="flex items-center rounded-r-xl border-l border-line px-4 text-ink-faint transition-colors active:bg-red-900/10 active:text-red-800"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v7M14 10v7" />
        </svg>
      </button>
    </form>
  );
}
