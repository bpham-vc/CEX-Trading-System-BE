import { ObjectId } from "mongoose";

import { eventEmitter } from "./websocketManager";
import { Exchange } from "../models/Exchange";
import { ITradeSetting, TradeSetting } from "../models/TradeSetting";
import { Orderbook } from "../interface/Orderbook";
import { checkOrder, createOrder } from "./mexc/rest";
import { User } from "../models/User";

eventEmitter.on("orderbook", async ({ marketPrice, exchange, orderbook }) => {
  const exchanges = await Exchange.find({ type: exchange });

  const projects = exchanges.reduce<{
    [key in string]: {
      userId: string;
      exchangeId: string;
      precision: number;
      symbol: string;
    };
  }>((acc, exchange) => {
    exchange.projects.forEach((p) => {
      if (p._id && p._id.toString()) {
        acc[p._id.toString()] = {
          userId: exchange.userId?.toString() || "",
          exchangeId: exchange._id?.toString() || "",
          precision: p.basePrecision,
          symbol: p.symbol,
        };
      }
    });
    return acc;
  }, {});

  const tradeSettings = await TradeSetting.find({
    projectId: { $in: Object.keys(projects) },
    isActive: true,
  });

  tradeSettings.forEach((setting) => {
    checkForTradingOpportunities(
      projects[setting.projectId.toString()].userId,
      projects[setting.projectId.toString()].exchangeId,
      projects[setting.projectId.toString()].symbol,
      exchange,
      projects[setting.projectId.toString()].precision,
      orderbook,
      marketPrice,
      setting
    );
  });
});

const checkForTradingOpportunities = async (
  userId: string,
  exchangeId: string,
  symbol: string,
  exchange: string,
  precision: number,
  orderbook: Orderbook,
  marketPrice: number | null,
  tradeSetting: ITradeSetting
) => {
  try {
    const user = await User.findOne({ _id: userId });

    if (!user) return;

    const apiKeys = user.apiKeys.filter(
      (key) => key.exchangeId?.toString() === exchangeId
    );

    if (!apiKeys.length) return;

    const { accessKey, secretKey } = apiKeys[apiKeys.length - 1];

    const timeSinceLastTrade = Date.now() - Number(tradeSetting.lastTradeTime);
    const minDelay = tradeSetting.minTimeGap * 60 * 1000;

    // If not enough time has passed since last trade, wait
    if (
      Number(tradeSetting.lastTradeTime) > 0 &&
      timeSinceLastTrade < minDelay
    ) {
      return;
    }

    // Find valid orders from the orderbook
    const validOrders = orderbook.bids
      .map(([price, amount]) => ({ price, amount, total: price * amount }))
      .filter(
        (order) =>
          marketPrice &&
          order.price >=
            marketPrice * ((100 - tradeSetting.priceSlippage) / 100)
      )
      .sort((a, b) => b.price - a.price);

    if (!validOrders.length) {
      console.log("No valid orders found, checking again in 1s...");
      return;
    }

    // Get the best order
    const bestOrder = validOrders[0];

    // Avoid less than min order amount
    if (bestOrder.total < tradeSetting.minOrderAmountInDollar) return;

    // Avoid executing same order
    // if (
    //   this.lastTradedOrder?.price === bestOrder.price &&
    //   this.lastTradedOrder?.amount === bestOrder.amount
    // ) {
    //   return;
    // }

    // this.lastTradedOrder = {
    //   price: bestOrder.price,
    //   amount: bestOrder.amount,
    // };

    // Calculate order size based on percentage range
    const percentage = Math.trunc(
      Math.random() *
        (tradeSetting.maxOrderSizePercent - tradeSetting.minOrderSizePercent) +
        tradeSetting.minOrderSizePercent
    );

    const amount = bestOrder.amount * (percentage / 100);

    // const amount = Math.min(
    //   this.tokenBalance,
    //   bestOrder.amount * (percentage / 100)
    // );

    // if (!amount) {
    //   this.emit("stopTradingSession", {
    //     sessionId,
    //     msg: "Insufficient Balance",
    //   });
    //   return;
    // }

    console.log(
      "tradeSetting.totalAmountToSell",
      tradeSetting.totalAmountToSell
    );
    console.log("tradeSetting.totalSoldAmount", tradeSetting.totalSoldAmount);
    console.log("amount", amount);

    if (
      tradeSetting.totalAmountToSell &&
      tradeSetting.totalSoldAmount + amount > tradeSetting.totalAmountToSell
    ) {
      await TradeSetting.findByIdAndUpdate(tradeSetting._id, {
        isActive: false,
        lastTradeTime: 0,
        // totalSoldAmount: 0
      });

      eventEmitter.emit("orderError", {
        exchange,
        symbol,
        message: "Reached Token Max Sell Amount",
      });

      return;
    }

    console.log(
      `Executing trade: ${amount} @ $${bestOrder.price} (${percentage.toFixed(
        2
      )}% of ${bestOrder.amount})`
    );

    // Update last trade time
    await TradeSetting.findByIdAndUpdate(tradeSetting._id, {
      lastTradeTime: Date.now(),
    });

    // Place the order immediately
    await placeSellOrder(
      accessKey,
      secretKey,
      symbol,
      exchange,
      bestOrder.price,
      amount,
      precision,
      percentage,
      tradeSetting._id
    );
  } catch (error) {
    console.error("Error checking trading opportunities:", error);
  }
};

const placeSellOrder = async (
  accessKey: string,
  secretKey: string,
  symbol: string,
  exchange: string,
  price: number,
  amount: number,
  precision: number,
  percentage: number,
  tradeSettingId: ObjectId
) => {
  const timestamp = Date.now();

  const params = {
    symbol: symbol,
    side: "SELL",
    type: "LIMIT",
    quantity: amount.toString(),
    price: price.toFixed(precision),
    timestamp,
  };

  try {
    const response = await createOrder(accessKey, secretKey, params);

    console.log("order response", response);

    if (!response.success) {
      await TradeSetting.findByIdAndUpdate(tradeSettingId, {
        isActive: false,
        lastTradeTime: 0,
        // totalSoldAmount: 0
      });

      eventEmitter.emit("orderError", {
        exchange,
        symbol,
        message: response.error,
      });

      return;
    }

    await TradeSetting.findByIdAndUpdate(tradeSettingId, {
      $inc: { totalSoldAmount: Number(response.data.origQty) },
      $push: {
        trades: {
          orderId: response.data.orderId,
          exchange,
          symbol,
          price: Number(response.data.price),
          amount: Number(response.data.origQty),
          side: "sell",
          timestamp: response.data.transactTime,
          percentage,
          total: Number(response.data.price) * Number(response.data.origQty),
        },
      },
    });

    eventEmitter.emit("orderExecuted", {
      exchange,
      symbol,
      price: Number(response.data.price),
      amount: Number(response.data.origQty),
      total: Number(response.data.price) * Number(response.data.origQty),
    });

    setTimeout(() => {
      checkOrder(accessKey, secretKey, {
        orderId: response.data.orderId,
        symbol,
        timestamp: Date.now(),
      });
    }, 3000);
  } catch (error) {
    console.error("Error placing sell order:", error);
  }
};
