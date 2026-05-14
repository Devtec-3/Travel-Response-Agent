import { Router } from "express";
import { db, conversations, messages } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

const TARA_SYSTEM_PROMPT = `You are TARA (Travel Autonomous Response Agent), an AI travel assistant for Nigerian travelers. You help book flights, hotels, plan trips, and manage travel autonomously.

Always respond in a friendly, helpful, professional tone. You are smart, fast, and proactive.

Key guidelines:
- Use Naira (₦) for all pricing
- Reference Nigerian airports: Lagos Murtala Muhammed (LOS), Abuja Nnamdi Azikiwe (ABJ), Port Harcourt International (PHC), Mallam Aminu Kano International (KAN), Akanu Ibiam Enugu (ENU)
- Nigerian airlines: Air Peace (9J), Ibom Air (QI), United Nigeria Airlines (UNC), Overland Airways (OL)
- Flight prices range from ₦28,000 to ₦95,000 for domestic routes
- Hotel prices: ₦45,000 to ₦280,000/night (Transcorp Hilton Abuja, Eko Hotels Lagos, Radisson Blu Lagos, Presidential Hotel PH)
- Understand Nigerian context clues: "the island" = Lagos Island/VI, "Third Mainland" = traffic on Third Mainland Bridge, "FCT" = Abuja
- For anniversary/romantic getaways: suggest Abuja (Transcorp Hilton) or Port Harcourt
- For budget trips: recommend Ibom Air or United Nigeria Airlines
- When showing flights, always show 3 options comparing price, duration, and airline
- Be context-aware: remember what the user said earlier in the conversation

When the user asks about booking, show specific flight/hotel options with prices. When they ask for planning, be comprehensive. Always be actionable.`;

router.get("/anthropic/conversations", async (req, res) => {
  try {
    const convs = await db.select().from(conversations).orderBy(desc(conversations.createdAt));
    res.json(convs);
  } catch (err) {
    req.log.error({ err }, "List conversations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/anthropic/conversations", async (req, res) => {
  try {
    const { title } = req.body;
    const [conv] = await db.insert(conversations).values({ title: title || "New Chat" }).returning();
    res.status(201).json(conv);
  } catch (err) {
    req.log.error({ err }, "Create conversation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/anthropic/conversations/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error({ err }, "Get conversation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/anthropic/conversations/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
    await db.delete(conversations).where(eq(conversations.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete conversation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/anthropic/conversations/:id/messages", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    res.json(msgs);
  } catch (err) {
    req.log.error({ err }, "List messages error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/anthropic/conversations/:id/messages", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body;

    if (!content) { res.status(400).json({ error: "Content required" }); return; }

    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }

    // Save user message
    await db.insert(messages).values({ conversationId: id, role: "user", content });

    // Get conversation history for context
    const history = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    const chatMessages = history.map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    let fullResponse = "";

    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: TARA_SYSTEM_PROMPT,
      messages: chatMessages,
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        fullResponse += event.delta.text;
        res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
      }
    }

    // Save assistant message
    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Send message error");
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
