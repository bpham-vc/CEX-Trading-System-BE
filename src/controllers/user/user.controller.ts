import { Request, Response } from "express";

import { User } from "../../models/User";
import { badRequest, okay } from "../../utils/httpResponses";
import { Exchange } from "../../models/Exchange";

export const getApiKey = async (req: Request, res: Response) => {
  const user = req.user!;
  const { exchangeId } = req.params;

  const exchange = await Exchange.findById(exchangeId);

  const apiKeys = user.apiKeys.filter(
    (key) => key.exchangeId.toString() === exchange?._id.toString()
  );

  okay(res, apiKeys);
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

export const removeApiKey = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      return badRequest(res, { message: "User not found" });
    }

    user.apiKeys.pull({ _id: id });

    await user.save();

    okay(res, { message: "Successfully removed" });
  } catch (error) {
    badRequest(res, error);
  }
};
