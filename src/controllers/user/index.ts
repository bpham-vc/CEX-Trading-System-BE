import express from "express";

import { index, create, addApiKey } from "./user.controller";

const router = express.Router();

router.get("/user", index);
router.post("/user", create);
router.post("/user/addApiKey", addApiKey);

export default router;
