import express from "express";

import {
  getProjectSettings,
  removeTradeSetting,
  updateTradeSetting,
} from "./tradeSetting.controller";

const router = express.Router();

router.put("/tradeSetting/:id", updateTradeSetting);
router.delete("/tradeSetting/:id", removeTradeSetting);
router.get("/tradeSetting/project/:projectId", getProjectSettings);

export default router;
