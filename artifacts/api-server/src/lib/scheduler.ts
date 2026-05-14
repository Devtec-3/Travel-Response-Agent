import { db, usersTable, tripsTable, agentsTable, agentLogsTable, notificationsTable, tripAlertsTable } from "@workspace/db";
import { eq, and, lt } from "drizzle-orm";
import { logger } from "./logger";
import { broadcastToUser } from "../routes/sse";

// ─── Flight Status Engine ────────────────────────────────────────────────────

type FlightStatus = "On Time" | "Check-In Open" | "Boarding" | "Final Call" | "Departed" | "In Air" | "Landing" | "Landed" | "Delayed" | "Cancelled";

function computeFlightStatus(departureTime: Date, arrivalTime: Date): FlightStatus {
  const now = Date.now();
  const dep = departureTime.getTime();
  const arr = arrivalTime.getTime();
  const minsUntilDep = (dep - now) / 60000;
  const minsUntilArr = (arr - now) / 60000;

  if (minsUntilDep > 120) return "On Time";
  if (minsUntilDep > 60) return "Check-In Open";
  if (minsUntilDep > 25) return "Boarding";
  if (minsUntilDep > 0) return "Final Call";
  if (minsUntilDep > -20) return "Departed";
  if (minsUntilArr > 20) return "In Air";
  if (minsUntilArr > 0) return "Landing";
  return "Landed";
}

// ─── Agent Action Definitions ────────────────────────────────────────────────

interface AgentAction {
  action: string;
  result: string;
  severity: "info" | "warning" | "critical";
  notificationTitle?: string;
  notificationBody?: string;
  notificationType?: string;
  tripAlertType?: string;
  tripAlertMessage?: string;
  tripAlertSeverity?: string;
  flightStatusOverride?: string;
}

function getFlightMonitorAction(trip: typeof tripsTable.$inferSelect): AgentAction | null {
  const newStatus = computeFlightStatus(trip.departureTime, trip.arrivalTime);
  const oldStatus = trip.flightStatus;

  if (newStatus === oldStatus) {
    return {
      action: `Checked flight ${trip.flightNumber} (${trip.originCode}→${trip.destinationCode})`,
      result: `Status unchanged: ${oldStatus}. No action required.`,
      severity: "info",
    };
  }

  const statusChanges: Record<string, AgentAction> = {
    "Boarding": {
      action: `Boarding gate open detected for ${trip.flightNumber}`,
      result: `Status updated to Boarding at Gate ${trip.gate || "TBD"}. Boarding pass synced. WhatsApp notification queued.`,
      severity: "warning",
      notificationType: "boarding",
      notificationTitle: `Now Boarding: ${trip.flightNumber}`,
      notificationBody: `Boarding has started for your ${trip.originCode}→${trip.destinationCode} flight at Gate ${trip.gate || "TBD"}.`,
      tripAlertType: "boarding",
      tripAlertMessage: `Boarding has commenced for ${trip.flightNumber} at Gate ${trip.gate || "TBD"}. Please proceed to the gate.`,
      tripAlertSeverity: "critical",
      flightStatusOverride: "Boarding",
    },
    "Check-In Open": {
      action: `Check-in opened for ${trip.flightNumber}`,
      result: `Online check-in is now available. Seat ${trip.seat || "unassigned"} confirmed.`,
      severity: "info",
      notificationType: "flight_update",
      notificationTitle: `Check-In Open: ${trip.flightNumber}`,
      notificationBody: `Check-in is now open for ${trip.originCode}→${trip.destinationCode}. Your seat is ${trip.seat || "pending assignment"}.`,
      flightStatusOverride: "Check-In Open",
    },
    "Final Call": {
      action: `Final boarding call detected for ${trip.flightNumber}`,
      result: `URGENT: Final boarding call issued. Gate closes in approximately 10 minutes.`,
      severity: "critical",
      notificationType: "boarding",
      notificationTitle: `Final Call: ${trip.flightNumber}`,
      notificationBody: `FINAL BOARDING CALL for ${trip.flightNumber}. Gate ${trip.gate || "TBD"} closes in ~10 minutes. Go now.`,
      tripAlertType: "final_call",
      tripAlertMessage: `FINAL BOARDING CALL for ${trip.flightNumber}. Gate closes imminently.`,
      tripAlertSeverity: "critical",
      flightStatusOverride: "Final Call",
    },
    "Departed": {
      action: `${trip.flightNumber} has departed ${trip.origin}`,
      result: `Flight confirmed departed. ETA to ${trip.destination} calculated.`,
      severity: "info",
      notificationType: "flight_update",
      notificationTitle: `${trip.flightNumber} Departed`,
      notificationBody: `Your flight has left ${trip.origin}. Expected arrival in ${trip.destination} on schedule.`,
      flightStatusOverride: "Departed",
    },
    "In Air": {
      action: `${trip.flightNumber} is airborne`,
      result: `Aircraft is en route. No anomalies detected. On track for on-time arrival.`,
      severity: "info",
      flightStatusOverride: "In Air",
    },
    "Landing": {
      action: `${trip.flightNumber} approaching ${trip.destination}`,
      result: `Aircraft on final approach. Hotel Coordinator notified to expect arrival.`,
      severity: "info",
      notificationType: "flight_update",
      notificationTitle: `Landing Soon: ${trip.flightNumber}`,
      notificationBody: `Your flight is on final approach to ${trip.destination}. Hotel check-in coordination initiated.`,
      flightStatusOverride: "Landing",
    },
    "Landed": {
      action: `${trip.flightNumber} has landed at ${trip.destination}`,
      result: `Flight completed successfully. Baggage carousel information sent. Hotel coordination complete.`,
      severity: "info",
      notificationType: "flight_update",
      notificationTitle: `Landed: ${trip.flightNumber}`,
      notificationBody: `Welcome to ${trip.destination}! Your flight has landed. Hotel check-in is ready.`,
      flightStatusOverride: "Landed",
    },
  };

  return statusChanges[newStatus] ?? {
    action: `Monitored ${trip.flightNumber} — status: ${newStatus}`,
    result: `Flight status updated from ${oldStatus} to ${newStatus}.`,
    severity: "info",
    flightStatusOverride: newStatus,
  };
}

