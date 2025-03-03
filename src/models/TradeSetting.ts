import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    orderId: { type: String, required: true },
    exchangeName: { type: String, required: true },
    symbol: { type: String, required: true },
    price: { type: Number, required: true },
    amount: { type: Number, required: true },
    side: { type: String, enum: ["buy", "sell"], required: true },
    timestamp: { type: Number, required: true },
    percentage: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { timestamps: true }
);

const tradeSettingSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exchange.projects",
    },
    minOrderAmountInDollar: { type: Number, require: true },
    minOrderSizePercent: { type: Number, min: 0, max: 100, require: true },
    maxOrderSizePercent: {
      type: Number,
      min: 0,
      max: 100,
      require: true,
      validate: {
        validator: function (this: any, value: number) {
          return value > this.minOrderSizePercent;
        },
      },
    },
    minTimeGap: { type: Number, require: true },
    priceSlippage: { type: Number, min: 0, max: 100, require: true },
    totalAmountToSell: { type: Number, require: true },
    trades: [tradeSchema],
  },
  { timestamps: true }
);

export const TradeSetting = mongoose.model("TradeSetting", tradeSettingSchema);
