import { pgTable, serial, timestamp, numeric, integer, text, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nervousStateTable = pgTable("nervous_state", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  phi: numeric("phi", { precision: 8, scale: 6 }).notNull().default("0"),
  delta: numeric("delta", { precision: 8, scale: 6 }).notNull().default("0"),
  gwtFocus: jsonb("gwt_focus").notNull().default([]),
  gwtBroadcast: text("gwt_broadcast").notNull().default(""),
  synapticWeights: jsonb("synaptic_weights").notNull().default([]),
  strategyNames: jsonb("strategy_names").notNull().default([]),
  learningRate: numeric("learning_rate", { precision: 8, scale: 6 }).notNull().default("0.01"),
  moduleActivations: jsonb("module_activations").notNull().default({}),
  dopamine: numeric("dopamine", { precision: 8, scale: 6 }).notNull().default("0.5"),
  adrenaline: numeric("adrenaline", { precision: 8, scale: 6 }).notNull().default("0.3"),
  soma: numeric("soma", { precision: 8, scale: 6 }).notNull().default("0.5"),
  asymmetry: numeric("asymmetry", { precision: 8, scale: 6 }).notNull().default("0"),
  liquidityTrap: boolean("liquidity_trap").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNervousStateSchema = createInsertSchema(nervousStateTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNervousState = z.infer<typeof insertNervousStateSchema>;
export type NervousState = typeof nervousStateTable.$inferSelect;