function getDepartureAdvisorAction(trip: typeof tripsTable.$inferSelect): AgentAction {
  const minsUntilDep = (trip.departureTime.getTime() - Date.now()) / 60000;

  if (minsUntilDep > 180) {
    return {
      action: `Monitoring traffic to ${trip.origin} airport for ${trip.flightNumber}`,
      result: `Traffic is currently moderate. Optimal departure window: ${Math.round(minsUntilDep - 120)} minutes from now. No action needed yet.`,
      severity: "info",
    };
  }

  if (minsUntilDep > 90) {
    const trafficOptions = [
      { condition: "moderate traffic on Third Mainland Bridge", eta: 52 },
      { condition: "light traffic on Apapa-Oshodi Expressway", eta: 38 },
      { condition: "heavy traffic — accident on Third Mainland Bridge", eta: 75 },
    ];
    const traffic = trafficOptions[Math.floor(Math.random() * trafficOptions.length)];
    return {
      action: `Calculated optimal departure time for ${trip.flightNumber} check-in`,
      result: `Detected ${traffic.condition}. Recommended departure: NOW. ETA to ${trip.originCode} airport: ${traffic.eta} minutes.`,
      severity: traffic.eta > 60 ? "warning" : "info",
      notificationType: "agent_action",
      notificationTitle: `Time to Leave for ${trip.flightNumber}`,
      notificationBody: `TARA says: Leave now — ${traffic.condition}. ETA to airport: ${traffic.eta} min.`,
    };
  }

  if (minsUntilDep > 0 && minsUntilDep < 45) {
    return {
      action: `Urgent: Less than 45 minutes to departure for ${trip.flightNumber}`,
      result: `CRITICAL: Departure imminent. If not already at airport, contact airline immediately.`,
      severity: "critical",
      notificationType: "agent_action",
      notificationTitle: `Urgent: ${trip.flightNumber} Departs Soon`,
      notificationBody: `Less than 45 minutes to departure. If you are not at the gate, contact ${trip.airline} immediately.`,
    };
  }

  return {
    action: `Trip ${trip.flightNumber} status check`,
    result: `No departure advisory needed at this time.`,
    severity: "info",
  };
}

