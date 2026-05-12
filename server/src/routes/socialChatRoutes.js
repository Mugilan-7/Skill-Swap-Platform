import express from "express";
import { body } from "express-validator";
import { protect } from "../middleware/authMiddleware.js";
import { socialChat } from "../controllers/socialChatController.js";
import { validate } from "../utils/validators.js";

const router = express.Router();

router.post("/", protect, body("message").trim().isLength({ min: 1, max: 1000 }), validate, socialChat);

export default router;
