import mongoose from "mongoose";

export interface ITrade {
  _id?: mongoose.Schema.Types.ObjectId;
  orderId: string;
  exchange: string;
  symbol: string;
  price: number;
  amount: number;
  side: "buy" | "sell";
  timestamp: number;
  percentage: number;
  total: number;
}

export interface ITradeSetting {
  _id: mongoose.Schema.Types.ObjectId;
  projectId: mongoose.Schema.Types.ObjectId;
  isActive: boolean;
  minOrderAmountInDollar: number;
  minOrderSizePercent: number;
  maxOrderSizePercent: number;
  minTimeGap: number;
  priceSlippage: number;
  lastTradeTime: number;
  totalSoldAmount: number;
  totalAmountToSell: number;
  trades: ITrade[];
}

const tradeSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    orderId: { type: String, required: true },
    exchange: { type: String, required: true },
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
    isActive: { type: Boolean, require: true, default: false },
    minOrderAmountInDollar: { type: Number, require: true, default: 100 },
    minOrderSizePercent: {
      type: Number,
      min: 0,
      max: 100,
      require: true,
      default: 80,
    },
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
      default: 100,
    },
    minTimeGap: { type: Number, require: true, default: 5 },
    priceSlippage: {
      type: Number,
      min: 0,
      max: 100,
      require: true,
      default: 0,
    },
    lastTradeTime: { type: Number, require: true, default: 0 },
    totalSoldAmount: { type: Number, require: true, default: 0 },
    totalAmountToSell: { type: Number, require: true, default: 0 },
    trades: [tradeSchema],
  },
  { timestamps: true }
);

export const TradeSetting = mongoose.model<ITradeSetting>(
  "TradeSetting",
  tradeSettingSchema
);
