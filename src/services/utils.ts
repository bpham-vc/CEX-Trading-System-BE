import crypto from "crypto";

import { ExchangeType } from "../interface/Exchange";
import { Exchange } from "../models/Exchange";

export const getSymbolsByExchange = async (type: ExchangeType) => {
  const exchanges = await Exchange.find({ type });

  return exchanges.reduce<string[]>((acc, exchange) => {
    exchange.projects.forEach((project) => {
      if (acc.includes(project.symbol)) return;

      acc.push(project.symbol);
    });

    return acc;
  }, []);
};

export const generateSignature = (queryString: string, secretKey: string) =>
  crypto.createHmac("sha256", secretKey).update(queryString).digest("hex");
