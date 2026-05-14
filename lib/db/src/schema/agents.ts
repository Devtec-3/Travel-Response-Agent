import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentsTable = pgTable("agents", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  frequency: integer("frequency").notNull().default(5),
  status: text("status").notNull().default("idle"),
  lastAction: text("last_action"),
  lastCheck: timestamp("last_check", { withTimezone: true }),
  nextCheck: timestamp("next_check", { withTimezone: true }),
  actionsToday: integer("actions_today").notNull().default(0),
  actionsTotal: integer("actions_total").notNull().default(0),
  healthScore: integer("health_score").notNull().default(100),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const agentLogsTable = pgTable("agent_logs", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  tripId: integer("trip_id"),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  result: text("result").notNull(),
  severity: text("severity").notNull().default("info"),
  notified: boolean("notified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAgentSchema = createInsertSchema(agentsTable).omit({ createdAt: true, updatedAt: true });
export const insertAgentLogSchema = createInsertSchema(agentLogsTable).omit({ id: true, createdAt: true });
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agentsTable.$inferSelect;
export type AgentLog = typeof agentLogsTable.$inferSelect;
