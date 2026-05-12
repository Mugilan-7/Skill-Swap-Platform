import { asyncHandler } from "../utils/asyncHandler.js";

export const socialChat = asyncHandler(async (req, res) => {
  const message = String(req.body.message || "").trim();
  if (!message) return res.status(400).json({ message: "Message is required" });

  if (!process.env.OPENAI_API_KEY) {
    return res.json({
      reply: `Mock AI: ${message}. Add OPENAI_API_KEY to server/.env for live OpenAI responses.`
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are SkillSwap Hub's social feed assistant. Keep responses concise and helpful." },
        { role: "user", content: message }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    return res.status(response.status).json({ message: data.error?.message || "OpenAI request failed" });
  }

  res.json({ reply: data.choices?.[0]?.message?.content || "I could not generate a response." });
});
