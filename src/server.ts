import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRouter from "./controllers/auth";
import userRouter from "./controllers/user";
import exchangeRouter from "./controllers/exchange";
import tradeSettingRouter from "./controllers/tradeSetting";
import { protect } from "./controllers/middleware";

import "./services/websocketManager";

dotenv.config();

const app = express();

const API_VERSION_PREFIX = "/api/v1";

// Middleware
app.use(express.json());
app.use(cors());

app.use(API_VERSION_PREFIX, authRouter);

app.use(API_VERSION_PREFIX, protect);

app.use(API_VERSION_PREFIX, userRouter);
app.use(API_VERSION_PREFIX, exchangeRouter);
app.use(API_VERSION_PREFIX, tradeSettingRouter);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
