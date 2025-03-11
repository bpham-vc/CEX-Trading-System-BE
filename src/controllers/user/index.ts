import express from "express";

import { getApiKey, addApiKey, removeApiKey } from "./user.controller";

const router = express.Router();

router.get("/user/apiKeys/:exchangeId", getApiKey);
router.post("/user/addApiKey", addApiKey);
router.delete("/user/removeApiKey/:id", removeApiKey);

export default router;
