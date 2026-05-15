import { Router } from "express";
import { db, usersTable, tripsTable, agentsTable, agentLogsTable, notificationsTable } from "@workspace/db";
import { eq, count, sql, and, gte } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

async function requireAdmin(req: AuthRequest, res: any, next: any) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

router.get("/admin/stats", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [[{ totalUsers }], [{ totalTrips }], [{ activeTrips }], [{ totalAgents }], [{ activeAgents }],
      [{ totalAgentActions }], [{ totalNotifications }], [{ newUsersToday }]] = await Promise.all([
      db.select({ totalUsers: count() }).from(usersTable),
      db.select({ totalTrips: count() }).from(tripsTable),
      db.select({ activeTrips: count() }).from(tripsTable).where(eq(tripsTable.status, "active")),
      db.select({ totalAgents: count() }).from(agentsTable),
      db.select({ activeAgents: count() }).from(agentsTable).where(eq(agentsTable.enabled, true)),
      db.select({ totalAgentActions: sql<number>`coalesce(sum(${agentsTable.actionsTotal}), 0)` }).from(agentsTable),
      db.select({ totalNotifications: count() }).from(notificationsTable),
      db.select({ newUsersToday: count() }).from(usersTable).where(gte(usersTable.createdAt, startOfDay)),
    ]);

    res.json({
      totalUsers: Number(totalUsers),
      totalTrips: Number(totalTrips),
      activeTrips: Number(activeTrips),
      totalAgents: Number(totalAgents),
      activeAgents: Number(activeAgents),
      totalAgentActions: Number(totalAgentActions),
      totalNotifications: Number(totalNotifications),
      newUsersToday: Number(newUsersToday),
    });
  } catch (err) {
    req.log.error({ err }, "Admin stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/users", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const users = await db.select().from(usersTable).orderBy(sql`${usersTable.createdAt} DESC`);

    const enriched = await Promise.all(users.map(async (u) => {
      const [[{ tripCount }], [{ agentCount }]] = await Promise.all([
        db.select({ tripCount: count() }).from(tripsTable).where(eq(tripsTable.userId, u.id)),
        db.select({ agentCount: count() }).from(agentsTable).where(eq(agentsTable.userId, u.id)),
      ]);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        plan: u.plan,
        isAdmin: u.isAdmin,
        onboardingComplete: u.onboardingComplete,
        taraPoints: u.taraPoints,
        walletBalance: Number(u.walletBalance),
        createdAt: u.createdAt,
        tripCount: Number(tripCount),
        agentCount: Number(agentCount),
      };
    }));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Admin list users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/users/:userId/make-admin", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.userId);
    const [updated] = await db.update(usersTable)
      .set({ isAdmin: true })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const [[{ tripCount }], [{ agentCount }]] = await Promise.all([
      db.select({ tripCount: count() }).from(tripsTable).where(eq(tripsTable.userId, userId)),
      db.select({ agentCount: count() }).from(agentsTable).where(eq(agentsTable.userId, userId)),
    ]);
    res.json({
      id: updated.id, name: updated.name, email: updated.email, plan: updated.plan,
      isAdmin: updated.isAdmin, onboardingComplete: updated.onboardingComplete,
      taraPoints: updated.taraPoints, walletBalance: Number(updated.walletBalance),
      createdAt: updated.createdAt, tripCount: Number(tripCount), agentCount: Number(agentCount),
    });
  } catch (err) {
    req.log.error({ err }, "Make admin error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/trips", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const trips = await db
      .select({
        id: tripsTable.id,
        userId: tripsTable.userId,
        userName: usersTable.name,
        origin: tripsTable.origin,
        originCode: tripsTable.originCode,
        destination: tripsTable.destination,
        destinationCode: tripsTable.destinationCode,
        flightNumber: tripsTable.flightNumber,
        airline: tripsTable.airline,
        status: tripsTable.status,
        flightStatus: tripsTable.flightStatus,
        departureTime: tripsTable.departureTime,
        createdAt: tripsTable.createdAt,
      })
      .from(tripsTable)
      .innerJoin(usersTable, eq(tripsTable.userId, usersTable.id))
      .orderBy(sql`${tripsTable.createdAt} DESC`);

    res.json(trips);
  } catch (err) {
    req.log.error({ err }, "Admin list trips error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
