import express from "express";

import {
  addTradeSetting,
  getProjectSettings,
  removeTradeSetting,
  updateTradeSetting,
} from "./tradeSetting.controller";

const router = express.Router();

router.put("/tradeSetting/:id", updateTradeSetting);
router.delete("/tradeSetting/:id", removeTradeSetting);
router.post("/tradeSetting/project/:projectId", addTradeSetting);
router.get("/tradeSetting/project/:projectId", getProjectSettings);

export default router;
