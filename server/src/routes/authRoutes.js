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
import { validate } from "../utils/validators.js";

const router = express.Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.get("/me", protect, me);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", emailRules, validate, resendVerification);
router.post("/forgot-password", emailRules, validate, forgotPassword);
router.post("/reset-password/:token", resetPasswordRules, validate, resetPassword);

export default router;
