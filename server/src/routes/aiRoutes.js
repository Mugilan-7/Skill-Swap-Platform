import express from "express";
import { body } from "express-validator";
import { askChatbot } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimit } from "../middleware/rateLimitMiddleware.js";
import { validate } from "../utils/validators.js";

const router = express.Router();
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: "AI assistant is receiving too many requests. Please pause for a moment." });

router.post(
  "/chat",
  protect,
  aiLimiter,
  body().custom((value) => {
    const message = String(value?.message ?? value?.prompt ?? "").trim();
    if (!message) throw new Error("Message is required.");
    if (message.length > 4000) throw new Error("Message must be 4000 characters or fewer.");
    return true;
  }),
  validate,
  askChatbot
);

export default router;
