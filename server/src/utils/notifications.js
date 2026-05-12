import Notification from "../models/Notification.js";

export async function createNotification(io, payload) {
  const notification = await Notification.create(payload);
  io?.to(`user:${payload.user}`).emit("notification:new", notification);
  return notification;
}