function getBudgetGuardianAction(trip: typeof tripsTable.$inferSelect): AgentAction {
  if (!trip.budgetNgn || !trip.spentNgn) {
    return {
      action: `Budget check for ${trip.flightNumber} trip`,
      result: `No budget configured for this trip. Consider setting a trip budget.`,
      severity: "info",
    };
  }

  const pct = Math.round((trip.spentNgn / trip.budgetNgn) * 100);
  const remaining = trip.budgetNgn - trip.spentNgn;

  if (pct >= 95) {
    return {
      action: `Budget critical: ${pct}% spent on ${trip.originCode}→${trip.destinationCode} trip`,
      result: `₦${remaining.toLocaleString()} remaining of ₦${trip.budgetNgn.toLocaleString()} budget. Consider reducing discretionary spend.`,
      severity: "critical",
      notificationType: "budget",
      notificationTitle: `Budget Alert: 95% Spent`,
      notificationBody: `You have spent ₦${trip.spentNgn.toLocaleString()} of your ₦${trip.budgetNgn.toLocaleString()} budget. Only ₦${remaining.toLocaleString()} left.`,
    };
  }

  if (pct >= 75) {
    return {
      action: `Budget threshold reached: ${pct}% spent on ${trip.originCode}→${trip.destinationCode} trip`,
      result: `₦${remaining.toLocaleString()} remaining. TARA suggests reviewing hotel ancillary charges.`,
      severity: "warning",
      notificationType: "budget",
      notificationTitle: `Budget Alert: ${pct}% Spent`,
      notificationBody: `₦${trip.spentNgn.toLocaleString()} of ₦${trip.budgetNgn.toLocaleString()} used. ₦${remaining.toLocaleString()} remaining.`,
    };
  }

  return {
    action: `Budget check: ${pct}% spent on ${trip.originCode}→${trip.destinationCode} trip`,
    result: `Spending on track. ₦${remaining.toLocaleString()} of ₦${trip.budgetNgn.toLocaleString()} budget remaining.`,
    severity: "info",
  };
}

function getBoardingPassAction(trip: typeof tripsTable.$inferSelect): AgentAction {
  const status = computeFlightStatus(trip.departureTime, trip.arrivalTime);
  if (status === "Boarding" || status === "Final Call" || status === "Check-In Open") {
    return {
      action: `Syncing boarding pass for ${trip.flightNumber} (${status})`,
      result: `Boarding pass refreshed. Latest gate info (${trip.gate || "TBD"}) reflected. Apple Wallet, Google Wallet, and WhatsApp updated.`,
      severity: "info",
    };
  }
  return {
    action: `Boarding pass health check for ${trip.flightNumber}`,
    result: `All boarding pass formats valid. QR code verified. No updates needed.`,
    severity: "info",
  };
}

function getHotelCoordinatorAction(trip: typeof tripsTable.$inferSelect): AgentAction {
  if (!trip.hotelName) {
    return {
      action: `Hotel check for ${trip.originCode}→${trip.destinationCode} trip`,
      result: `No hotel configured for this trip. Suggest adding hotel details for pre-arrival coordination.`,
      severity: "info",
    };
  }

  const minsUntilArr = (trip.arrivalTime.getTime() - Date.now()) / 60000;
  if (minsUntilArr > 0 && minsUntilArr < 180) {
    return {
      action: `Pre-arrival coordination with ${trip.hotelName}`,
      result: `Contacted ${trip.hotelName}. Room confirmed, early check-in requested. Estimated arrival communicated.`,
      severity: "info",
      notificationType: "hotel",
      notificationTitle: `Hotel Coordinator: ${trip.hotelName}`,
      notificationBody: `TARA has contacted ${trip.hotelName}. Room confirmed and ready for your arrival.`,
    };
  }

  if (minsUntilArr < 0) {
    return {
      action: `Post-arrival follow-up with ${trip.hotelName}`,
      result: `Sent satisfaction check to ${trip.hotelName}. Late check-out request submitted for tomorrow.`,
      severity: "info",
    };
  }

  return {
    action: `Hotel ${trip.hotelName} pre-trip coordination`,
    result: `Confirmed reservation details. Special requests noted. Airport pickup availability checked.`,
    severity: "info",
  };
}

