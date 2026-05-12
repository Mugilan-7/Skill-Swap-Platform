import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import SwapRequest from "../models/SwapRequest.js";
import Message from "../models/Message.js";
import { createNotification } from "../utils/notifications.js";

export function configureSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user._id}`);

    socket.on("swap:join", async (swapId, callback) => {
      const swap = await SwapRequest.findById(swapId);
      const allowed =
        swap &&
        swap.status === "accepted" &&
        [String(swap.from), String(swap.to)].includes(String(socket.user._id));

      if (!allowed) return callback?.({ ok: false, message: "Chat is locked until the swap is accepted" });
      socket.join(`swap:${swapId}`);
      callback?.({ ok: true });
    });

    socket.on("message:send", async ({ swapId, text }, callback) => {
      try {
        if (!text?.trim()) return callback?.({ ok: false, message: "Message cannot be empty" });
        const swap = await SwapRequest.findById(swapId);
        const allowed =
          swap &&
          swap.status === "accepted" &&
          [String(swap.from), String(swap.to)].includes(String(socket.user._id));

        if (!allowed) return callback?.({ ok: false, message: "Chat is locked until the swap is accepted" });
        const recipient = String(swap.from) === String(socket.user._id) ? swap.to : swap.from;
        const message = await Message.create({ swap: swapId, sender: socket.user._id, recipient, text: text.trim() });
        const populated = await message.populate("sender", "name profilePicture");
        io.to(`swap:${swapId}`).emit("message:new", populated);
        await createNotification(io, {
          user: recipient,
          type: "chat",
          title: `New message from ${socket.user.name}`,
          body: text.trim().slice(0, 80),
          link: "/chat"
        });
        callback?.({ ok: true, message: populated });
      } catch (error) {
        callback?.({ ok: false, message: error.message });
      }
    });
  });

  return io;
}
