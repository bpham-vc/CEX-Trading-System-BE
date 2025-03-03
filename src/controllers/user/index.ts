import express from "express";

import { index, create } from "./user.controller";

const router = express.Router();

router.get("/user", index);
router.post("/user", create);

export default router;
