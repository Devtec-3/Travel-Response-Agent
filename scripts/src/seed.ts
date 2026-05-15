import { db, usersTable, tripsTable, tripAlertsTable, agentsTable, agentLogsTable, notificationsTable, transactionsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const AGENT_DEFINITIONS = [
  { id: "flight-monitor", name: "Flight Monitor Agent", description: "Monitors flight status every 5 minutes", type: "flight_monitor" },
  { id: "boarding-pass", name: "Boarding Pass Manager", description: "Syncs boarding passes across platforms", type: "boarding_pass" },
  { id: "hotel-coordinator", name: "Hotel Coordinator", description: "Coordinates hotel check-in automatically", type: "hotel_coordinator" },
  { id: "whatsapp-notifier", name: "WhatsApp Notifier", description: "Sends updates via WhatsApp", type: "whatsapp_notifier" },
  { id: "departure-advisor", name: "Smart Departure Advisor", description: "Monitors traffic and departure times", type: "departure_advisor" },
  { id: "refund-manager", name: "Refund Manager", description: "Auto-initiates refunds on cancellations", type: "refund_manager" },
  { id: "budget-guardian", name: "Budget Guardian", description: "Tracks spending vs budget", type: "budget_guardian" },
  { id: "itinerary-optimizer", name: "Itinerary Optimizer", description: "Optimizes your trip itinerary", type: "itinerary_optimizer" },
];

const AGE_OFFSETS = {
  yesterday: () => new Date(Date.now() - 86400000),
  twoDaysAgo: () => new Date(Date.now() - 2 * 86400000),
  nextWeek: () => new Date(Date.now() + 7 * 86400000),
  inTwoHours: () => new Date(Date.now() + 2 * 3600000),
  inFourHours: () => new Date(Date.now() + 4 * 3600000),
  inThreeDays: () => new Date(Date.now() + 3 * 86400000),
  lastMonth: () => new Date(Date.now() - 30 * 86400000),
};

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // Create demo user
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, "demo@tara.ai"));
  let user: typeof usersTable.$inferSelect;

  if (existing.length > 0) {
    user = existing[0];
    console.log("Demo user already exists, skipping user creation");
  } else {
    const [u] = await db.insert(usersTable).values({
      name: "Emeka Okonkwo",
      email: "demo@tara.ai",
      passwordHash,
      phone: "+2348012345678",
      whatsappNumber: "+2348012345678",
      seatPreference: "window",
      mealPreference: "standard",
      airlinePreference: "Air Peace",
      walletBalance: "245000",
      taraPoints: 3840,
      onboardingComplete: true,
      plan: "pro",
      isAdmin: true,
    }).returning();
    user = u;
    console.log("Created demo user:", user.id);
  }

  const userId = user.id;

  // Clear existing seed data for this user
  await db.delete(tripsTable).where(eq(tripsTable.userId, userId));
  await db.delete(agentsTable).where(eq(agentsTable.userId, userId));
  await db.delete(agentLogsTable).where(eq(agentLogsTable.userId, userId));
  await db.delete(notificationsTable).where(eq(notificationsTable.userId, userId));
  await db.delete(transactionsTable).where(eq(transactionsTable.userId, userId));

  // Create trips
  const trips = await db.insert(tripsTable).values([
    {
      userId,
      status: "active",
      origin: "Lagos",
      originCode: "LOS",
      destination: "Abuja",
      destinationCode: "ABJ",
      airline: "Air Peace",
      airlineCode: "9J",
      flightNumber: "9J 401",
      departureTime: AGE_OFFSETS.inThreeDays(),
      arrivalTime: new Date(Date.now() + 3 * 86400000 + 65 * 60000),
      gate: "B12",
      terminal: "Domestic",
      seat: "14A",
      flightStatus: "On Time",
      hotelName: "Transcorp Hilton Abuja",
      hotelAddress: "1 Aguiyi Ironsi St, Maitama, Abuja",
      hotelCheckIn: "14:00",
      hotelCheckOut: "11:00",
      budgetNgn: 200000,
      spentNgn: 82500,
      pricePaidNgn: 47500,
    },
    {
      userId,
      status: "active",
      origin: "Abuja",
      originCode: "ABJ",
      destination: "Port Harcourt",
      destinationCode: "PHC",
      airline: "Ibom Air",
      airlineCode: "QI",
      flightNumber: "QI 207",
      departureTime: AGE_OFFSETS.inTwoHours(),
      arrivalTime: new Date(Date.now() + 3 * 3600000),
      gate: "A5",
      terminal: "Domestic",
      seat: "7C",
      flightStatus: "Boarding",
      hotelName: "Presidential Hotel Port Harcourt",
      hotelAddress: "3 Stadium Rd, Port Harcourt",
      hotelCheckIn: "15:00",
      hotelCheckOut: "11:00",
      budgetNgn: 150000,
      spentNgn: 97200,
      pricePaidNgn: 38000,
    },
    {
      userId,
      status: "completed",
      origin: "Lagos",
      originCode: "LOS",
      destination: "Kano",
      destinationCode: "KAN",
      airline: "Air Peace",
      airlineCode: "9J",
      flightNumber: "9J 531",
      departureTime: AGE_OFFSETS.lastMonth(),
      arrivalTime: new Date(Date.now() - 30 * 86400000 + 90 * 60000),
      gate: "C3",
      terminal: "Domestic",
      seat: "22F",
      flightStatus: "Landed",
      hotelName: "Tahir Guest Palace Kano",
      hotelCheckIn: "15:00",
      hotelCheckOut: "11:00",
      budgetNgn: 180000,
      spentNgn: 162000,
      pricePaidNgn: 55000,
    },
    {
      userId,
      status: "upcoming",
      origin: "Lagos",
      originCode: "LOS",
      destination: "Enugu",
      destinationCode: "ENU",
      airline: "United Nigeria",
      airlineCode: "UNC",
      flightNumber: "UNC 102",
      departureTime: AGE_OFFSETS.nextWeek(),
      arrivalTime: new Date(Date.now() + 7 * 86400000 + 55 * 60000),
      flightStatus: "On Time",
      budgetNgn: 130000,
      pricePaidNgn: 32500,
    },
  ]).returning();

  console.log("Created", trips.length, "trips");

  // Create trip alerts
  await db.insert(tripAlertsTable).values([
    { tripId: trips[0].id, type: "gate_change", message: "Your gate has changed from B10 to B12 for flight 9J 401 to Abuja", severity: "warning", agentName: "Flight Monitor Agent" },
    { tripId: trips[0].id, type: "departure_time", message: "Check-in closes in 3 hours. TARA recommends leaving no later than 09:30 to beat Third Mainland Bridge traffic.", severity: "info", agentName: "Smart Departure Advisor" },
    { tripId: trips[1].id, type: "boarding", message: "Boarding has commenced for QI 207 at Gate A5. Seat 7C is in Zone 2.", severity: "critical", agentName: "Boarding Pass Manager" },
    { tripId: trips[1].id, type: "hotel", message: "Transcorp has confirmed early check-in. Your room will be ready at 13:00.", severity: "info", agentName: "Hotel Coordinator" },
  ]);

  // Create agents
  await db.insert(agentsTable).values(
    AGENT_DEFINITIONS.map((a, i) => ({
      id: `${a.id}-${userId}`,
      userId,
      name: a.name,
      description: a.description,
      type: a.type,
      enabled: true,
      frequency: [5, 10, 15, 5, 10, 30, 5, 60][i],
      status: i % 3 === 2 ? "idle" : "active",
      lastAction: [
        "Gate change detected for 9J 401 — updated boarding pass",
        "Boarding pass synced to WhatsApp — delivered in 0.3s",
        "Pre-arrival message sent to Transcorp Hilton",
        "Alert sent: Gate B12 change for 9J 401",
        "Leave by 09:30 — traffic moderate on Third Mainland",
        "No cancellations detected on 4 active trips",
        "Budget alert: 82% spent on LOS-ABJ trip",
        "Window seat confirmed — packing 3 recommendations generated",
      ][i],
      actionsToday: [12, 8, 3, 15, 6, 2, 9, 4][i],
      actionsTotal: [384, 217, 95, 512, 198, 43, 276, 88][i],
      healthScore: [98, 100, 87, 100, 95, 92, 100, 88][i],
    }))
  );

  console.log("Created", AGENT_DEFINITIONS.length, "agents");

  // Create agent logs
  await db.insert(agentLogsTable).values([
    { agentId: `flight-monitor-${userId}`, agentName: "Flight Monitor Agent", userId, tripId: trips[0].id, action: "Detected gate change for 9J 401", result: "Boarding pass updated, WhatsApp notification sent, user alerted", severity: "warning", notified: true },
    { agentId: `whatsapp-notifier-${userId}`, agentName: "WhatsApp Notifier", userId, tripId: trips[0].id, action: "Delivered boarding pass to +234801****5678", result: "Message delivered in 0.3s, read receipt confirmed", severity: "info", notified: true },
    { agentId: `departure-advisor-${userId}`, agentName: "Smart Departure Advisor", userId, tripId: trips[0].id, action: "Calculated optimal departure time to Murtala Airport", result: "Recommended 09:30 departure — moderate traffic on Third Mainland Bridge", severity: "info", notified: true },
    { agentId: `hotel-coordinator-${userId}`, agentName: "Hotel Coordinator", userId, tripId: trips[0].id, action: "Contacted Transcorp Hilton Abuja for pre-arrival check-in", result: "Early check-in confirmed for 13:00, non-smoking room on floor 7 guaranteed", severity: "info", notified: true },
    { agentId: `boarding-pass-${userId}`, agentName: "Boarding Pass Manager", userId, tripId: trips[1].id, action: "Synced boarding pass across platforms", result: "Apple Wallet, Google Wallet, and WhatsApp updated simultaneously", severity: "info", notified: false },
    { agentId: `budget-guardian-${userId}`, agentName: "Budget Guardian", userId, tripId: trips[1].id, action: "Budget threshold alert triggered at 82% spending", result: "User notified, AI recommendations for cost reduction sent", severity: "warning", notified: true },
    { agentId: `flight-monitor-${userId}`, agentName: "Flight Monitor Agent", userId, tripId: trips[1].id, action: "Confirmed on-time departure for QI 207 (Boarding status)", result: "Real-time status update sent, boarding notification triggered", severity: "info", notified: true },
    { agentId: `refund-manager-${userId}`, agentName: "Refund Manager", userId, action: "Routine check on all active trip cancellation policies", result: "No cancellations detected. Refund eligibility verified for 4 trips", severity: "info", notified: false },
  ]);

  console.log("Created agent logs");

  // Create notifications
  await db.insert(notificationsTable).values([
    { userId, type: "flight_update", title: "Gate Change: 9J 401", body: "Your gate has changed from B10 to B12. Updated boarding pass sent to WhatsApp.", tripId: trips[0].id, agentId: `flight-monitor-${userId}`, read: false },
    { userId, type: "agent_action", title: "TARA Departed", body: "Smart Departure Advisor says: leave by 09:30 to beat Third Mainland traffic. ETA to airport: 47 minutes.", tripId: trips[0].id, agentId: `departure-advisor-${userId}`, read: false },
    { userId, type: "boarding", title: "Now Boarding: QI 207", body: "Boarding has commenced at Gate A5. Zone 2 (your zone) boards in 10 minutes.", tripId: trips[1].id, agentId: `boarding-pass-${userId}`, read: false },
    { userId, type: "hotel", title: "Hotel Confirmed", body: "Transcorp Hilton Abuja has confirmed early check-in at 13:00. Floor 7, non-smoking.", tripId: trips[0].id, agentId: `hotel-coordinator-${userId}`, read: true },
    { userId, type: "budget", title: "Budget Alert: 82% Spent", body: "You have spent ₦97,200 of your ₦150,000 budget for the PHC trip. 3 days remaining.", tripId: trips[1].id, agentId: `budget-guardian-${userId}`, read: true },
    { userId, type: "system", title: "Welcome to TARA Pro", body: "Your Pro plan is active. 8 agents are monitoring your trips around the clock.", read: true },
  ]);

  console.log("Created notifications");

  // Create transactions
  await db.insert(transactionsTable).values([
    { userId, type: "booking", description: "Flight LOS→ABJ — Air Peace 9J 401", amountNgn: "-47500", tripId: trips[0].id },
    { userId, type: "booking", description: "Hotel — Transcorp Hilton Abuja (2 nights)", amountNgn: "-35000", tripId: trips[0].id },
    { userId, type: "booking", description: "Flight ABJ→PHC — Ibom Air QI 207", amountNgn: "-38000", tripId: trips[1].id },
    { userId, type: "savings", description: "TARA negotiated hotel rate — saved vs rack rate", amountNgn: "12500", tripId: trips[0].id },
    { userId, type: "fund", description: "Wallet top-up via Paystack", amountNgn: "200000", points: 2000 },
    { userId, type: "booking", description: "Flight LOS→KAN — Air Peace 9J 531", amountNgn: "-55000", tripId: trips[2].id },
    { userId, type: "savings", description: "AI found better fare — saved on KAN booking", amountNgn: "8400", tripId: trips[2].id },
    { userId, type: "booking", description: "Flight LOS→ENU — United Nigeria UNC 102", amountNgn: "-32500", tripId: trips[3].id },
    { userId, type: "reward", description: "TARA Points redeemed — ₦5,000 credit", amountNgn: "5000", points: -500 },
  ]);

  console.log("Created transactions");
  console.log("\nSeed complete!");
  console.log("Demo credentials: demo@tara.ai / demo1234");

  process.exit(0);
}

main().catch(e => {
  console.error("Seed failed:", e);
  process.exit(1);
});
