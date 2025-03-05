import { Request, Response } from "express";

import { User } from "../../models/User";
import { badRequest, created, okay } from "../../utils/httpResponses";

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

export const addApiKey = async (req: Request, res: Response) => {
  const { exchangeId, accessKey, secretKey } = req.body;

  if (!exchangeId || !accessKey || !secretKey) {
    return badRequest(res, { message: "Invalid request params" });
  }

  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      return badRequest(res, { message: "User not found" });
    }

    const isKeyExist = user.apiKeys.some(
      (k) =>
        k.exchangeId?.toString() === exchangeId &&
        k.accessKey === accessKey &&
        k.secretKey === secretKey
    );

    if (isKeyExist) {
      return badRequest(res, { message: "Same key exists already" });
    }

    user.apiKeys.push({ exchangeId, accessKey, secretKey });

    await user.save();

    okay(res, { message: "Successfully added" });
  } catch (error) {
    badRequest(res, error);
  }
};
