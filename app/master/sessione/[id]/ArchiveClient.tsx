"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteSession, reopenSession } from "../../actions";
import { EventList } from "../../_components/EventList";
import type { EventView } from "../../_components/types";
import { Button, ConfirmProvider, ToastProvider, useConfirm, useToast } from "@/components/ui";

export function ArchiveActions(props: { sessionId: string; name: string; openName: string | null }) {
  return <ToastProvider><ConfirmProvider><Actions {...props} /></ConfirmProvider></ToastProvider>;
}

function Actions({ sessionId, name, openName }: { sessionId: string; name: string; openName: string | null }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return <div className="flex flex-col gap-2">
    <div className="grid grid-cols-2 gap-2">
      <Button tone="primary" disabled={pending || Boolean(openName)} onClick={() => startTransition(async () => {
        const result = await reopenSession({ sessionId }).catch(() => ({ ok: false as const, error: "Connessione non riuscita: riprova." }));
        if (result.ok) router.push("/master"); else toast.show({ tone: "error", title: result.error });
      })}>↺ Riapri Sessione</Button>
      <Button tone="danger" disabled={pending} onClick={async () => {
        if (!await confirm({ title: `Eliminare «${name}»?`, danger: true, confirmLabel: "Elimina definitivamente", message: <>Spariscono registro, appunti e riepilogo. <strong>Le schede restano come sono ora</strong>: le modifiche già applicate non vengono annullate.</> })) return;
        startTransition(async () => {
          const result = await deleteSession({ sessionId }).catch(() => ({ ok: false as const, error: "Connessione non riuscita: riprova." }));
          if (result.ok) router.push("/master"); else toast.show({ tone: "error", title: result.error });
        });
      }}>🗑 Elimina</Button>
    </div>
    {openName && <p className="text-sm text-ink-soft">Per riaprirla chiudi prima la Sessione aperta «{openName}».</p>}
  </div>;
}

export function ArchiveLog({ events }: { events: EventView[] }) {
  return <EventList events={events} />;
}
