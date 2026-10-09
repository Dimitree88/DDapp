"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { closeSession, deleteSession, renameSession, saveSessionNotes } from "../actions";
import { undoEvent } from "../game-actions";
import { CharacterPanel } from "./CharacterPanel";
import { CreatureLibrary } from "./CreatureLibrary";
import { CreaturePanel } from "./CreaturePanel";
import { EventList } from "./EventList";
import { AddParticipantsSheet, RestSheet, XpSheet } from "./GroupSheets";
import { HpPad } from "./HpPad";
import { MasterProvider, useMaster, type PadRequest, type Tool } from "./MasterContext";
import { GroupActionSheet } from "./GroupAction";
import { PartyTab } from "./PartyTab";
import { TableTab } from "./TableTab";
import type { MasterData, Target } from "./types";
import { Button, Sheet, TextInput, cx, useConfirm, uuid } from "@/components/ui";

type Tab = "tavolo" | "gruppo" | "registro" | "note" | "altro";
const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "tavolo", label: "Tavolo", icon: "⚔" },
  { id: "gruppo", label: "Gruppo", icon: "☰" },
  { id: "registro", label: "Registro", icon: "↺" },
  { id: "note", label: "Note", icon: "✎" },
  { id: "altro", label: "Altro", icon: "⋯" },
];

const dateLabel = (date: string) => new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

export function SessionView({ data }: { data: MasterData }) {
  const session = data.session!;
  const [panel, setPanel] = useState<Target | null>(null);
  const [pad, setPad] = useState<PadRequest | null>(null);
  const [tab, setTab] = useState<Tab>("tavolo");
  const [tool, setTool] = useState<Tool | null>(null);
  const router = useRouter();

  // Aggiornamento periodico: mostra le modifiche fatte dai giocatori nelle schede.
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") router.refresh(); };
    const interval = setInterval(tick, 20000);
    window.addEventListener("focus", tick);
    return () => { clearInterval(interval); window.removeEventListener("focus", tick); };
  }, [router]);

  const openPanel = useCallback((target: Target | null) => setPanel(target), []);
  const openPad = useCallback((request: PadRequest | null) => setPad(request), []);
  const openTool = useCallback((next: Tool | null) => setTool(next), []);
  const character = panel?.kind === "pg" ? data.party.find((item) => item.id === panel.id) ?? null : null;
  const creature = panel?.kind === "cr" ? data.foes.find((item) => item.id === panel.id) ?? null : null;

  return <MasterProvider data={data} sessionId={session.id} openPanel={openPanel} openPad={openPad} openTool={openTool}>
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col">
      <header className="sticky top-0 z-30 flex h-[60px] items-center gap-2 border-b border-line/60 bg-parchment/95 px-3 backdrop-blur">
        <Link href="/" aria-label="Torna alla home" className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl text-ink-soft active:bg-card">⌂</Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold leading-tight text-ink">{session.name}</p>
          <p className="truncate text-xs text-ink-soft">{dateLabel(session.localDate)} · {data.party.length} PG · {data.foes.length} creature</p>
        </div>
        <PendingDot />
      </header>
      <main className="flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+84px)] pt-3">
        {tab === "tavolo" && <TableTab />}
        {tab === "gruppo" && <PartyTab />}
        {tab === "registro" && <LogTab />}
        {tab === "note" && <NotesTab key={session.id} initial={session.notes} />}
        {tab === "altro" && <MenuTab />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t [font-variant-ligatures:none] border-line/60 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Sezioni della Sessione">
        <ul className="mx-auto grid max-w-5xl grid-cols-5">
          {tabs.map((item) => <li key={item.id}><button type="button" onClick={() => { setTab(item.id); window.scrollTo({ top: 0 }); }} aria-current={tab === item.id ? "page" : undefined}
            className={cx("flex h-16 w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold", tab === item.id ? "text-accent" : "text-ink-soft")}>
            <span className={cx("flex h-7 w-12 items-center justify-center rounded-full text-lg", tab === item.id && "bg-accent/15")} aria-hidden>{item.icon}</span>{item.label}
          </button></li>)}
        </ul>
      </nav>
    </div>
    <CharacterPanel character={character} onClose={() => setPanel(null)} />
    <CreaturePanel creature={creature} onClose={() => setPanel(null)} />
    <HpPad request={pad} onClose={() => setPad(null)} />
    <RestSheet kind={tool?.kind === "riposo-breve" ? "breve" : tool?.kind === "riposo-lungo" ? "lungo" : null} onClose={() => setTool(null)} />
    <XpSheet key={tool?.xp ? `${tool.xp.amount}:${tool.xp.reason}` : "pe"} open={tool?.kind === "pe"} preset={tool?.xp ?? null} onClose={() => setTool(null)} />
    <AddParticipantsSheet open={tool?.kind === "aggiungi"} onClose={() => setTool(null)} />
    <GroupActionSheet open={tool?.kind === "gruppo"} onClose={() => setTool(null)} />
  </MasterProvider>;
}

function PendingDot() {
  const { pending } = useMaster();
  return <span className={cx("size-2.5 shrink-0 rounded-full transition-opacity", pending ? "animate-pulse bg-accent opacity-100" : "opacity-0")} aria-label={pending ? "Salvataggio in corso" : undefined} />;
}

function LogTab() {
  const { data, sessionId, run, pending } = useMaster();
  const names = [...data.party.map((item) => ({ id: item.id, name: item.name })), ...data.foes.map((item) => ({ id: item.id, name: item.name }))];
  return <EventList events={data.events} filterNames={names} undoDisabled={pending}
    onUndo={(event) => run(() => undoEvent({ sessionId, eventId: event.id, commandId: uuid() }))} />;
}

