import { Router } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, desc, sum, and, gt } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/wallet", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    const txns = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, req.userId!));

    const totalSaved = txns.filter(t => t.type === "savings" || t.type === "refund").reduce((s, t) => s + Number(t.amountNgn), 0);
    const totalSpent = txns.filter(t => t.type === "booking").reduce((s, t) => s + Math.abs(Number(t.amountNgn)), 0);

    res.json({
      balance: Number(user?.walletBalance ?? 0),
      taraPoints: user?.taraPoints ?? 0,
      totalSaved,
      totalSpent,
    });
  } catch (err) {
    req.log.error({ err }, "Get wallet error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/wallet/transactions", requireAuth, async (req: AuthRequest, res) => {
  try {
    const txns = await db.select().from(transactionsTable)
      .where(eq(transactionsTable.userId, req.userId!))
      .orderBy(desc(transactionsTable.createdAt));
    res.json(txns.map(t => ({
      ...t,
      amountNgn: Number(t.amountNgn),
      points: t.points ?? null,
      tripId: t.tripId ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "List transactions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/wallet/fund", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { amountNgn } = req.body;
    if (!amountNgn || amountNgn <= 0) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    const newBalance = Number(user?.walletBalance ?? 0) + Number(amountNgn);
    const pointsEarned = Math.floor(Number(amountNgn) / 1000) * 10;

    await db.update(usersTable)
      .set({ walletBalance: String(newBalance), taraPoints: (user?.taraPoints ?? 0) + pointsEarned })
      .where(eq(usersTable.id, req.userId!));

    await db.insert(transactionsTable).values({
      userId: req.userId!,
      type: "fund",
      description: "Wallet top-up via Paystack",
      amountNgn: String(amountNgn),
      points: pointsEarned,
    });

    const [updated] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    const txns = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, req.userId!));
    const totalSaved = txns.filter(t => t.type === "savings" || t.type === "refund").reduce((s, t) => s + Number(t.amountNgn), 0);
    const totalSpent = txns.filter(t => t.type === "booking").reduce((s, t) => s + Math.abs(Number(t.amountNgn)), 0);

    res.json({
      balance: Number(updated?.walletBalance ?? 0),
      taraPoints: updated?.taraPoints ?? 0,
      totalSaved,
      totalSpent,
    });
  } catch (err) {
    req.log.error({ err }, "Fund wallet error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