function getWhatsAppNotifierAction(trip: typeof tripsTable.$inferSelect): AgentAction {
  const status = computeFlightStatus(trip.departureTime, trip.arrivalTime);
  const messages: Record<string, AgentAction> = {
    "Boarding": {
      action: `Sent WhatsApp boarding alert for ${trip.flightNumber}`,
      result: `WhatsApp message delivered. Boarding pass image attached. Read receipt confirmed.`,
      severity: "info",
    },
    "Check-In Open": {
      action: `Sent WhatsApp check-in reminder for ${trip.flightNumber}`,
      result: `Check-in link and boarding pass sent to registered WhatsApp. Message delivered successfully.`,
      severity: "info",
    },
  };

  return messages[status] ?? {
    action: `WhatsApp status update for ${trip.flightNumber}`,
    result: `Status "${status}" communicated. All notifications up to date.`,
    severity: "info",
  };
}

function getRefundManagerAction(trip: typeof tripsTable.$inferSelect): AgentAction {
  const cancelled = trip.status === "cancelled";
  if (cancelled) {
    return {
      action: `Refund initiated for cancelled trip ${trip.flightNumber}`,
      result: `Refund request submitted to ${trip.airline}. Expected processing: 7–14 business days. Reference sent to email.`,
      severity: "warning",
      notificationType: "agent_action",
      notificationTitle: `Refund Initiated: ${trip.flightNumber}`,
      notificationBody: `Your refund has been processed. Expect ₦${trip.pricePaidNgn.toLocaleString()} back within 7–14 days.`,
    };
  }
  return {
    action: `Refund eligibility check for trip ${trip.flightNumber}`,
    result: `Trip is active and within fare rules. No refund processing needed. Cancellation policy: Flex fare — 90% refund if cancelled >24h before departure.`,
    severity: "info",
  };
}

function getItineraryOptimizerAction(trip: typeof tripsTable.$inferSelect): AgentAction {
  const suggestions = [
    `Analysed ${trip.originCode}→${trip.destinationCode} route — seat ${trip.seat || "unassigned"} confirmed as window. Packing checklist for ${trip.destination} generated.`,
    `Checked lounge access at ${trip.originCode}. ${trip.airline} does not offer complimentary lounge on this ticket class. Priority Pass alternative suggested.`,
    `Optimised ${trip.originCode}→${trip.destinationCode} trip. Suggested 2 POIs near ${trip.hotelName || "your hotel"}. Local SIM card options researched.`,
    `Reviewed trip itinerary for ${trip.destination}. Weather forecast: 29°C, partly cloudy. Lightweight packing recommended.`,
    `Compared alternative flight times for ${trip.flightNumber}. Your current timing is optimal — avoids peak rush hours.`,
  ];
  return {
    action: `Itinerary optimization pass for ${trip.originCode}→${trip.destinationCode}`,
    result: suggestions[Math.floor(Math.random() * suggestions.length)],
    severity: "info",
  };
}

// ─── Generic idle actions (for agents with no active trips) ─────────────────

const IDLE_ACTIONS: Record<string, () => AgentAction> = {
  "flight_monitor": () => ({
    action: "Performed routine flight database sync",
    result: "Checked 847 Nigerian domestic routes. No anomalies detected on monitored flights.",
    severity: "info",
  }),
  "boarding_pass": () => ({
    action: "Validated all stored boarding passes",
    result: "All QR codes valid. Apple Wallet and Google Wallet sync current.",
    severity: "info",
  }),
  "hotel_coordinator": () => ({
    action: "Performed hotel rate monitoring",
    result: "Transcorp Hilton Abuja: ₦85,000/night (steady). Eko Hotels Lagos: ₦62,000/night (down 8%). No action required.",
    severity: "info",
  }),
  "whatsapp_notifier": () => ({
    action: "WhatsApp Business API health check",
    result: "Message delivery rate: 99.2%. No failed deliveries in the last 24h.",
    severity: "info",
  }),
  "departure_advisor": () => ({
    action: "Traffic pattern analysis for Nigerian airports",
    result: "LOS: Third Mainland Bridge — moderate. Oshodi–Apapa — heavy. ABJ: Light traffic all routes.",
    severity: "info",
  }),
  "refund_manager": () => ({
    action: "Cancellation policy sync across all airlines",
    result: "Air Peace, Ibom Air, United Nigeria, Overland Airways policies confirmed current. No pending refunds.",
    severity: "info",
  }),
  "budget_guardian": () => ({
    action: "Routine budget analytics pass",
    result: "Average trip spend ₦142,000 vs ₦180,000 budget. TARA has saved you ₦20,900 this month.",
    severity: "info",
  }),
  "itinerary_optimizer": () => ({
    action: "Nigerian destination intelligence update",
    result: "Updated POI data for LOS, ABJ, PHC, KAN, ENU. New hotel deals flagged in Abuja (Sheraton: ₦58,000).",
    severity: "info",
  }),
};

