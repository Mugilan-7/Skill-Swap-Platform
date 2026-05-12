import { body } from "express-validator";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createToken } from "../utils/tokens.js";
import { toArray } from "../utils/validators.js";
import { appUrl, sendEmail } from "../utils/email.js";
import { createPlainToken, hashToken } from "../utils/cryptoTokens.js";

export const registerRules = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("skillsOffered").optional(),
  body("skillsWanted").optional()
];

export const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required")
];

export const emailRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required")
];

export const resetPasswordRules = [
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];

async function sendVerificationEmail(user) {
  const { token, hash } = createPlainToken();
  user.emailVerificationToken = hash;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const link = appUrl(`/verify-email/${token}`);
  const result = await sendEmail({
    to: user.email,
    subject: "Verify your SkillSwap Hub email",
    text: `Verify your SkillSwap Hub email: ${link}`,
    html: `<p>Verify your SkillSwap Hub email:</p><p><a href="${link}">${link}</a></p>`
  });
  return { link, dev: result.dev };
}

export const register = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) return res.status(409).json({ message: "Email already registered" });

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    category: req.body.category || "coding",
    skillsOffered: toArray(req.body.skillsOffered),
    skillsWanted: toArray(req.body.skillsWanted),
    emailVerified: false,
    badges: ["Beginner"]
  });

  const verification = await sendVerificationEmail(user);

  res.status(201).json({
    message: verification.dev
      ? "Account created. Email delivery is not configured locally, so the verification link was written to the server log."
      : "Account created. Check your email to verify your account before logging in.",
    user: user.toSafeObject()
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await user.matchPassword(req.body.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (!user.emailVerified && user.emailVerificationToken) {
    return res.status(403).json({ message: "Please verify your email before logging in" });
  }

  res.json({ user: user.toSafeObject(), token: createToken(user._id) });
});

export const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    emailVerificationToken: hashToken(req.params.token),
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) return res.status(400).json({ message: "Verification link is invalid or expired" });

  user.emailVerified = true;
  user.emailVerificationToken = "";
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json({ message: "Email verified. You can now log in." });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.json({ message: "If an account exists and is unverified, a verification email has been sent." });
  }
  if (user.emailVerified) {
    return res.json({ message: "This email is already verified." });
  }

  const verification = await sendVerificationEmail(user);
  res.json({
    message: verification.dev
      ? "Email delivery is not configured locally. The verification link was written to the server log."
      : "Verification email sent."
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const resetCooldownMs = 60 * 1000;
    if (user.passwordResetRequestedAt && Date.now() - user.passwordResetRequestedAt.getTime() < resetCooldownMs) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    const { token, hash } = createPlainToken();
    user.passwordResetToken = hash;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    user.passwordResetRequestedAt = new Date();
    await user.save();

    const link = appUrl(`/reset-password/${token}`);
    const result = await sendEmail({
      to: user.email,
      subject: "Reset your SkillSwap Hub password",
      text: `Reset your SkillSwap Hub password: ${link}`,
      html: `<p>Reset your SkillSwap Hub password:</p><p><a href="${link}">${link}</a></p>`
    });
    if (result.dev) {
      console.log("[password-reset] Email delivery is not configured locally. Use the reset link written above from the server log.");
    }
  }

  res.json({
    message: "If that email exists, a reset link has been sent."
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    passwordResetToken: hashToken(req.params.token),
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) return res.status(400).json({ message: "Reset link is invalid or expired" });

  user.password = req.body.password;
  user.passwordResetToken = "";
  user.passwordResetExpires = undefined;
  user.passwordResetRequestedAt = undefined;
  user.passwordChangedAt = new Date();
  await user.save();

  res.json({ message: "Password reset. You can now log in." });
});
