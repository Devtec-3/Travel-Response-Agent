import { pgTable, text, serial, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("upcoming"),
  origin: text("origin").notNull(),
  originCode: text("origin_code").notNull(),
  destination: text("destination").notNull(),
  destinationCode: text("destination_code").notNull(),
  airline: text("airline").notNull(),
  airlineCode: text("airline_code").notNull(),
  flightNumber: text("flight_number").notNull(),
  departureTime: timestamp("departure_time", { withTimezone: true }).notNull(),
  arrivalTime: timestamp("arrival_time", { withTimezone: true }).notNull(),
  gate: text("gate"),
  terminal: text("terminal"),
  seat: text("seat"),
  flightStatus: text("flight_status").notNull().default("On Time"),
  hotelName: text("hotel_name"),
  hotelAddress: text("hotel_address"),
  hotelCheckIn: text("hotel_check_in"),
  hotelCheckOut: text("hotel_check_out"),
  budgetNgn: integer("budget_ngn"),
  spentNgn: integer("spent_ngn"),
  pricePaidNgn: integer("price_paid_ngn").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const tripAlertsTable = pgTable("trip_alerts", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"),
  agentName: text("agent_name").notNull(),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTripAlertSchema = createInsertSchema(tripAlertsTable).omit({ id: true, createdAt: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
export type TripAlert = typeof tripAlertsTable.$inferSelect;
