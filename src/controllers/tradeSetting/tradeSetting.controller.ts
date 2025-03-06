import { Request, Response } from "express";

import { TradeSetting } from "../../models/TradeSetting";
import { badRequest, okay } from "../../utils/httpResponses";

export const getProjectSettings = async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const tradeSettings = await TradeSetting.find({ projectId });

  okay(res, tradeSettings);
};

export const addTradeSetting = async (req: Request, res: Response) => {
  const { projectId } = req.params;

  try {
    const tradeSetting = new TradeSetting({ projectId });

    await tradeSetting.save();

    okay(res, tradeSetting);
  } catch (error) {
    badRequest(res, error);
  }
};

export const updateTradeSetting = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const tradeSetting = await TradeSetting.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    okay(res, tradeSetting);
  } catch (error) {
    badRequest(res, error);
  }
};

export const removeTradeSetting = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const tradeSetting = await TradeSetting.findByIdAndDelete(id);

    okay(res, tradeSetting);
  } catch (error) {
    badRequest(res, error);
  }
};
