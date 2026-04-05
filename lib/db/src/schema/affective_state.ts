import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const affectiveStateTable = pgTable("affective_state", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  valencia: numeric("valencia", { precision: 4, scale: 3 }).notNull().default("0.5"),
  activacion: numeric("activacion", { precision: 4, scale: 3 }).notNull().default("0.3"),
  persistencia: numeric("persistencia", { precision: 4, scale: 3 }).notNull().default("0.5"),
  source: text("source").notNull().default("unknown"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAffectiveStateSchema = createInsertSchema(affectiveStateTable).omit({ id: true, createdAt: true });
export type InsertAffectiveState = z.infer<typeof insertAffectiveStateSchema>;
export type AffectiveState = typeof affectiveStateTable.$inferSelect;
