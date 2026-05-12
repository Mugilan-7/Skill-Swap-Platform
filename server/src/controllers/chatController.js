import { body } from "express-validator";
import Message from "../models/Message.js";
import SwapRequest from "../models/SwapRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const messageRules = [
  body("text").trim().isLength({ min: 1, max: 1000 }).withMessage("Message must be 1-1000 characters")
];

async function assertAcceptedParticipant(swapId, userId) {
  const swap = await SwapRequest.findById(swapId);
  if (!swap) {
    const error = new Error("Swap not found");
    error.status = 404;
    throw error;
  }
  const isParticipant = [String(swap.from), String(swap.to)].includes(String(userId));
  if (!isParticipant || swap.status !== "accepted") {
    const error = new Error("Chat is only available for accepted swaps");
    error.status = 403;
    throw error;
  }
  return swap;
}

export const getMessages = asyncHandler(async (req, res) => {
  await assertAcceptedParticipant(req.params.swapId, req.user._id);
  const messages = await Message.find({ swap: req.params.swapId })
    .populate("sender", "name profilePicture")
    .sort({ createdAt: 1 });
  res.json(messages);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const swap = await assertAcceptedParticipant(req.params.swapId, req.user._id);
  const recipient = String(swap.from) === String(req.user._id) ? swap.to : swap.from;
  const message = await Message.create({
    swap: swap._id,
    sender: req.user._id,
    recipient,
    text: req.body.text
  });
  const populated = await message.populate("sender", "name profilePicture");
  req.app.get("io")?.to(`swap:${swap._id}`).emit("message:new", populated);
  res.status(201).json(populated);
});
