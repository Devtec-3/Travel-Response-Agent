import { Router, type Request, type Response } from "express";
import { db, agentLogsTable, notificationsTable, agentsTable, tripsTable } from "@workspace/db";
import { eq, desc, gt } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

// In-memory list of active SSE connections per user
const sseClients = new Map<number, Set<Response>>();

// Called by the scheduler to push events to connected clients
export function broadcastToUser(userId: number, event: string, data: unknown): void {
  const clients = sseClients.get(userId);
  if (!clients || clients.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch {
      clients.delete(res);
    }
  }
}

// SSE stream endpoint — frontend connects here to receive live agent events
router.get("/sse/agents", requireAuth, (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Register this client
  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId)!.add(res);

  // Send initial heartbeat
  res.write(`event: connected\ndata: ${JSON.stringify({ message: "TARA agent feed connected" })}\n\n`);

  // Send a heartbeat every 20s to keep the connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  // Clean up on disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.get(userId)?.delete(res);
  });
});

// Polling fallback: get recent agent activity since a timestamp
router.get("/sse/recent-activity", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const since = req.query.since
      ? new Date(Number(req.query.since))
      : new Date(Date.now() - 5 * 60 * 1000); // default: last 5 min

    const [logs, notifs, agents, trips] = await Promise.all([
      db.select().from(agentLogsTable)
        .where(eq(agentLogsTable.userId, req.userId!))
        .orderBy(desc(agentLogsTable.createdAt))
        .limit(20),
      db.select().from(notificationsTable)
        .where(eq(notificationsTable.userId, req.userId!))
        .orderBy(desc(notificationsTable.createdAt))
        .limit(10),
      db.select().from(agentsTable)
        .where(eq(agentsTable.userId, req.userId!)),
      db.select().from(tripsTable)
        .where(eq(tripsTable.userId, req.userId!))
        .orderBy(desc(tripsTable.departureTime))
        .limit(5),
    ]);

    res.json({
      logs: logs.map(l => ({ ...l, tripId: l.tripId ?? null })),
      notifications: notifs.map(n => ({ ...n, tripId: n.tripId ?? null, agentId: n.agentId ?? null })),
      agents: agents.map(a => ({
        ...a,
        lastAction: a.lastAction ?? null,
        lastCheck: a.lastCheck ?? null,
        nextCheck: a.nextCheck ?? null,
      })),
      trips: trips.map(t => ({
        ...t,
        gate: t.gate ?? null,
        terminal: t.terminal ?? null,
        seat: t.seat ?? null,
        hotelName: t.hotelName ?? null,
        hotelAddress: t.hotelAddress ?? null,
        hotelCheckIn: t.hotelCheckIn ?? null,
        hotelCheckOut: t.hotelCheckOut ?? null,
        budgetNgn: t.budgetNgn ?? null,
        spentNgn: t.spentNgn ?? null,
      })),
      serverTime: Date.now(),
    });
  } catch (err) {
    req.log.error({ err }, "Recent activity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
