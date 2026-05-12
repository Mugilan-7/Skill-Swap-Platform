import mongoose from "mongoose";

const swapRequestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    offeredSkill: { type: String, required: true },
    wantedSkill: { type: String, required: true },
    message: { type: String, default: "" },
    status: { type: String, enum: ["pending", "accepted", "rejected", "completed"], default: "pending" }
  },
  { timestamps: true }
);

swapRequestSchema.index({ from: 1, to: 1, status: 1 });

export default mongoose.model("SwapRequest", swapRequestSchema);
