import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const askChatbot = asyncHandler(async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || prompt.trim().length < 2) {
    return res.status(400).json({ message: "Prompt is required" });
  }
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return res.status(503).json({ message: "Google Generative AI API key is not configured" });
  }

  const matches = await User.find({ _id: { $ne: req.user._id } })
    .select("name skillsOffered skillsWanted ratingAverage category badges")
    .limit(12);

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const context = `
You are the SkillSwap Hub assistant. Give concise, practical advice.
Current user:
Name: ${req.user.name}
Offers: ${req.user.skillsOffered.join(", ") || "none listed"}
Wants: ${req.user.skillsWanted.join(", ") || "none listed"}
Nearby candidates: ${matches.map((u) => `${u.name} offers ${u.skillsOffered.join(", ")} and wants ${u.skillsWanted.join(", ")}`).join(" | ")}
`;

  const result = await model.generateContent(`${context}\nUser question: ${prompt}`);
  res.json({ reply: result.response.text() });
});
