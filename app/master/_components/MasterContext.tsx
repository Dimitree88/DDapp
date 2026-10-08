"use client";

import { createContext, useCallback, useContext, useMemo, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/masterCommand";
import { characterCommand, creatureCommand, undoEvent } from "../game-actions";
import type { MasterData, Target } from "./types";
import { useToast, uuid } from "@/components/ui";

export type PadMode = "danni" | "guarigione" | "pf-temporanei" | "pf-registra";
export type Tool = { kind: "riposo-breve" | "riposo-lungo" | "pe" | "gruppo" | "aggiungi"; xp?: { amount: number; reason: string } };
export type PadRequest = { target: Target; mode: PadMode; amount?: number; critical?: boolean; source?: string };

type RunOptions = { quiet?: boolean; undoable?: boolean };

type MasterApi = {
  data: MasterData;
  sessionId: string;
  pending: boolean;
  run: (call: () => Promise<ActionResult>, options?: RunOptions) => Promise<ActionResult>;
  command: (target: Target, action: string, params?: Record<string, unknown>, options?: RunOptions) => Promise<ActionResult>;
  openPanel: (target: Target | null) => void;
  openPad: (request: PadRequest | null) => void;
  openTool: (tool: Tool | null) => void;
  nameOf: (target: Target) => string;
};

const MasterContext = createContext<MasterApi | null>(null);

export function useMaster() {
  const api = useContext(MasterContext);
  if (!api) throw new Error("useMaster fuori dalla Sessione");
  return api;
}

export function MasterProvider({ data, sessionId, openPanel, openPad, openTool, children }: { data: MasterData; sessionId: string; openPanel: (target: Target | null) => void; openPad: (request: PadRequest | null) => void; openTool: (tool: Tool | null) => void; children: ReactNode }) {
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const run = useCallback((call: () => Promise<ActionResult>, options: RunOptions = {}) => new Promise<ActionResult>((resolve) => {
    startTransition(async () => {
      let result: ActionResult;
      try { result = await call(); } catch { result = { ok: false, error: "Connessione non riuscita: riprova." }; }
      if (!result.ok) toast.show({ tone: "error", title: result.error });
      else if (!options.quiet && result.title) {
        const eventId = result.eventId;
        toast.show({
          tone: "ok", title: result.title, lines: result.details, warnings: result.warnings,
          undo: options.undoable !== false && eventId ? () => {
            startTransition(async () => {
              const undone = await undoEvent({ sessionId, eventId, commandId: uuid() }).catch(() => ({ ok: false as const, error: "Connessione non riuscita: riprova." }));
              toast.show(undone.ok ? { tone: "ok", title: undone.title ?? "Azione annullata" } : { tone: "error", title: undone.error });
            });
          } : undefined,
        });
      }
      resolve(result);
    });
  }), [sessionId, toast]);

  const command = useCallback((target: Target, action: string, params: Record<string, unknown> = {}, options?: RunOptions) => run(() => target.kind === "pg"
    ? characterCommand({ sessionId, characterId: target.id, commandId: uuid(), action, ...params })
    : creatureCommand({ sessionId, creatureId: target.id, commandId: uuid(), action, ...params }), options), [run, sessionId]);

  const nameOf = useCallback((target: Target) => (target.kind === "pg"
    ? data.party.find((item) => item.id === target.id)?.name
    : data.foes.find((item) => item.id === target.id)?.name) ?? "", [data]);

  const value = useMemo(() => ({ data, sessionId, pending, run, command, openPanel, openPad, openTool, nameOf }), [data, sessionId, pending, run, command, openPanel, openPad, openTool, nameOf]);
  return <MasterContext.Provider value={value}>{children}</MasterContext.Provider>;
}
