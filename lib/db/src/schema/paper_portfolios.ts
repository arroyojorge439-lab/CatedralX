import { pgTable, serial, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paperPortfoliosTable = pgTable("paper_portfolios", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  balanceUsd: numeric("balance_usd", { precision: 18, scale: 2 }).notNull().default("100000"),
  btcAmount: numeric("btc_amount", { precision: 18, scale: 8 }).notNull().default("0"),
  totalTrades: integer("total_trades").notNull().default(0),
  winningTrades: integer("winning_trades").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPaperPortfolioSchema = createInsertSchema(paperPortfoliosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPaperPortfolio = z.infer<typeof insertPaperPortfolioSchema>;
export type PaperPortfolio = typeof paperPortfoliosTable.$inferSelect;
