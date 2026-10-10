"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, useConfirm, useToast } from "@/components/ui";
import type { ActionResult } from "@/lib/masterCommand";
import { freshStartCharacters } from "../actions";

export function FreshStartControl({ characters }: { characters: { id: string; name: string }[] }) {
  const confirm = useConfirm();
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const run = () => startTransition(async () => {
    setError("");
    const result: ActionResult = await freshStartCharacters().catch(() => ({ ok: false, error: "Connessione non riuscita: riprova." }));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.show({ tone: "ok", title: `Fresh start applicato a ${result.details?.length ?? characters.length} personaggi` });
    router.refresh();
  });

  const submit = async () => {
    if (!characters.length || pending) return;
    const accepted = await confirm({
      title: "Fresh start per tutti i personaggi?",
      danger: true,
      confirmLabel: "Applica fresh start",
      message: <div className="space-y-2">
        <p>Tutti i personaggi registrati verranno portati ai PF massimi. Si azzerano PF temporanei, condizioni, Indebolimento, concentrazione, tiri/stato di morte, Dadi Vita, slot e risorse spesi.</p>
        <p>L&apos;Ispirazione Eroica viene riattivata per i personaggi Umani e tolta agli altri.</p>
        <ul className="max-h-40 list-disc overflow-y-auto pl-5">{characters.map((character) => <li key={character.id}>{character.name}</li>)}</ul>
      </div>,
    });
    if (accepted) run();
  };

  return <div className="flex flex-col gap-1.5">
    <Button tone="danger" className="min-h-14 w-full" disabled={!characters.length || pending} onClick={() => void submit()}>
      {pending ? "Reset in corso…" : "Fresh start personaggi"}
    </Button>
    {error && <p role="alert" className="text-sm text-danger-strong">{error}</p>}
  </div>;
}
