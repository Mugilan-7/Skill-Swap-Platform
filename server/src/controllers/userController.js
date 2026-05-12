import { body } from "express-validator";
import User from "../models/User.js";
import SwapRequest from "../models/SwapRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { toArray } from "../utils/validators.js";

export const updateProfileRules = [
  body("name").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("bio").optional().isLength({ max: 500 }).withMessage("Bio must be 500 characters or less"),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be empty")
];

export const listUsers = asyncHandler(async (req, res) => {
  const { search = "", category = "" } = req.query;
  const query = { _id: { $ne: req.user._id } };

  if (category) query.category = category;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { skillsOffered: { $regex: search, $options: "i" } },
      { skillsWanted: { $regex: search, $options: "i" } }
    ];
  }

  const users = await User.find(query).select("-password").sort({ ratingAverage: -1, createdAt: -1 }).limit(50);
  res.json(users);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {
    name: req.body.name ?? req.user.name,
    bio: req.body.bio ?? req.user.bio,
    category: req.body.category ?? req.user.category,
    skillsOffered: req.body.skillsOffered === undefined ? req.user.skillsOffered : toArray(req.body.skillsOffered),
    skillsWanted: req.body.skillsWanted === undefined ? req.user.skillsWanted : toArray(req.body.skillsWanted)
  };

  if (req.file) {
    updates.profilePicture = `/uploads/${req.file.filename}`;
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
  res.json(user);
});

export const dashboard = asyncHandler(async (req, res) => {
  const [sent, received, accepted, completed] = await Promise.all([
    SwapRequest.countDocuments({ from: req.user._id }),
    SwapRequest.countDocuments({ to: req.user._id, status: "pending" }),
    SwapRequest.countDocuments({ $or: [{ from: req.user._id }, { to: req.user._id }], status: "accepted" }),
    SwapRequest.countDocuments({ $or: [{ from: req.user._id }, { to: req.user._id }], status: "completed" })
  ]);

  const trendingSkills = await User.aggregate([
    { $unwind: "$skillsOffered" },
    { $group: { _id: { $toLower: "$skillsOffered" }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 }
  ]);

  res.json({
    stats: { sent, received, accepted, completed, rating: req.user.ratingAverage },
    trendingSkills: trendingSkills.map((skill) => ({ name: skill._id, count: skill.count }))
  });
});

export const recommendations = asyncHandler(async (req, res) => {
  const wanted = req.user.skillsWanted.map((skill) => skill.toLowerCase());
  const offered = req.user.skillsOffered.map((skill) => skill.toLowerCase());

  const users = await User.find({ _id: { $ne: req.user._id } }).select("-password").limit(100);
  const scored = users
    .map((user) => {
      const theirOffered = user.skillsOffered.map((skill) => skill.toLowerCase());
      const theirWanted = user.skillsWanted.map((skill) => skill.toLowerCase());
      const givesMatch = theirOffered.filter((skill) => wanted.includes(skill)).length;
      const getsMatch = theirWanted.filter((skill) => offered.includes(skill)).length;
      return { user, score: givesMatch * 2 + getsMatch + user.ratingAverage / 5 };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  res.json(scored);
});
