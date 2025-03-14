import WebSocket from "ws";
import { EventEmitter } from "events";
import { getSymbolsByExchange } from "../utils";

const WS_ENDPOINT = "wss://wbs.mexc.com/ws";

export class MexcService {
  private ws: WebSocket | null = null;
  private eventEmitter: EventEmitter;
  private marketPrice: number | null = null;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  connect() {
    this.ws = new WebSocket(WS_ENDPOINT);

    this.ws.on("open", () => {
      console.log("✅ MEXC WebSocket connected");
      this.pollNewPairs();
    });

    this.ws.on("message", (data: any) => {
      const message = JSON.parse(data.toString());

      const symbol = `${message.s?.split("USDT")[0]}_USDT`;

      if (message.c?.includes("limit.depth.v3")) {
        const asks = (message.d.asks || [])
          .map((ask: any) => [Number(ask.p), Number(ask.v)])
          .sort((a: [number, number], b: [number, number]) => b[0] - a[0]);

        const bids = (message.d.bids || []).map((bid: any) => [
          Number(bid.p),
          Number(bid.v),
        ]);

        this.eventEmitter.emit("orderbook", {
          marketPrice: this.marketPrice,
          symbol,
          exchange: "MEXC",
          orderbook: { asks, bids },
        });
      } else if (message.c?.includes("miniTicker.v3")) {
        if (!message.d) return;

        this.marketPrice = Number(message.d.p);

        this.eventEmitter.emit("ticker", {
          symbol,
          exchange: "MEXC",
          ticker: {
            price: Number(message.d.p),
            high: Number(message.d.h),
            low: Number(message.d.l),
            volume: Number(message.d.v),
          },
        });
      } else if (message.c?.includes("deals.v3")) {
        this.eventEmitter.emit("trade", {
          symbol,
          exchange: "MEXC",
          trade: {
            price: Number(message.d.deals[0].p),
            amount: Number(message.d.deals[0].v),
            side: message.d.deals[0].S === 1 ? "buy" : "sell",
            timestamp: message.d.deals[0].t,
          },
        });
      }
    });

    this.ws.on("close", () => {
      console.log("❌ MEXC WebSocket disconnected, reconnecting...");
      setTimeout(() => this.connect(), 5000);
    });
  }

  private async pollNewPairs() {
    const symbols = await getSymbolsByExchange("MEXC");

    this.subscribeToStreams(symbols);
  }

  private subscribeToStreams(symbols: string[]) {
    if (!this.ws) return;

    const params = symbols.reduce<string[]>((acc, symbol) => {
      acc.push(
        `spot@public.deals.v3.api@${symbol.replace("_", "")}`,
        `spot@public.limit.depth.v3.api@${symbol.replace("_", "")}@10`,
        `spot@public.miniTicker.v3.api@${symbol.replace("_", "")}@UTC+8`
      );

      return acc;
    }, []);

    const subscription = {
      method: "SUBSCRIPTION",
      params,
    };

    this.ws.send(JSON.stringify(subscription));
  }
}
