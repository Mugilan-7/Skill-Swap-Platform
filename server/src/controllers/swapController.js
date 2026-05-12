import { body } from "express-validator";
import SwapRequest from "../models/SwapRequest.js";
import Rating from "../models/Rating.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../utils/notifications.js";

const populateUsers = [
  { path: "from", select: "name email profilePicture skillsOffered skillsWanted ratingAverage badges" },
  { path: "to", select: "name email profilePicture skillsOffered skillsWanted ratingAverage badges" }
];

export const createSwapRules = [
  body("to").isMongoId().withMessage("Recipient is required"),
  body("offeredSkill").trim().notEmpty().withMessage("Offered skill is required"),
  body("wantedSkill").trim().notEmpty().withMessage("Wanted skill is required"),
  body("message").optional().isLength({ max: 300 }).withMessage("Message must be 300 characters or less")
];

export const rateSwapRules = [
  body("score").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().isLength({ max: 300 }).withMessage("Comment must be 300 characters or less")
];

export const createSwap = asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.body.to) {
    return res.status(400).json({ message: "You cannot send a swap request to yourself" });
  }

  const swap = await SwapRequest.create({
    from: req.user._id,
    to: req.body.to,
    offeredSkill: req.body.offeredSkill,
    wantedSkill: req.body.wantedSkill,
    message: req.body.message || ""
  });

  const populated = await swap.populate(populateUsers);
  await createNotification(req.app.get("io"), {
    user: req.body.to,
    type: "swap",
    title: "New skill swap request",
    body: `${req.user.name} wants to swap ${req.body.offeredSkill} for ${req.body.wantedSkill}`,
    link: "/dashboard"
  });

  res.status(201).json(populated);
});

export const listSwaps = asyncHandler(async (req, res) => {
  const swaps = await SwapRequest.find({ $or: [{ from: req.user._id }, { to: req.user._id }] })
    .populate(populateUsers)
    .sort({ createdAt: -1 });

  res.json({
    sent: swaps.filter((swap) => String(swap.from._id) === String(req.user._id)),
    received: swaps.filter((swap) => String(swap.to._id) === String(req.user._id)),
    accepted: swaps.filter((swap) => swap.status === "accepted"),
    completed: swaps.filter((swap) => swap.status === "completed")
  });
});

export const updateSwapStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["accepted", "rejected", "completed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const swap = await SwapRequest.findById(req.params.id);
  if (!swap) return res.status(404).json({ message: "Swap request not found" });

  const isRecipient = String(swap.to) === String(req.user._id);
  const isParticipant = [String(swap.from), String(swap.to)].includes(String(req.user._id));
  if ((status === "accepted" || status === "rejected") && !isRecipient) {
    return res.status(403).json({ message: "Only the recipient can accept or reject" });
  }
  if (status === "completed" && !isParticipant) {
    return res.status(403).json({ message: "Only participants can complete a swap" });
  }

  swap.status = status;
  await swap.save();
  const populated = await swap.populate(populateUsers);
  const notifyUser = status === "completed" ? (String(swap.from) === String(req.user._id) ? swap.to : swap.from) : swap.from;

  await createNotification(req.app.get("io"), {
    user: notifyUser,
    type: "swap",
    title: `Swap ${status}`,
    body: `${req.user.name} marked your swap as ${status}`,
    link: "/dashboard"
  });

  req.app.get("io")?.to(`swap:${swap._id}`).emit("swap:updated", populated);
  res.json(populated);
});

export const rateSwap = asyncHandler(async (req, res) => {
  const swap = await SwapRequest.findById(req.params.id);
  if (!swap) return res.status(404).json({ message: "Swap request not found" });
  if (swap.status !== "completed") return res.status(400).json({ message: "Complete the swap before rating" });

  const isFrom = String(swap.from) === String(req.user._id);
  const isTo = String(swap.to) === String(req.user._id);
  if (!isFrom && !isTo) return res.status(403).json({ message: "Only participants can rate this swap" });

  const ratedUserId = isFrom ? swap.to : swap.from;
  const rating = await Rating.create({
    swap: swap._id,
    from: req.user._id,
    to: ratedUserId,
    score: req.body.score,
    comment: req.body.comment || ""
  });

  const aggregate = await Rating.aggregate([
    { $match: { to: ratedUserId } },
    { $group: { _id: "$to", average: { $avg: "$score" }, count: { $sum: 1 } } }
  ]);
  const stats = aggregate[0] || { average: 0, count: 0 };
  const badges = ["Beginner"];
  if (stats.average >= 4 && stats.count >= 3) badges.push("Pro");
  if (stats.average >= 4.5 && stats.count >= 8) badges.push("Mentor");

  await User.findByIdAndUpdate(ratedUserId, {
    ratingAverage: Number(stats.average.toFixed(1)),
    ratingCount: stats.count,
    badges
  });

  await createNotification(req.app.get("io"), {
    user: ratedUserId,
    type: "rating",
    title: "New rating received",
    body: `${req.user.name} rated your swap ${req.body.score}/5`,
    link: "/profile"
  });

  res.status(201).json(rating);
});
