import { Router } from "express";
import { db, itinerariesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

router.get("/itineraries", requireAuth, async (req: AuthRequest, res) => {
  try {
    const itins = await db.select().from(itinerariesTable)
      .where(eq(itinerariesTable.userId, req.userId!))
      .orderBy(desc(itinerariesTable.createdAt));
    res.json(itins.map(formatItinerary));
  } catch (err) {
    req.log.error({ err }, "List itineraries error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/itineraries", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) { res.status(400).json({ error: "Prompt required" }); return; }

    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{
        role: "user",
        content: `You are TARA, an AI travel planner for Nigerian travelers. Generate a detailed trip itinerary based on this request: "${prompt}". 
        
        Respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact format:
        {
          "title": "5-Day Lagos to Abuja Business Trip",
          "totalCostNgn": 185000,
          "days": [
            {
              "day": 1,
              "date": "2026-06-01",
              "city": "Lagos",
              "activities": ["Check in at Eko Hotels", "Business meeting at Victoria Island", "Dinner at Yellow Chilli"],
              "flightSegment": "Air Peace 9J401 LOS-ABJ 07:00",
              "hotelName": "Transcorp Hilton Abuja",
              "estimatedCostNgn": 85000
            }
          ]
        }
        
        Use Nigerian airports: LOS (Lagos), ABJ (Abuja), PHC (Port Harcourt), KAN (Kano), ENU (Enugu).
        Airlines: Air Peace (9J), Ibom Air (QI), United Nigeria (UNC).
        Flight prices: ₦28,000–₦95,000. Hotel prices: ₦45,000–₦280,000/night.
        Make it realistic for Nigeria.`
      }]
    });

    let itinData: { title: string; totalCostNgn: number; days: unknown[] };
    try {
      const content = aiResponse.content[0];
      const text = content.type === "text" ? content.text : "{}";
      itinData = JSON.parse(text);
    } catch {
      itinData = {
        title: `Trip Itinerary`,
        totalCostNgn: 150000,
        days: [{ day: 1, date: new Date().toISOString().slice(0, 10), city: "Lagos", activities: ["Check in at hotel", "Explore the city", "Dinner"], estimatedCostNgn: 50000 }]
      };
    }

    const [itin] = await db.insert(itinerariesTable).values({
      userId: req.userId!,
      prompt,
      title: itinData.title || "Trip Itinerary",
      totalCostNgn: itinData.totalCostNgn || 0,
      days: itinData.days || [],
      status: "draft",
    }).returning();

    res.status(201).json(formatItinerary(itin));
  } catch (err) {
    req.log.error({ err }, "Create itinerary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/itineraries/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [itin] = await db.select().from(itinerariesTable)
      .where(and(eq(itinerariesTable.id, id), eq(itinerariesTable.userId, req.userId!)));
    if (!itin) { res.status(404).json({ error: "Itinerary not found" }); return; }
    res.json(formatItinerary(itin));
  } catch (err) {
    req.log.error({ err }, "Get itinerary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/itineraries/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(itinerariesTable).where(and(eq(itinerariesTable.id, id), eq(itinerariesTable.userId, req.userId!)));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete itinerary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatItinerary(i: typeof itinerariesTable.$inferSelect) {
  return {
    ...i,
    days: Array.isArray(i.days) ? i.days : [],
  };
}

export default router;
