import express from "express";
import {
  emailRules,
  forgotPassword,
  login,
  loginRules,
  me,
  register,
  registerRules,
  resendVerification,
  resetPassword,
  resetPasswordRules,
  verifyEmail
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimit } from "../middleware/rateLimitMiddleware.js";
import { validate } from "../utils/validators.js";

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, message: "Too many authentication attempts. Please wait and try again." });

router.post("/register", authLimiter, registerRules, validate, register);
router.post("/signup", authLimiter, registerRules, validate, register);
router.post("/login", authLimiter, loginRules, validate, login);
router.get("/me", protect, me);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", emailRules, validate, resendVerification);
router.post("/forgot-password", emailRules, validate, forgotPassword);
router.post("/reset-password/:token", resetPasswordRules, validate, resetPassword);

export default router;