function NotesTab({ initial }: { initial: string }) {
  const { sessionId } = useMaster();
  const [notes, setNotes] = useState(initial);
  const [state, setState] = useState<"salvato" | "modificato" | "salvo" | "errore">("salvato");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(notes);
  const save = useCallback(async () => {
    setState("salvo");
    const result = await saveSessionNotes({ sessionId, notes: latest.current }).catch(() => ({ ok: false as const, error: "" }));
    setState(result.ok ? "salvato" : "errore");
  }, [sessionId]);
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); void saveSessionNotes({ sessionId, notes: latest.current }); } }, [sessionId]);
  return <div className="flex flex-col gap-2 pb-4">
    <div className="flex items-center justify-between"><h2 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Appunti della Sessione</h2><span className={cx("text-xs", state === "errore" ? "text-danger-strong" : "text-ink-soft")}>{state === "salvato" ? "Salvato" : state === "salvo" ? "Salvo…" : state === "errore" ? "Non salvato: riprova" : "Modificato"}</span></div>
    <textarea value={notes} rows={18} placeholder="Scene, luoghi, PNG incontrati, decisioni, cose da riprendere…" aria-label="Appunti della Sessione"
      onChange={(event) => {
        setNotes(event.target.value);
        latest.current = event.target.value;
        setState("modificato");
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { timer.current = null; void save(); }, 900);
      }}
      onBlur={() => { if (timer.current) { clearTimeout(timer.current); timer.current = null; void save(); } }}
      className="min-h-[50dvh] rounded-2xl border border-line bg-surface/90 p-3 text-base leading-relaxed text-ink" />
    <p className="text-xs text-ink-soft">Visibili a chiunque apra la pagina Master. Salvataggio automatico.</p>
  </div>;
}

function MenuTab() {
  const { data, sessionId, run, pending, openTool } = useMaster();
  const confirm = useConfirm();
  const router = useRouter();
  const readyIds = data.party.filter((item) => item.levelReady).map((item) => item.id);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(data.session!.name);
  const item = "flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line/60 bg-card/90 px-4 text-left text-[15px] font-semibold text-ink active:bg-card";

  return <div className="flex flex-col gap-5 pb-4">
    <section className="grid grid-cols-2 gap-2">
      <button type="button" className={item} onClick={() => openTool({ kind: "riposo-breve" })}><span aria-hidden>☕</span>Riposo breve</button>
      <button type="button" className={item} onClick={() => openTool({ kind: "riposo-lungo" })}><span aria-hidden>☾</span>Riposo lungo</button>
      <button type="button" className={item} onClick={() => openTool({ kind: "pe" })}><span aria-hidden>✦</span>Punti esperienza</button>
      <button type="button" className={item} onClick={() => openTool({ kind: "aggiungi" })}><span aria-hidden>＋</span>Aggiungi</button>
      {readyIds.length > 0 && <p className="col-span-2 rounded-2xl border border-warn/70 bg-warn/15 px-4 py-3 text-sm text-warn-ink">⬆ Possono salire di livello: <strong>{data.party.filter((member) => member.levelReady).map((member) => member.name).join(", ")}</strong>. Ogni giocatore lo fa dalla propria scheda.</p>}
    </section>

    <CreatureLibrary title="Libreria creature" creatures={data.library} />

    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Sessione</h2>
      <button type="button" className={item} onClick={() => setRenaming(true)}>✎ Rinomina «{data.session!.name}»</button>
      <button type="button" className={item} disabled={pending} onClick={async () => {
        if (!await confirm({ title: "Chiudere la Sessione?", message: "Il registro e un riepilogo finale vengono archiviati. Potrai riaprirla dall'archivio.", confirmLabel: "Chiudi Sessione" })) return;
        const result = await run(() => closeSession({ sessionId }), { quiet: true });
        if (result.ok) router.push(`/master/sessione/${sessionId}`);
      }}>⏹ Chiudi Sessione</button>
      <button type="button" className={cx(item, "text-danger-strong")} disabled={pending} onClick={async () => {
        if (!await confirm({ title: "Eliminare la Sessione?", danger: true, confirmLabel: "Elimina definitivamente", message: <>Spariscono registro, appunti e riepilogo di «{data.session!.name}». <strong>Le schede dei personaggi e delle creature restano come sono ora</strong>: le modifiche già applicate non vengono annullate.</> })) return;
        await run(() => deleteSession({ sessionId }), { quiet: true });
      }}>🗑 Elimina Sessione</button>
    </section>

    {data.closed.length > 0 && <section className="flex flex-col gap-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-heading rule-tapered font-display">Archivio</h2>
      <ul className="flex flex-col gap-1.5">{data.closed.slice(0, 8).map((closed) => <li key={closed.id}><Link href={`/master/sessione/${closed.id}`} className="flex min-h-12 items-center justify-between rounded-xl bg-surface/70 px-4 text-sm"><span className="font-semibold text-ink">{closed.name}</span><span className="text-ink-soft">{dateLabel(closed.localDate)} ›</span></Link></li>)}</ul>
    </section>}

    <Sheet open={renaming} onClose={() => setRenaming(false)} title="Rinomina Sessione"
      footer={<Button tone="primary" className="w-full" disabled={!name.trim() || pending} onClick={async () => { const result = await run(() => renameSession({ sessionId, name }), { quiet: true }); if (result.ok) setRenaming(false); }}>Salva</Button>}>
      <TextInput value={name} onChange={(event) => setName(event.target.value)} maxLength={120} className="w-full" aria-label="Nome della Sessione" autoFocus />
    </Sheet>
  </div>;
}
