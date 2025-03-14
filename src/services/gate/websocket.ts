import WebSocket from "ws";
import { EventEmitter } from "events";
import difference from "lodash.difference";

import { NEW_SYMBOL_POOLING_INTERVAL, getSymbolsByExchange } from "../utils";

const WS_ENDPOINT = "wss://api.gateio.ws/ws/v4/";

export class GateService {
  private ws: WebSocket | null = null;
  private subscribedSymbols: string[] = [];
  private eventEmitter: EventEmitter;
  private marketPrice: number | null = null;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  connect() {
    this.ws = new WebSocket(WS_ENDPOINT);

    this.ws.on("open", () => {
      console.log("✅ GATE WebSocket connected");
      this.pollNewPairs();

      setInterval(() => {
        this.pollNewPairs();
      }, NEW_SYMBOL_POOLING_INTERVAL);
    });

    this.ws.on("message", (data: any) => {
      const message = JSON.parse(data.toString());

      if (message.event === "subscribe" || message.error) return;

      if (message.channel === "spot.order_book") {
        const asks = (message.result.asks || [])
          .map((ask: [string, string]) => [Number(ask[0]), Number(ask[1])])
          .sort((a: [number, number], b: [number, number]) => b[0] - a[0]);

        const bids = (message.result.bids || []).map(
          (bid: [string, string]) => [Number(bid[0]), Number(bid[1])]
        );

        this.eventEmitter.emit("orderbook", {
          marketPrice: this.marketPrice,
          symbol: message.result.s,
          exchange: "GATE",
          orderbook: { asks, bids },
        });
      } else if (message.channel === "spot.tickers") {
        this.marketPrice = Number(message.result.last);

        this.eventEmitter.emit("ticker", {
          symbol: message.result.currency_pair,
          exchange: "GATE",
          ticker: {
            price: Number(message.result.last),
            high: Number(message.result.high_24h),
            low: Number(message.result.low_24h),
            volume: Number(message.result.base_volume),
          },
        });
      } else if (message.channel === "spot.trades") {
        this.eventEmitter.emit("trade", {
          symbol: message.result.currency_pair,
          exchange: "GATE",
          trade: {
            price: Number(message.result.price),
            amount: Number(message.result.amount),
            side: message.result.side,
            timestamp: message.result.create_time,
          },
        });
      }
    });

    this.ws.on("close", () => {
      console.log("❌ GATE WebSocket disconnected, reconnecting...");
      setTimeout(() => this.connect(), 5000);
    });
  }

  private async pollNewPairs() {
    const symbols = await getSymbolsByExchange("GATE");
    const newSymbols = difference(symbols, this.subscribedSymbols);

    this.subscribedSymbols.push(...newSymbols);
    this.subscribeToStreams(newSymbols);
  }

  private subscribeToStreams(symbols: string[]) {
    if (!this.ws || !symbols.length) return;

    const tradeSubscriptions = {
      channel: "spot.trades",
      event: "subscribe",
      payload: symbols,
    };

    const tickerSubscriptions = {
      channel: "spot.tickers",
      event: "subscribe",
      payload: symbols,
    };

    const orderSubscriptions = symbols.map((symbol) => ({
      channel: "spot.order_book",
      event: "subscribe",
      payload: [symbol, "10", "100ms"],
    }));

    orderSubscriptions.forEach((subscription) => {
      this.ws?.send(JSON.stringify(subscription));
    });

    this.ws.send(JSON.stringify(tickerSubscriptions));
    this.ws.send(JSON.stringify(tradeSubscriptions));
  }
}
