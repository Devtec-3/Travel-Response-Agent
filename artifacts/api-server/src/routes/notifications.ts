import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/notifications", requireAuth, async (req: AuthRequest, res) => {
  try {
    const notifs = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, req.userId!))
      .orderBy(desc(notificationsTable.createdAt));
    res.json(notifs.map(n => ({ ...n, tripId: n.tripId ?? null, agentId: n.agentId ?? null })));
  } catch (err) {
    req.log.error({ err }, "List notifications error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications/read-all", requireAuth, async (req: AuthRequest, res) => {
  try {
    await db.update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.userId, req.userId!));
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    req.log.error({ err }, "Mark all read error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications/:id/read", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [notif] = await db.update(notificationsTable)
      .set({ read: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.userId!)))
      .returning();
    if (!notif) { res.status(404).json({ error: "Notification not found" }); return; }
    res.json({ ...notif, tripId: notif.tripId ?? null, agentId: notif.agentId ?? null });
  } catch (err) {
    req.log.error({ err }, "Mark notification read error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/notifications/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(notificationsTable)
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.userId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete notification error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
