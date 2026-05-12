import express from "express";
import { createSwap, createSwapRules, listSwaps, rateSwap, rateSwapRules, updateSwapStatus } from "../controllers/swapController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../utils/validators.js";

const router = express.Router();

router.get("/", protect, listSwaps);
router.post("/", protect, createSwapRules, validate, createSwap);
router.patch("/:id/status", protect, updateSwapStatus);
router.post("/:id/rate", protect, rateSwapRules, validate, rateSwap);

export default router;
