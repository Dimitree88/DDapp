// Descrizione leggibile degli eventi di Sessione, compatibile con i formati
// registrati dalle versioni precedenti della vista Master.

export type EventRow = {
  id: string;
  type: string;
  occurredAt: Date;
  characterId: string | null;
  creatureId: string | null;
  payload: Record<string, unknown>;
};

export type EventView = {
  id: string;
  type: string;
  at: string;
  subject: string;
  title: string;
  lines: string[];
  warnings: string[];
  undoable: boolean;
  undone: boolean;
  targetIds: string[];
};

const legacyTitles: Record<string, string> = {
  sessione_creata: "Sessione creata", sessione_chiusa: "Sessione chiusa", sessione_riaperta: "Sessione riaperta",
  partecipanti_aggiornati: "Partecipanti aggiornati", riposo_breve_gruppo: "Riposo breve del gruppo", riposo_lungo_gruppo: "Riposo lungo del gruppo",
  creatura_danni: "Danni alla creatura", creatura_guarigione: "Creatura guarita", "creatura_pf-registra": "PF della creatura registrati",
  danni: "Danni subiti", guarigione: "PF recuperati", "pf-registra": "PF registrati", "pf-temporanei": "PF temporanei aggiornati",
  "ispirazione-conferisci": "Ispirazione eroica conferita", "ispirazione-spendi": "Ispirazione eroica spesa",
  "condizione-aggiungi": "Condizione aggiunta", "condizione-rimuovi": "Condizione rimossa",
  "risorsa-usa": "Risorsa usata", "slot-usa": "Slot usato", "tiro-morte": "Tiro salvezza contro morte",
  stabilizza: "Personaggio stabilizzato", "indebolimento-registra": "Indebolimento registrato", "indebolimento-su": "Indebolimento aumentato", "indebolimento-giu": "Indebolimento ridotto",
  "concentrazione-imposta": "Concentrazione registrata", "concentrazione-termina": "Concentrazione terminata",
};

const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];

type Change = { field: string; before: string; after: string };
const changeList = (value: unknown): Change[] => Array.isArray(value) ? value.filter((item): item is Change =>
  Boolean(item && typeof item === "object" && typeof (item as Change).field === "string")) : [];

export function describeEvents(rows: EventRow[], names: Map<string, string>): EventView[] {
  const undone = new Set(rows.filter((row) => row.type === "annullamento").map((row) => row.payload.revertsEventId).filter((id): id is string => typeof id === "string"));
  return rows.map((row) => {
    const payload = row.payload;
    const targets = Array.isArray(payload.targets) ? payload.targets as { id?: string; name?: string }[] : [];
    const targetIds = [...new Set([row.characterId, row.creatureId, ...targets.map((target) => target?.id)].filter((id): id is string => typeof id === "string"))];
    const subject = typeof payload.characterName === "string" ? payload.characterName
      : typeof payload.creatureName === "string" ? payload.creatureName
      : row.characterId ? names.get(row.characterId) ?? ""
      : row.creatureId ? names.get(row.creatureId) ?? ""
      : targets.length > 2 ? `${targets.length} partecipanti`
      : targets.length > 1 ? targets.map((target) => target?.name).filter(Boolean).join(", ")
      : "";
    const title = typeof payload.title === "string" ? payload.title : legacyTitles[row.type] ?? row.type.replaceAll("_", " ");
    const lines = strings(payload.details);
    if (!lines.length) {
      const changes = changeList(payload.changes);
      lines.push(...changes.slice(0, 6).map((change) => `${change.field}: ${change.before} → ${change.after}`));
      if (changes.length > 6) lines.push(`… e altre ${changes.length - 6} modifiche`);
    }
    if (Array.isArray(payload.participants) && row.type !== "sessione_chiusa") {
      for (const participant of payload.participants as { name?: unknown; details?: unknown }[]) {
        if (typeof participant?.name === "string") lines.push(`${participant.name}${strings(participant.details).length ? `: ${strings(participant.details).join("; ")}` : ""}`);
      }
    }
    const before = payload.before as { hitPointsCurrent?: unknown } | undefined;
    const after = payload.after as { hitPointsCurrent?: unknown } | undefined;
    if (!lines.length && Number.isInteger(before?.hitPointsCurrent) && Number.isInteger(after?.hitPointsCurrent) && before?.hitPointsCurrent !== after?.hitPointsCurrent) {
      lines.push(`PF: ${before?.hitPointsCurrent} → ${after?.hitPointsCurrent}`);
    }
    if (typeof payload.note === "string" && payload.note) lines.push(payload.note);
    const undo = payload.undo as { targets?: unknown[] } | undefined;
    return {
      id: row.id, type: row.type, at: row.occurredAt.toISOString(), subject, title, lines,
      warnings: strings(payload.warnings),
      undoable: Boolean(undo?.targets?.length), undone: undone.has(row.id), targetIds,
    };
  });
}
