import WebSocket from "ws";
import { EventEmitter } from "events";
import dotenv from "dotenv";

dotenv.config();

import { MexcService } from "./mexc/websocket";
import { GateService } from "./gate/websocket";
import { BitmartService } from "./bitmart/websocket";

export const eventEmitter = new EventEmitter();

import "./orderExecution";

const wss = new WebSocket.Server({ port: Number(process.env.WS_PORT) });

const exchangeServices = [
  // new MexcService(eventEmitter),
  // new GateService(eventEmitter),
  new BitmartService(eventEmitter),
];

exchangeServices.forEach((service) => service.connect());

wss.on("connection", (ws) => {
  console.log("📡 User connected to WebSocket");

  ws.on("message", (message) => {
    const { type } = JSON.parse(message.toString());

    if (type === "subscribe") {
      console.log("🔔 User subscribed");

      // Listen for real-time data for the symbol
      eventEmitter.on("orderbook", (data) => {
        ws.send(JSON.stringify({ type: "orderbook", data }));
      });

      eventEmitter.on("ticker", (data) => {
        ws.send(JSON.stringify({ type: "ticker", data }));
      });

      eventEmitter.on("trade", (data) => {
        ws.send(JSON.stringify({ type: "trade", data }));
      });

      eventEmitter.on("orderError", (data) => {
        ws.send(JSON.stringify({ type: "orderError", data }));
      });

      eventEmitter.on("orderExecuted", (data) => {
        ws.send(JSON.stringify({ type: "orderExecuted", data }));
      });
    }
  });

  ws.on("close", () => {
    console.log("❌ User disconnected");
  });
});

console.log(
  `✅ WebSocket server running on ws://localhost:${process.env.WS_PORT}`
);
