import { db, agentsTable } from "@workspace/db";

const AGENT_DEFINITIONS = [
  { id: "flight-monitor", name: "Flight Monitor Agent", description: "Monitors flight status every 5 minutes", type: "flight_monitor", frequency: 5 },
  { id: "boarding-pass", name: "Boarding Pass Manager", description: "Syncs boarding passes across platforms", type: "boarding_pass", frequency: 10 },
  { id: "hotel-coordinator", name: "Hotel Coordinator", description: "Coordinates hotel check-in automatically", type: "hotel_coordinator", frequency: 15 },
  { id: "whatsapp-notifier", name: "WhatsApp Notifier", description: "Sends updates via WhatsApp", type: "whatsapp_notifier", frequency: 5 },
  { id: "departure-advisor", name: "Smart Departure Advisor", description: "Monitors traffic and departure times", type: "departure_advisor", frequency: 10 },
  { id: "refund-manager", name: "Refund Manager", description: "Auto-initiates refunds on cancellations", type: "refund_manager", frequency: 30 },
  { id: "budget-guardian", name: "Budget Guardian", description: "Tracks spending vs budget", type: "budget_guardian", frequency: 5 },
  { id: "itinerary-optimizer", name: "Itinerary Optimizer", description: "Optimizes your trip itinerary", type: "itinerary_optimizer", frequency: 60 },
];

export async function createUserAgents(userId: number): Promise<void> {
  await db.insert(agentsTable).values(
    AGENT_DEFINITIONS.map((a) => ({
      id: `${a.id}-${userId}`,
      userId,
      name: a.name,
      description: a.description,
      type: a.type,
      enabled: true,
      frequency: a.frequency,
      status: "idle" as const,
      actionsToday: 0,
      actionsTotal: 0,
      healthScore: 100,
    }))
  );
}
