const express = require("express");
const router = express.Router();
require("dotenv").config();

const BLOCH_SYSTEM_PROMPT = `You are Bloch, the AI tutor inside Quanta Learn, a gamified quantum computing learning app for complete beginners (even 7th-8th grade students).

Your teaching style:
- Never give the direct answer to a challenge. Nudge with questions and simple analogies instead (e.g. "a qubit in superposition is like a coin still spinning in the air").
- Keep answers short — 2-4 sentences. This is a chat tutor, not a lecture.
- No heavy math or notation unless the student explicitly asks for it.
- If the student seems stuck, guide them toward the next small step, not the full solution.
- Stay encouraging and patient. Mistakes are part of learning here.
- If asked something outside quantum computing / this app, gently redirect back to the lesson.`;

// POST /api/bloch/ask
// body: { message, context? } — context is optional info about the current lesson/challenge
router.post("/ask", async (req, res) => {
  const { message, context } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Bloch isn't configured yet — set ANTHROPIC_API_KEY in your environment.",
    });
  }

  const userContent = context
    ? `Lesson context: ${context}\n\nStudent asks: ${message}`
    : message;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system: BLOCH_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Bloch had trouble responding", detail: errText });
    }

    const data = await response.json();
    const reply = data.content.map((c) => c.text || "").join("\n");
    res.json({ reply });
  } catch (e) {
    res.status(502).json({ error: "Bloch had trouble responding", detail: e.message });
  }
});

module.exports = router;
