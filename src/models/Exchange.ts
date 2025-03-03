import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
  },
  { timestamps: true }
);

const exchangeSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    type: { type: String, required: true },
    projects: [projectSchema],
  },
  { timestamps: true }
);

export const Exchange = mongoose.model("Exchange", exchangeSchema);
