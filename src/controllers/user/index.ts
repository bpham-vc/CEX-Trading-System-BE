import express from "express";

import { index, create, addApiKey, removeApiKey } from "./user.controller";

const router = express.Router();

router.get("/user", index);
router.post("/user", create);
router.post("/user/addApiKey", addApiKey);
router.delete("/user/removeApiKey/:id", removeApiKey);

export default router;
