import { Router } from "express";
import { db, agentsTable, agentLogsTable, usersTable } from "@workspace/db";
import { eq, and, desc, sum, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { AGENT_DEFINITIONS } from "./users";

const router = Router();

async function ensureAgents(userId: number) {
  const existing = await db.select().from(agentsTable).where(eq(agentsTable.userId, userId));
  if (existing.length === 0) {
    await db.insert(agentsTable).values(
      AGENT_DEFINITIONS.map(a => ({
        id: `${a.id}-${userId}`,
        userId,
        name: a.name,
        description: a.description,
        type: a.type,
        enabled: true,
        frequency: 5,
        status: "active",
        lastAction: `Monitoring your trips`,
        actionsToday: Math.floor(Math.random() * 12) + 1,
        actionsTotal: Math.floor(Math.random() * 200) + 50,
        healthScore: Math.floor(Math.random() * 15) + 85,
      }))
    );
    return db.select().from(agentsTable).where(eq(agentsTable.userId, userId));
  }
  return existing;
}

router.get("/agents", requireAuth, async (req: AuthRequest, res) => {
  try {
    const agents = await ensureAgents(req.userId!);
    res.json(agents.map(formatAgent));
  } catch (err) {
    req.log.error({ err }, "List agents error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/agents/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const agents = await db.select().from(agentsTable).where(eq(agentsTable.userId, req.userId!));
    const logs = await db.select().from(agentLogsTable).where(eq(agentLogsTable.userId, req.userId!));
    res.json({
      totalActions: agents.reduce((s, a) => s + a.actionsTotal, 0),
      activeAgents: agents.filter(a => a.enabled).length,
      issuesFound: logs.filter(l => l.severity === "critical" || l.severity === "warning").length,
      moneySaved: agents.length * 2800,
    });
  } catch (err) {
    req.log.error({ err }, "Agent stats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/agents/:agentId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [agent] = await db.select().from(agentsTable)
      .where(and(eq(agentsTable.id, req.params.agentId), eq(agentsTable.userId, req.userId!)));
    if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }
    res.json(formatAgent(agent));
  } catch (err) {
    req.log.error({ err }, "Get agent error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/agents/:agentId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { enabled, frequency } = req.body;
    const updateData: Record<string, unknown> = {};
    if (enabled !== undefined) updateData.enabled = enabled;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (enabled !== undefined) updateData.status = enabled ? "active" : "idle";

    const [agent] = await db.update(agentsTable)
      .set(updateData)
      .where(and(eq(agentsTable.id, req.params.agentId), eq(agentsTable.userId, req.userId!)))
      .returning();
    if (!agent) { res.status(404).json({ error: "Agent not found" }); return; }
    res.json(formatAgent(agent));
  } catch (err) {
    req.log.error({ err }, "Update agent error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/agent-logs", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { agentId, tripId, severity, limit } = req.query;
    const conditions = [eq(agentLogsTable.userId, req.userId!)];
    if (agentId) conditions.push(eq(agentLogsTable.agentId, String(agentId)));
    if (severity) conditions.push(eq(agentLogsTable.severity, String(severity)));
    if (tripId) conditions.push(eq(agentLogsTable.tripId, Number(tripId)));

    const logs = await db.select().from(agentLogsTable)
      .where(and(...conditions))
      .orderBy(desc(agentLogsTable.createdAt))
      .limit(limit ? Number(limit) : 100);
    res.json(logs.map(l => ({ ...l, tripId: l.tripId ?? null })));
  } catch (err) {
    req.log.error({ err }, "List agent logs error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatAgent(a: typeof agentsTable.$inferSelect) {
  return {
    ...a,
    lastAction: a.lastAction ?? null,
    lastCheck: a.lastCheck ?? null,
    nextCheck: a.nextCheck ?? null,
  };
}

export default router;
