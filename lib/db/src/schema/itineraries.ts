import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const itinerariesTable = pgTable("itineraries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  prompt: text("prompt").notNull(),
  title: text("title").notNull(),
  totalCostNgn: integer("total_cost_ngn").notNull().default(0),
  days: jsonb("days").notNull().default([]),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertItinerarySchema = createInsertSchema(itinerariesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertItinerary = z.infer<typeof insertItinerarySchema>;
export type Itinerary = typeof itinerariesTable.$inferSelect;
