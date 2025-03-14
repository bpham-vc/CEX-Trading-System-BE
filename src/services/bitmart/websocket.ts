import WebSocket from "ws";
import { EventEmitter } from "events";
import difference from "lodash.difference";

import { NEW_SYMBOL_POOLING_INTERVAL, getSymbolsByExchange } from "../utils";

const WS_ENDPOINT = "wss://ws-manager-compress.bitmart.com/api?protocol=1.1";

export class BitmartService {
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
      console.log("✅ BITMART WebSocket connected");
      this.pollNewPairs();

      setInterval(() => {
        this.pollNewPairs();
      }, NEW_SYMBOL_POOLING_INTERVAL);
    });

    this.ws.on("message", (data: any) => {
      const message = JSON.parse(data.toString());

      if (message.table === "spot/depth20") {
        const asks = (message.data[0].asks || [])
          .map((ask: [string, string]) => [Number(ask[0]), Number(ask[1])])
          .sort((a: [number, number], b: [number, number]) => b[0] - a[0]);

        const bids = (message.data[0].bids || []).map(
          (bid: [string, string]) => [Number(bid[0]), Number(bid[1])]
        );

        this.eventEmitter.emit("orderbook", {
          marketPrice: this.marketPrice,
          symbol: message.data[0].symbol,
          exchange: "BITMART",
          orderbook: { asks, bids },
        });
      } else if (message.table === "spot/ticker") {
        this.marketPrice = Number(message.data[0].last_price);

        this.eventEmitter.emit("ticker", {
          symbol: message.data[0].symbol,
          exchange: "BITMART",
          ticker: {
            price: Number(message.data[0].last_price),
            high: Number(message.data[0].high_24h),
            low: Number(message.data[0].low_24h),
            volume: Number(message.data[0].quote_volume_24h),
          },
        });
      } else if (message.table === "spot/trade") {
        this.eventEmitter.emit("trade", {
          symbol: message.data[0].symbol,
          exchange: "BITMART",
          trade: {
            price: Number(message.data[0].price),
            amount: Number(message.data[0].size),
            side: message.data[0].side,
            timestamp: message.data[0].s_t,
          },
        });
      }
    });

    this.ws.on("close", () => {
      console.log("❌ BITMART WebSocket disconnected, reconnecting...");
      setTimeout(() => this.connect(), 5000);
    });
  }

  private async pollNewPairs() {
    const symbols = await getSymbolsByExchange("BITMART");
    const newSymbols = difference(symbols, this.subscribedSymbols);

    this.subscribedSymbols.push(...newSymbols);
    this.subscribeToStreams(newSymbols);
  }

  private subscribeToStreams(symbols: string[]) {
    if (!this.ws || !symbols.length) return;

    const args = symbols.reduce<string[]>(
      (acc, symbol) => [
        ...acc,
        `spot/trade:${symbol}`,
        `spot/depth20:${symbol}`,
        `spot/ticker:${symbol}`,
      ],
      []
    );

    const subscription = {
      op: "subscribe",
      args,
    };

    this.ws.send(JSON.stringify(subscription));
  }
}
