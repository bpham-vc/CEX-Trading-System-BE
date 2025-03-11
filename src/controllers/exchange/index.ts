import express from "express";

import {
  getAllExchanges,
  createExchange,
  getExchangeById,
  addProjectToExchange,
  getProjectById,
  getProjectBalance,
} from "./exchange.controller";

const router = express.Router();

router.get("/exchange", getAllExchanges);
router.post("/exchange", createExchange);
router.get("/exchange/:id", getExchangeById);
router.post("/exchange/:id/project", addProjectToExchange);
router.get("/exchange/:exchangeId/project/:projectId", getProjectById);
router.get("/exchange/:exchangeId/project/:projectId/balance", getProjectBalance);

export default router;
