import express from "express";
import { body } from "express-validator";
import { askChatbot } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../utils/validators.js";

const router = express.Router();

router.post("/chat", protect, body("prompt").trim().isLength({ min: 2, max: 500 }), validate, askChatbot);

export default router;
