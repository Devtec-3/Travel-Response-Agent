import { Router } from "express";
import { db, tripsTable, tripAlertsTable, usersTable, agentLogsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/trips", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const trips = await db.select().from(tripsTable)
      .where(status
        ? and(eq(tripsTable.userId, req.userId!), eq(tripsTable.status, String(status)))
        : eq(tripsTable.userId, req.userId!))
      .orderBy(desc(tripsTable.departureTime));
    res.json(trips.map(formatTrip));
  } catch (err) {
    req.log.error({ err }, "List trips error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trips/active", requireAuth, async (req: AuthRequest, res) => {
  try {
    const trips = await db.select().from(tripsTable)
      .where(and(eq(tripsTable.userId, req.userId!), eq(tripsTable.status, "active")))
      .orderBy(desc(tripsTable.departureTime));
    res.json(trips.map(formatTrip));
  } catch (err) {
    req.log.error({ err }, "List active trips error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/trips", requireAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body;
    const [trip] = await db.insert(tripsTable).values({
      userId: req.userId!,
      status: "upcoming",
      origin: body.origin,
      originCode: body.originCode,
      destination: body.destination,
      destinationCode: body.destinationCode,
      airline: body.airline,
      airlineCode: body.airlineCode,
      flightNumber: body.flightNumber,
      departureTime: new Date(body.departureTime),
      arrivalTime: new Date(body.arrivalTime),
      seat: body.seat,
      hotelName: body.hotelName,
      hotelCheckIn: body.hotelCheckIn,
      hotelCheckOut: body.hotelCheckOut,
      budgetNgn: body.budgetNgn,
      pricePaidNgn: body.pricePaidNgn,
    }).returning();
    res.status(201).json(formatTrip(trip));
  } catch (err) {
    req.log.error({ err }, "Create trip error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trips/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [trip] = await db.select().from(tripsTable)
      .where(and(eq(tripsTable.id, id), eq(tripsTable.userId, req.userId!)));
    if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }

    const [alerts, tripLogs] = await Promise.all([
      db.select().from(tripAlertsTable).where(eq(tripAlertsTable.tripId, id)).orderBy(desc(tripAlertsTable.createdAt)),
      db.select().from(agentLogsTable).where(eq(agentLogsTable.tripId, id)).orderBy(desc(agentLogsTable.createdAt)).limit(20),
    ]);

    res.json({ ...formatTrip(trip), alerts, agentLogs: tripLogs.map(l => ({ ...l, tripId: l.tripId ?? null })) });
  } catch (err) {
    req.log.error({ err }, "Get trip error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/trips/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body;
    const [trip] = await db.update(tripsTable)
      .set({
        status: body.status,
        gate: body.gate,
        terminal: body.terminal,
        flightStatus: body.flightStatus,
        hotelName: body.hotelName,
        hotelCheckIn: body.hotelCheckIn,
        hotelCheckOut: body.hotelCheckOut,
        spentNgn: body.spentNgn,
      })
      .where(and(eq(tripsTable.id, id), eq(tripsTable.userId, req.userId!)))
      .returning();
    if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }
    res.json(formatTrip(trip));
  } catch (err) {
    req.log.error({ err }, "Update trip error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/trips/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(tripsTable).where(and(eq(tripsTable.id, id), eq(tripsTable.userId, req.userId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete trip error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trips/:id/boarding-pass", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [trip] = await db.select().from(tripsTable)
      .where(and(eq(tripsTable.id, id), eq(tripsTable.userId, req.userId!)));
    if (!trip) { res.status(404).json({ error: "Trip not found" }); return; }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    const qrData = `TARA-${trip.flightNumber}-${trip.originCode}-${trip.destinationCode}-${trip.id}`;

    res.json({
      tripId: trip.id,
      passengerName: user?.name ?? "Passenger",
      flightNumber: trip.flightNumber,
      origin: trip.origin,
      originCode: trip.originCode,
      destination: trip.destination,
      destinationCode: trip.destinationCode,
      departureTime: trip.departureTime,
      gate: trip.gate,
      terminal: trip.terminal,
      seat: trip.seat,
      airline: trip.airline,
      qrData,
      version: 1,
      lastUpdated: new Date(),
    });
  } catch (err) {
    req.log.error({ err }, "Get boarding pass error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/trips/:id/alerts", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const alerts = await db.select().from(tripAlertsTable)
      .where(eq(tripAlertsTable.tripId, id))
      .orderBy(desc(tripAlertsTable.createdAt));
    res.json(alerts);
  } catch (err) {
    req.log.error({ err }, "Get trip alerts error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatTrip(trip: typeof tripsTable.$inferSelect) {
  return {
    ...trip,
    gate: trip.gate ?? null,
    terminal: trip.terminal ?? null,
    seat: trip.seat ?? null,
    hotelName: trip.hotelName ?? null,
    hotelAddress: trip.hotelAddress ?? null,
    hotelCheckIn: trip.hotelCheckIn ?? null,
    hotelCheckOut: trip.hotelCheckOut ?? null,
    budgetNgn: trip.budgetNgn ?? null,
    spentNgn: trip.spentNgn ?? null,
  };
}

export default router;
