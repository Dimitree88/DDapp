"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/masterCommand";
import { createSession, deleteSession, reopenSession } from "../actions";
import { CreatureLibrary } from "./CreatureLibrary";
import { SessionView } from "./SessionView";
import type { ClosedSessionInfo, MasterData } from "./types";
import { Button, Chip, ConfirmProvider, Field, Sheet, TextInput, ToastProvider, useConfirm, useToast } from "@/components/ui";

export function MasterApp({ data }: { data: MasterData }) {
  return <ToastProvider><ConfirmProvider>
    {data.session ? <SessionView key={data.session.id} data={data} /> : <Lobby data={data} />}
  </ConfirmProvider></ToastProvider>;
}

const dateLabel = (date: string) => new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

function useAction() {
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const run = (call: () => Promise<ActionResult>) => new Promise<ActionResult>((resolve) => startTransition(async () => {
    const result = await call().catch((): ActionResult => ({ ok: false, error: "Connessione non riuscita: riprova." }));
    if (!result.ok) toast.show({ tone: "error", title: result.error });
    resolve(result);
  }));
  return { pending, run };
}

function Lobby({ data }: { data: MasterData }) {
  const [creating, setCreating] = useState(false);
  return <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pb-10 pt-4">
    <header className="flex items-center gap-2">
      <Link href="/" aria-label="Torna alla home" className="flex size-11 items-center justify-center rounded-full text-xl text-ink-soft active:bg-card">⌂</Link>
      <h1 className="text-xl font-bold text-heading">Master</h1>
    </header>
    <button type="button" onClick={() => setCreating(true)} className="flex min-h-20 items-center justify-between rounded-3xl bg-accent px-5 text-left text-on-accent shadow-md active:bg-accent-strong">
      <span><span className="block text-xl font-bold">Nuova Sessione</span><span className="text-sm opacity-85">Scegli i partecipanti e inizia a giocare</span></span>
      <span className="text-3xl" aria-hidden>›</span>
    </button>
    <Archive closed={data.closed} />
    <CreatureLibrary title="Libreria creature" creatures={data.library} />
    <NewSessionSheet open={creating} onClose={() => setCreating(false)} data={data} />
  </main>;
}

function Archive({ closed }: { closed: ClosedSessionInfo[] }) {
  const { pending, run } = useAction();
  const confirm = useConfirm();
  const toast = useToast();
  return <section className="flex flex-col gap-2">
    <h2 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Sessioni archiviate</h2>
    {closed.length ? <ul className="flex flex-col gap-1.5">{closed.map((session) => <li key={session.id} className="flex items-center gap-1 rounded-2xl bg-surface/70 pr-1">
      <Link href={`/master/sessione/${session.id}`} className="flex min-h-14 min-w-0 flex-1 flex-col justify-center px-4">
        <span className="truncate font-semibold text-ink">{session.name}</span>
        <span className="text-xs text-ink-soft">{dateLabel(session.localDate)}</span>
      </Link>
      <Button tone="ghost" className="px-3 text-sm" disabled={pending} onClick={async () => {
        const result = await run(() => reopenSession({ sessionId: session.id }));
        if (result.ok) toast.show({ tone: "ok", title: `«${session.name}» riaperta` });
      }}>Riapri</Button>
      <Button tone="ghost" className="px-3 text-sm text-danger-strong" disabled={pending} aria-label={`Elimina ${session.name}`} onClick={async () => {
        if (!await confirm({ title: `Eliminare «${session.name}»?`, danger: true, confirmLabel: "Elimina definitivamente", message: <>Spariscono registro, appunti e riepilogo. <strong>Le schede restano come sono ora.</strong></> })) return;
        const result = await run(() => deleteSession({ sessionId: session.id }));
        if (result.ok) toast.show({ tone: "ok", title: "Sessione eliminata" });
      }}>🗑</Button>
    </li>)}</ul> : <p className="rounded-xl bg-surface/60 px-4 py-3 text-sm text-ink-soft">Nessuna Sessione archiviata.</p>}
  </section>;
}

function NewSessionSheet({ open, onClose, data }: { open: boolean; onClose: () => void; data: MasterData }) {
  return <Sheet open={open} onClose={onClose} title="Nuova Sessione" subtitle={`Data: ${new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeZone: "Europe/Rome" }).format(new Date())}`}>
    {open && <NewSessionBody data={data} onClose={onClose} />}
  </Sheet>;
}

function defaultSessionName() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", timeZone: "Europe/Rome" }).formatToParts(new Date()).map((part) => [part.type, part.value]));
  const day = Number(parts.day);
  const article = day === 8 || day === 11 ? "dell'" : "del ";
  return `Sessione ${article}${day === 1 ? "1°" : day} ${parts.month}`;
}

function NewSessionBody({ data, onClose }: { data: MasterData; onClose: () => void }) {
  const router = useRouter();
  const { pending, run } = useAction();
  const [name, setName] = useState(defaultSessionName);
  const [people, setPeople] = useState<Set<string>>(() => new Set(data.allCharacters.map((item) => item.id)));
  const [beasts, setBeasts] = useState<Set<string>>(new Set());
  const toggle = (setter: typeof setPeople, id: string) => setter((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const submit = async () => {
    const result = await run(() => createSession({ name, characterIds: [...people], creatureIds: [...beasts] }));
    if (result.ok) { onClose(); router.refresh(); }
  };
  return <div className="flex flex-col gap-5">
    <Field label="Nome"><TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={120} /></Field>
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between"><h3 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Personaggi ({people.size})</h3>
        <Button tone="ghost" className="text-sm" onClick={() => setPeople(people.size === data.allCharacters.length ? new Set() : new Set(data.allCharacters.map((item) => item.id)))}>{people.size === data.allCharacters.length ? "Nessuno" : "Tutti"}</Button></div>
      <div className="flex flex-wrap gap-1.5">{data.allCharacters.map((item) => <Chip key={item.id} active={people.has(item.id)} onClick={() => toggle(setPeople, item.id)}>{item.name}</Chip>)}</div>
      {!data.allCharacters.length && <p className="text-sm text-ink-soft">Nessun personaggio registrato.</p>}
    </div>
    {data.library.length > 0 && <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Creature ({beasts.size})</h3>
      <div className="flex flex-wrap gap-1.5">{data.library.map((item) => <Chip key={item.id} active={beasts.has(item.id)} onClick={() => toggle(setBeasts, item.id)}>{item.name}</Chip>)}</div>
      <p className="text-xs text-ink-soft">Potrai aggiungere creature e personaggi anche a Sessione iniziata.</p>
    </div>}
    <Button tone="primary" className="min-h-14 text-lg" disabled={pending || !name.trim() || (!people.size && !beasts.size)} onClick={submit}>{pending ? "Creo…" : "Inizia Sessione"}</Button>
  </div>;
}
