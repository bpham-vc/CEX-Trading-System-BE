import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

const exchangeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["MEXC", "GATE", "BITMART", "LBANK", "XT"],
      required: true,
    },
    projects: [projectSchema],
  },
  { timestamps: true }
);

export const Exchange = mongoose.model("Exchange", exchangeSchema);
