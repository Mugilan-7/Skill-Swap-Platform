import express from "express";
import { getMessages, messageRules, sendMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../utils/validators.js";

const router = express.Router();

router.get("/:swapId/messages", protect, getMessages);
router.post("/:swapId/messages", protect, messageRules, validate, sendMessage);

export default router;
