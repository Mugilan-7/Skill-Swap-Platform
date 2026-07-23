import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 20000);
const MAX_MESSAGE_LENGTH = 4000;

function normalizeMessage(req) {
  return String(req.body.message ?? req.body.prompt ?? "").trim();
}

function jsonError(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function getProvider() {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) return "google";
  return null;
}

function buildContext(user, matches) {
  const offered = Array.isArray(user.skillsOffered) ? user.skillsOffered : [];
  const wanted = Array.isArray(user.skillsWanted) ? user.skillsWanted : [];
  const nearby = matches
    .map((match) => {
      const matchOffers = Array.isArray(match.skillsOffered) ? match.skillsOffered.join(", ") : "";
      const matchWants = Array.isArray(match.skillsWanted) ? match.skillsWanted.join(", ") : "";
      return `${match.name} offers ${matchOffers || "unspecified skills"} and wants ${matchWants || "unspecified skills"}`;
    })
    .join(" | ");

  return [
    "You are the SkillSwap Hub assistant. Give concise, practical advice for learning skills, improving profiles, and finding skill-swap partners.",
    `Current user: ${user.name}`,
    `Offers: ${offered.join(", ") || "none listed"}`,
    `Wants: ${wanted.join(", ") || "none listed"}`,
    `Nearby candidates: ${nearby || "none available"}`
  ].join("\n");
}

async function withTimeout(operation) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error("AI provider request timed out");
      error.name = "TimeoutError";
      reject(error);
    }, AI_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation(), timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function askOpenAI(context, message) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: context },
          { role: "user", content: message }
        ],
        temperature: 0.4
      })
    });

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const error = new Error(data.error?.message || "OpenAI request failed");
      error.status = response.status;
      throw error;
    }

    return data.choices?.[0]?.message?.content?.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function askGoogle(context, message) {
  return withTimeout(async () => {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GOOGLE_GENERATIVE_AI_MODEL || "gemini-1.5-flash" });
    const result = await model.generateContent(`${context}\n\nUser question: ${message}`);
    return result.response.text()?.trim();
  });
}

function mapProviderError(error) {
  const status = Number(error.status || error.statusCode || error.response?.status);
  const text = String(error.message || "");

  if (error.name === "AbortError" || error.name === "TimeoutError" || /timed out|timeout/i.test(text)) {
    return { status: 504, message: "AI provider timed out. Please try again." };
  }
  if (status === 401 || status === 403 || /api key|permission|unauthorized|forbidden/i.test(text)) {
    return { status: 503, message: "AI provider credentials are invalid or unauthorized." };
  }
  if (status === 429 || /rate limit|quota/i.test(text)) {
    return { status: 429, message: "AI service is rate limited. Please try again soon." };
  }
  if (status >= 400 && status < 500) {
    return { status, message: "AI request was rejected by the provider." };
  }
  return { status: 502, message: "AI provider failed to generate a response." };
}

export const askChatbot = asyncHandler(async (req, res) => {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const message = normalizeMessage(req);

  console.log(`[ai:${requestId}] incoming request user=${req.user?._id || "unknown"} length=${message.length}`);

  if (!message) {
    console.warn(`[ai:${requestId}] invalid request: empty message`);
    return jsonError(res, 400, "Message is required.");
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    console.warn(`[ai:${requestId}] invalid request: message too long`);
    return jsonError(res, 413, `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
  }

  const provider = getProvider();
  if (!provider) {
    console.error(`[ai:${requestId}] missing provider API key`);
    return jsonError(res, 503, "AI service is not configured. Set OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY on the server.");
  }

  const matches = await User.find({ _id: { $ne: req.user._id } })
    .select("name skillsOffered skillsWanted ratingAverage category badges")
    .limit(12);
  const context = buildContext(req.user, matches);
  const startedAt = Date.now();

  try {
    const reply = provider === "openai" ? await askOpenAI(context, message) : await askGoogle(context, message);
    const latency = Date.now() - startedAt;

    if (!reply) {
      console.error(`[ai:${requestId}] empty provider response provider=${provider} latencyMs=${latency}`);
      return jsonError(res, 502, "AI provider returned an empty response.");
    }

    console.log(`[ai:${requestId}] outgoing response provider=${provider} latencyMs=${latency} replyLength=${reply.length}`);
    return res.json({ success: true, reply });
  } catch (error) {
    const latency = Date.now() - startedAt;
    const mapped = mapProviderError(error);
    console.error(`[ai:${requestId}] provider error provider=${provider} latencyMs=${latency} status=${mapped.status} message=${error.message}`);
    return jsonError(res, mapped.status, mapped.message);
  }
});
