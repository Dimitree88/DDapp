import { sqliteTable, text, integer, index, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import type { Sheet } from "../sheet";
import type { HistoryChange } from "../history";
import type { CreatureData } from "../creature";

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  pinHash: text("pin_hash").notNull(),
  data: text("data", { mode: "json" }).notNull().$type<Sheet>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type CharacterRow = typeof characters.$inferSelect;

export const creatures = sqliteTable("creatures", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  data: text("data", { mode: "json" }).notNull().$type<CreatureData>(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type CreatureRow = typeof creatures.$inferSelect;

export const masterSessions = sqliteTable("master_sessions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  localDate: text("local_date").notNull(),
  status: text("status", { enum: ["aperta", "chiusa"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  closedAt: integer("closed_at", { mode: "timestamp" }),
}, (table) => [
  uniqueIndex("master_sessions_single_open_idx").on(table.status).where(sql`${table.status} = 'aperta'`),
  index("master_sessions_status_created_idx").on(table.status, table.createdAt),
]);

export const masterSessionParticipants = sqliteTable("master_session_participants", {
  sessionId: text("session_id").notNull().references(() => masterSessions.id, { onDelete: "cascade" }),
  characterId: text("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.sessionId, table.characterId] })]);

export const masterSessionEvents = sqliteTable("master_session_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => masterSessions.id),
  characterId: text("character_id").references(() => characters.id),
  type: text("type").notNull(),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  payload: text("payload", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
}, (table) => [index("master_session_events_session_time_idx").on(table.sessionId, table.occurredAt)]);

export const characterHistory = sqliteTable("character_history", {
  id: text("id").primaryKey(),
  characterId: text("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  changes: text("changes", { mode: "json" }).notNull().$type<HistoryChange[]>(),
}, (table) => [index("character_history_character_time_idx").on(table.characterId, table.occurredAt)]);
