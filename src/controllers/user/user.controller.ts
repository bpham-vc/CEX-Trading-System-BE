import { Request, Response, Router } from "express";

import { User } from "../../models/User";
import { created, okay } from "../../utils/httpResponses";

const router = Router();

export const index = async (req: Request, res: Response) => {
  const users = await User.find();

  okay(res, users);
};

export const create = async (req: Request, res: Response) => {
  const { name, email } = req.body;

  const newUser = new User({ name, email });
  await newUser.save();

  created(res, newUser);
};

export default router;
