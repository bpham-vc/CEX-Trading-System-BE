import { ObjectId } from "mongoose";

import { eventEmitter } from "./websocketManager";
import { Exchange } from "../models/Exchange";
import { ITradeSetting, TradeSetting } from "../models/TradeSetting";
import { Orderbook } from "../interface/Orderbook";
import { ExchangeType } from "../interface/Exchange";
import { User } from "../models/User";
import { checkOrderMap, createOrderMap } from "./utils";

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
  exchange: ExchangeType,
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
      console.log(
        `${exchange} - No valid orders found, checking again in 1s...`
      );
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
      `${exchange} - Executing trade: ${amount} @ $${
        bestOrder.price
      } (${percentage.toFixed(2)}% of ${bestOrder.amount})`
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
    console.error(`${exchange} - Error checking trading opportunities:`, error);
  }
};

const placeSellOrder = async (
  accessKey: string,
  secretKey: string,
  symbol: string,
  exchange: ExchangeType,
  price: number,
  amount: number,
  precision: number,
  percentage: number,
  tradeSettingId: ObjectId
) => {
  let params: any = {};

  switch (exchange) {
    case "MEXC":
      params = {
        symbol,
        side: "SELL",
        type: "LIMIT",
        quantity: amount.toString(),
        price: price.toFixed(precision),
        timestamp: Date.now(),
      };
      break;

    case "GATE":
    case "BITMART":
      params = {
        symbol,
        side: "sell",
        type: "limit",
        quantity: amount.toString(),
        price: price.toFixed(precision),
      };
      break;

    default:
      break;
  }

  try {
    const response = await createOrderMap[exchange](
      accessKey,
      secretKey,
      params
    );

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

    let trade: any = {};

    switch (exchange) {
      case "MEXC":
        trade = {
          orderId: response.data.orderId,
          exchange,
          symbol,
          price: Number(response.data.price),
          amount: Number(response.data.origQty),
          side: "sell",
          timestamp: response.data.transactTime,
          percentage,
          total: Number(response.data.price) * Number(response.data.origQty),
        };
        break;

      case "GATE":
        trade = {
          orderId: response.data.id,
          exchange,
          symbol,
          price: Number(response.data.price),
          amount: Number(response.data.amount),
          side: "sell",
          timestamp: response.data.create_time_ms,
          percentage,
          total: Number(response.data.price) * Number(response.data.amount),
        };
        break;

      case "BITMART":
        trade = {
          orderId: response.data.order_id,
          exchange,
          symbol,
          price,
          amount,
          side: "sell",
          timestamp: Date.now(),
          percentage,
          total: price * amount,
        };
        break;

      default:
        break;
    }

    await TradeSetting.findByIdAndUpdate(tradeSettingId, {
      $inc: { totalSoldAmount: trade.amount },
      $push: { trades: trade },
    });

    eventEmitter.emit("orderExecuted", {
      exchange,
      symbol,
      price: trade.price,
      amount: trade.amount,
      total: trade.total,
    });

    setTimeout(() => {
      checkOrderMap[exchange](accessKey, secretKey, {
        orderId: trade.orderId,
        symbol,
        timestamp: Date.now(),
      });
    }, 3000);
  } catch (error) {
    console.error(`${exchange} - Error placing sell order:`, error);
  }
};
