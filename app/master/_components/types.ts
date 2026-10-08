import type { Encounter } from "@/lib/db/schema";
import type { EventView } from "@/lib/masterEvents";
import type { CharacterView, CreatureView } from "@/lib/masterView";

export type SessionInfo = { id: string; name: string; localDate: string; notes: string; encounter: Encounter | null };
export type ClosedSessionInfo = { id: string; name: string; localDate: string; closedAt: string | null };

export type MasterData = {
  session: SessionInfo | null;
  party: CharacterView[];
  foes: CreatureView[];
  allCharacters: { id: string; name: string }[];
  library: CreatureView[];
  closed: ClosedSessionInfo[];
  events: EventView[];
};

export type Target = { kind: "pg"; id: string } | { kind: "cr"; id: string };

export type { CharacterView, CreatureView, EventView, Encounter };
