import { Request, Response } from "express";

import { Exchange } from "../../models/Exchange";
import { TradeSetting } from "../../models/TradeSetting";
import { badRequest, created, notFound, okay } from "../../utils/httpResponses";
import { getExchangeInfo } from "../../services/mexc/rest";

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

    const { tokenPrecision, basePrecision } = await getExchangeInfo(
      symbol.replace("_", "")
    );

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