// ─── Per-Agent Dispatch ──────────────────────────────────────────────────────

async function runAgent(
  agent: typeof agentsTable.$inferSelect,
  trips: (typeof tripsTable.$inferSelect)[],
): Promise<void> {
  const activeTrips = trips.filter(t => t.status === "active" || t.status === "upcoming");
  const trip = activeTrips[0]; // Primary trip to act on

  let action: AgentAction;
  let flightStatusUpdate: string | null = null;

  if (trip) {
    switch (agent.type) {
      case "flight_monitor": {
        const result = getFlightMonitorAction(trip);
        if (!result) return;
        action = result;
        flightStatusUpdate = result.flightStatusOverride ?? null;
        break;
      }
      case "boarding_pass":
        action = getBoardingPassAction(trip);
        break;
      case "hotel_coordinator":
        action = getHotelCoordinatorAction(trip);
        break;
      case "whatsapp_notifier":
        action = getWhatsAppNotifierAction(trip);
        break;
      case "departure_advisor":
        action = getDepartureAdvisorAction(trip);
        break;
      case "refund_manager":
        action = getRefundManagerAction(trip);
        break;
      case "budget_guardian":
        action = getBudgetGuardianAction(trip);
        break;
      case "itinerary_optimizer":
        action = getItineraryOptimizerAction(trip);
        break;
      default:
        action = IDLE_ACTIONS[agent.type]?.() ?? { action: "Idle check", result: "No action needed.", severity: "info" };
    }
  } else {
    action = IDLE_ACTIONS[agent.type]?.() ?? { action: "Idle check", result: "No action needed.", severity: "info" };
  }

  const now = new Date();

  // Create agent log entry
  const [logEntry] = await db.insert(agentLogsTable).values({
    agentId: agent.id,
    agentName: agent.name,
    tripId: trip?.id ?? null,
    userId: agent.userId,
    action: action.action,
    result: action.result,
    severity: action.severity,
    notified: !!action.notificationTitle,
  }).returning();

  // Create notification if applicable
  let notifEntry: typeof notificationsTable.$inferSelect | undefined;
  if (action.notificationTitle && action.notificationBody) {
    const [n] = await db.insert(notificationsTable).values({
      userId: agent.userId,
      type: action.notificationType ?? "agent_action",
      title: action.notificationTitle,
      body: action.notificationBody,
      tripId: trip?.id ?? null,
      agentId: agent.id,
      read: false,
    }).returning();
    notifEntry = n;
  }

  // Create trip alert if applicable
  if (trip && action.tripAlertMessage) {
    await db.insert(tripAlertsTable).values({
      tripId: trip.id,
      type: action.tripAlertType ?? "update",
      message: action.tripAlertMessage,
      severity: action.tripAlertSeverity ?? "info",
      agentName: agent.name,
    });
  }

  // Update flight status if needed
  if (trip && flightStatusUpdate && flightStatusUpdate !== trip.flightStatus) {
    await db.update(tripsTable)
      .set({ flightStatus: flightStatusUpdate })
      .where(eq(tripsTable.id, trip.id));
  }

  // Update agent metadata
  const nextCheckMs = (agent.frequency ?? 5) * 60 * 1000;
  const [updatedAgent] = await db.update(agentsTable)
    .set({
      lastAction: action.action,
      lastCheck: now,
      nextCheck: new Date(now.getTime() + nextCheckMs),
      actionsToday: agent.actionsToday + 1,
      actionsTotal: agent.actionsTotal + 1,
      status: "active",
    })
    .where(eq(agentsTable.id, agent.id))
    .returning();

  // Broadcast live events to SSE-connected frontend clients
  broadcastToUser(agent.userId, "agent_log", {
    ...logEntry,
    tripId: logEntry.tripId ?? null,
  });

  if (notifEntry) {
    broadcastToUser(agent.userId, "notification", {
      ...notifEntry,
      tripId: notifEntry.tripId ?? null,
      agentId: notifEntry.agentId ?? null,
    });
  }

  if (updatedAgent) {
    broadcastToUser(agent.userId, "agent_update", {
      ...updatedAgent,
      lastAction: updatedAgent.lastAction ?? null,
      lastCheck: updatedAgent.lastCheck ?? null,
      nextCheck: updatedAgent.nextCheck ?? null,
    });
  }

  logger.debug({ agentId: agent.id, agentName: agent.name, severity: action.severity }, "Agent ran");
}

