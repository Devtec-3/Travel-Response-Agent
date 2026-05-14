import { Router } from "express";
import { db, tripsTable, agentsTable, agentLogsTable, transactionsTable } from "@workspace/db";
import { eq, and, desc, sum, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

const SUGGESTED_DESTINATIONS = [
  { city: "Abuja", country: "Nigeria", code: "ABJ", priceFrom: 28000, imageUrl: "https://images.unsplash.com/photo-1569406125624-e1a0da44f82e?w=400", reason: "You flew here 3 times last year" },
  { city: "Port Harcourt", country: "Nigeria", code: "PHC", priceFrom: 35000, imageUrl: "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400", reason: "Business hub — great hotel deals" },
  { city: "Kano", country: "Nigeria", code: "KAN", priceFrom: 42000, imageUrl: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400", reason: "New Air Peace route launched" },
  { city: "Enugu", country: "Nigeria", code: "ENU", priceFrom: 31000, imageUrl: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=400", reason: "Low season prices right now" },
];

router.get("/dashboard/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const [trips, agents, recentLogs, spent] = await Promise.all([
      db.select().from(tripsTable).where(eq(tripsTable.userId, userId)),
      db.select().from(agentsTable).where(eq(agentsTable.userId, userId)),
      db.select().from(agentLogsTable)
        .where(eq(agentLogsTable.userId, userId))
        .orderBy(desc(agentLogsTable.createdAt))
        .limit(10),
      db.select({ total: sum(transactionsTable.amountNgn) })
        .from(transactionsTable)
        .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "savings"))),
    ]);

    const activeTrips = trips.filter(t => t.status === "active").length;
    const totalTrips = trips.length;
    const activeAgents = agents.filter(a => a.enabled).length;

    // Estimate km from trips (mock: ~700km per domestic flight)
    const totalKm = totalTrips * 700;
    const moneySavedNgn = Number(spent[0]?.total ?? 0) || (totalTrips * 1950);

    res.json({
      activeTrips,
      totalTrips,
      totalKm,
      moneySavedNgn,
      activeAgents,
      recentLogs: recentLogs.map(l => ({ ...l, tripId: l.tripId ?? null })),
      suggestedDestinations: SUGGESTED_DESTINATIONS,
    });
  } catch (err) {
    req.log.error({ err }, "Dashboard stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
