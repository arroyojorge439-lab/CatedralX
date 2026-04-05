import { pgTable, text, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paperTradesTable = pgTable("paper_trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  amountUsd: numeric("amount_usd", { precision: 18, scale: 2 }).notNull(),
  btcAmount: numeric("btc_amount", { precision: 18, scale: 8 }).notNull(),
  btcPrice: numeric("btc_price", { precision: 14, scale: 2 }).notNull(),
  strategy: text("strategy"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaperTradeSchema = createInsertSchema(paperTradesTable).omit({ id: true, createdAt: true });
export type InsertPaperTrade = z.infer<typeof insertPaperTradeSchema>;
export type PaperTrade = typeof paperTradesTable.$inferSelect;