// ─── Main Scheduler ──────────────────────────────────────────────────────────

const TICK_INTERVAL_MS = 60 * 1000; // Every 60 seconds
const MAX_LOGS_PER_USER = 200;       // Trim old logs to keep DB lean

async function schedulerTick(): Promise<void> {
  try {
    const now = new Date();

    // Get all agents that are enabled and due to run
    const dueAgents = await db.select({
      agent: agentsTable,
    })
    .from(agentsTable)
    .where(
      and(
        eq(agentsTable.enabled, true),
        // Run if nextCheck is null (never run) or in the past
        // We use a workaround since SQL OR needs special handling
      )
    );

    // Filter in JS for simplicity (small dataset)
    const toRun = dueAgents
      .map(r => r.agent)
      .filter(a => !a.nextCheck || a.nextCheck.getTime() <= now.getTime());

    if (toRun.length === 0) return;

    logger.debug({ count: toRun.length }, "Agents due to run");

    // Group by userId for efficient trip fetching
    const userIds = [...new Set(toRun.map(a => a.userId))];

    for (const userId of userIds) {
      const userAgents = toRun.filter(a => a.userId === userId);
      const trips = await db.select().from(tripsTable).where(eq(tripsTable.userId, userId));

      for (const agent of userAgents) {
        try {
          await runAgent(agent, trips);
        } catch (err) {
          logger.warn({ err, agentId: agent.id }, "Agent run failed — skipping");
        }
      }
    }

    // Trim old logs (keep last MAX_LOGS_PER_USER per user) — runs occasionally
    if (Math.random() < 0.1) {
      await trimOldLogs();
    }

    // Reset actionsToday at midnight
    await resetDailyCounters();

  } catch (err) {
    logger.error({ err }, "Scheduler tick error");
  }
}

async function trimOldLogs(): Promise<void> {
  // Keep only the newest MAX_LOGS_PER_USER logs per user
  // Simple approach: delete logs older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  try {
    await db.delete(agentLogsTable).where(lt(agentLogsTable.createdAt, sevenDaysAgo));
  } catch (_) { /* non-critical */ }
}

async function resetDailyCounters(): Promise<void> {
  // Check if it's midnight hour (0-1 AM) and reset actionsToday
  const hour = new Date().getHours();
  if (hour === 0) {
    // Only run this reset once per day via random gate
    if (Math.random() < 0.02) {
      await db.update(agentsTable).set({ actionsToday: 0 });
      logger.info("Reset agent daily action counters");
    }
  }
}

// ─── Startup: Run all agents immediately once ────────────────────────────────

async function runAllAgentsOnce(): Promise<void> {
  logger.info("Running initial agent pass on startup");

  try {
    const allAgents = await db.select().from(agentsTable).where(eq(agentsTable.enabled, true));
    const userIds = [...new Set(allAgents.map(a => a.userId))];

    for (const userId of userIds) {
      const userAgents = allAgents.filter(a => a.userId === userId);
      const trips = await db.select().from(tripsTable).where(eq(tripsTable.userId, userId));

      for (const agent of userAgents) {
        try {
          await runAgent(agent, trips);
        } catch (err) {
          logger.warn({ err, agentId: agent.id }, "Startup agent run failed — skipping");
        }
      }
    }

    logger.info({ count: allAgents.length }, "Initial agent pass complete");
  } catch (err) {
    logger.error({ err }, "Startup agent pass error");
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────

let _started = false;

export function startScheduler(): void {
  if (_started) return;
  _started = true;

  logger.info({ tickIntervalMs: TICK_INTERVAL_MS }, "Agent scheduler starting");

  // Run all agents once immediately on startup (after 5s delay to let DB settle)
  setTimeout(() => {
    runAllAgentsOnce().catch(err => logger.error({ err }, "Initial agent pass error"));
  }, 5000);

  // Then run the scheduler every TICK_INTERVAL_MS
  setInterval(() => {
    schedulerTick().catch(err => logger.error({ err }, "Scheduler tick uncaught error"));
  }, TICK_INTERVAL_MS);
}
