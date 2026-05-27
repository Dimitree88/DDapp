import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type { Sheet } from "../sheet";

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
