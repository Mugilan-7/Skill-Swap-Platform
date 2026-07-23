import express from "express";
import { body } from "express-validator";
import { askChatbot } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../utils/validators.js";

const router = express.Router();

router.post(
  "/chat",
  protect,
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
