import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import type { Sheet } from "../sheet";
import type { HistoryChange } from "../history";

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

export const characterHistory = sqliteTable("character_history", {
  id: text("id").primaryKey(),
  characterId: text("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  occurredAt: integer("occurred_at", { mode: "timestamp" }).notNull(),
  changes: text("changes", { mode: "json" }).notNull().$type<HistoryChange[]>(),
}, (table) => [index("character_history_character_time_idx").on(table.characterId, table.occurredAt)]);
