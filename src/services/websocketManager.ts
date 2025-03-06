import WebSocket from "ws";
import { EventEmitter } from "events";

import { MexcService } from "./mexc/websocket";

export const eventEmitter = new EventEmitter();

import "./orderExecution";

const wss = new WebSocket.Server({ port: 8080 });

const exchangeServices = [new MexcService(eventEmitter)];

exchangeServices.forEach((service) => service.connect());

wss.on("connection", (ws) => {
  console.log("📡 User connected to WebSocket");

  ws.on("message", (message) => {
    const { type } = JSON.parse(message.toString());

    if (type === "subscribe") {
      console.log("🔔 User subscribed");
      // ws.send(
      //   JSON.stringify({
      //     type: "confirmation",
      //     message: `Subscribed to ${symbol}`,
      //   })
      // );

      // Listen for real-time data for the symbol
      eventEmitter.on("ticker", (data) => {
        ws.send(JSON.stringify({ type: "ticker", data }));
      });
    }
  });

  ws.on("close", () => {
    console.log("❌ User disconnected");
  });
});

console.log("✅ WebSocket server running on ws://localhost:8080");
