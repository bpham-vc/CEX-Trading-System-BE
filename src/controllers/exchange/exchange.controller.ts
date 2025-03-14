import { Request, Response } from "express";

import { User } from "../../models/User";
import { Exchange } from "../../models/Exchange";
import { TradeSetting } from "../../models/TradeSetting";
import { badRequest, created, notFound, okay } from "../../utils/httpResponses";
import { getExchangeInfoMap } from "../../services/utils";
import { getProjectBalanceMap } from "../../services/utils";

export const getAllExchanges = async (req: Request, res: Response) => {
  const user = req.user!;

  const exchanges = await Exchange.find({ userId: user._id });

  okay(res, exchanges);
};

export const createExchange = async (req: Request, res: Response) => {
  const user = req.user!;
  const { type } = req.body;

  try {
    const newExchange = new Exchange({ userId: user._id, type });

    await newExchange.save();

    created(res, newExchange);
  } catch (error) {
    badRequest(res, error);
  }
};

export const getExchangeById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const exchange = await Exchange.findById(id);

  okay(res, exchange);
};

export const getProjectById = async (req: Request, res: Response) => {
  const { exchangeId, projectId } = req.params;

  const exchange = await Exchange.findById(exchangeId);

  if (!exchange) {
    return notFound(res, { message: "Exchange not found" });
  }

  const project = exchange.projects.find((p) => p.id === projectId);

  if (!project) {
    return notFound(res, { message: "Project not found" });
  }

  okay(res, project);
};

export const getProjectBalance = async (req: Request, res: Response) => {
  const { exchangeId, projectId } = req.params;

  const exchange = await Exchange.findById(exchangeId);

  if (!exchange) {
    return notFound(res, { message: "Exchange not found" });
  }

  const project = exchange.projects.find((p) => p.id === projectId);

  if (!project) {
    return notFound(res, { message: "Project not found" });
  }

  const user = await User.findOne({ _id: exchange.userId });

  if (!user) {
    return notFound(res, { message: "User not found" });
  }

  const apiKeys = user.apiKeys.filter(
    (key) => key.exchangeId?.toString() === exchangeId
  );

  if (!apiKeys.length) {
    return notFound(res, { message: "API Key not found" });
  }

  const { accessKey, secretKey } = apiKeys[apiKeys.length - 1];

  try {
    const balance = await getProjectBalanceMap[exchange.type](
      accessKey,
      secretKey,
      project.name
    );

    okay(res, balance);
  } catch (error: any) {
    badRequest(res, error.response.data.msg);
  }
};

export const addProjectToExchange = async (req: Request, res: Response) => {
  const { id: exchangeId } = req.params;
  const { name, symbol } = req.body;

  try {
    const exchange = await Exchange.findById(exchangeId);

    if (!exchange) {
      return notFound(res, { message: "Exchange not found" });
    }

    const isSymbolExist = exchange.projects.some((p) => p.symbol === symbol);

    if (isSymbolExist) {
      return badRequest(res, { message: `${symbol} symbol exist already` });
    }

    const { tokenPrecision, basePrecision } = await getExchangeInfoMap[
      exchange.type
    ](exchange.type === "MEXC" ? symbol.replace("_", "") : symbol);

    exchange.projects.push({ name, symbol, tokenPrecision, basePrecision });

    await exchange.save();

    const projectId = exchange.projects[exchange.projects.length - 1];

    const tradeSetting = new TradeSetting({ projectId });

    await tradeSetting.save();

    okay(res, exchange);
  } catch (error) {
    badRequest(res, error);
  }
};
