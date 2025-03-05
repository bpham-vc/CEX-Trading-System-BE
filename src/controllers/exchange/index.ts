import express from "express";

import {
  getAllExchanges,
  createExchange,
  addProjectToExchange,
  getProjectById,
} from "./exchange.controller";

const router = express.Router();

router.get("/exchange", getAllExchanges);
router.post("/exchange", createExchange);
router.post("/exchange/:id/project", addProjectToExchange);
router.get("/exchange/:exchangeId/project/:projectId", getProjectById);

export default router;
