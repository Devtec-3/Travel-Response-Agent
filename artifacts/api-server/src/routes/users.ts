import { Router } from "express";
import { db, usersTable, agentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

const AGENT_DEFINITIONS = [
  { id: "flight-monitor", name: "Flight Monitor Agent", description: "Monitors flight status every 5 minutes — detects delays, cancellations, gate changes", type: "flight_monitor" },
  { id: "boarding-pass", name: "Boarding Pass Manager", description: "Syncs boarding pass across WhatsApp, Google Wallet, and Apple Wallet automatically", type: "boarding_pass" },
  { id: "hotel-coordinator", name: "Hotel Coordinator", description: "Coordinates hotel check-in 2 hours before arrival and handles special requests", type: "hotel_coordinator" },
  { id: "whatsapp-notifier", name: "WhatsApp Notifier", description: "Sends boarding passes, alerts, and updates directly to your WhatsApp", type: "whatsapp_notifier" },
  { id: "departure-advisor", name: "Smart Departure Advisor", description: "Monitors traffic and calculates optimal time to leave for the airport", type: "departure_advisor" },
  { id: "refund-manager", name: "Refund Manager", description: "Auto-initiates refunds on cancellations and tracks refund status in real time", type: "refund_manager" },
  { id: "budget-guardian", name: "Budget Guardian", description: "Tracks trip spending vs budget and alerts at 75% usage", type: "budget_guardian" },
  { id: "itinerary-optimizer", name: "Itinerary Optimizer", description: "Analyzes your trip and suggests improvements, packing lists, and seat recommendations", type: "itinerary_optimizer" },
];

router.patch("/users/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, phone, photoUrl, seatPreference, mealPreference, airlinePreference } = req.body;
    const [updated] = await db.update(usersTable)
      .set({ name, phone, photoUrl, seatPreference, mealPreference, airlinePreference })
      .where(eq(usersTable.id, req.userId!))
      .returning();
    const { passwordHash: _, ...safe } = updated;
    res.json({ ...safe, walletBalance: Number(safe.walletBalance) });
  } catch (err) {
    req.log.error({ err }, "Update profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/onboarding", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, phone, photoUrl, seatPreference, mealPreference, airlinePreference, whatsappNumber } = req.body;
    const [updated] = await db.update(usersTable)
      .set({ name, phone, photoUrl, seatPreference, mealPreference, airlinePreference, whatsappNumber, onboardingComplete: true })
      .where(eq(usersTable.id, req.userId!))
      .returning();

    // Create default agents for this user if they don't exist
    const existing = await db.select().from(agentsTable).where(eq(agentsTable.userId, req.userId!));
    if (existing.length === 0) {
      await db.insert(agentsTable).values(
        AGENT_DEFINITIONS.map(a => ({
          id: `${a.id}-${req.userId}`,
          userId: req.userId!,
          name: a.name,
          description: a.description,
          type: a.type,
          enabled: true,
          frequency: 5,
          status: "active",
          actionsToday: 0,
          actionsTotal: 0,
          healthScore: 100,
        }))
      );
    }

    const { passwordHash: _, ...safe } = updated;
    res.json({ ...safe, walletBalance: Number(safe.walletBalance) });
  } catch (err) {
    req.log.error({ err }, "Onboarding error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export { AGENT_DEFINITIONS };
export default router;
