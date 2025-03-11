import { Request, Response } from "express";

import { User } from "../../models/User";
import { generateToken } from "./utils";
import {
  badRequest,
  created,
  okay,
  serverError,
  unAuthorized,
} from "../../utils/httpResponses";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const isExist = await User.findOne({ email });

    if (isExist) return badRequest(res, { message: "User already exists" });

    const user = await User.create({ name, email, password });

    if (user) {
      return created(res, user);
    }

    badRequest(res, { message: "Invalid user data" });
  } catch (error) {
    serverError(res, { message: "Server error", error });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return unAuthorized(res, { message: "User not found" });
    }

    const isPasswordMatch = await (user as any).matchPassword(password);

    if (!isPasswordMatch) {
      return unAuthorized(res, { message: "Invalid password" });
    }

    okay(res, { ...user.toJSON(), token: generateToken(user._id.toString()) });
  } catch (error) {
    serverError(res, { message: "Server error", error });
  }
};
