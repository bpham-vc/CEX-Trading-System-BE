import crypto from "crypto";

import { ExchangeType } from "../interface/Exchange";
import { Exchange } from "../models/Exchange";
import {
  createOrder as createMEXCOrder,
  checkOrder as checkMEXCOrder,
  getBalance as getMEXCBalance,
  getExchangeInfo as getMEXCExchangeInfo,
} from "./mexc/rest";
import {
  createOrder as createGATEOrder,
  checkOrder as checkGATEOrder,
  getBalance as getGATEBalance,
  getExchangeInfo as getGATEExchangeInfo,
} from "./gate/rest";
import {
  createOrder as createBITMARTOrder,
  checkOrder as checkBITMARTOrder,
  getBalance as getBITMARTBalance,
  getExchangeInfo as getBITMARTExchangeInfo,
} from "./bitmart/rest";

export const NEW_SYMBOL_POOLING_INTERVAL = 10000;

export const getProjectBalanceMap: {
  [key in ExchangeType]: (
    accesskey: string,
    secretKey: string,
    currency: string
  ) => Promise<{
    token: {
      asset: string;
      free: string;
      locked: string;
    };
    base: {
      asset: string;
      free: string;
      locked: string;
    };
  }>;
} = {
  MEXC: getMEXCBalance,
  GATE: getGATEBalance,
  BITMART: getBITMARTBalance,
  LBANK: getMEXCBalance,
  XT: getMEXCBalance,
};

export const getExchangeInfoMap: {
  [key in ExchangeType]: (symbol: string) => Promise<{
    tokenPrecision: number;
    basePrecision: number;
  }>;
} = {
  MEXC: getMEXCExchangeInfo,
  GATE: getGATEExchangeInfo,
  BITMART: getBITMARTExchangeInfo,
  LBANK: getMEXCExchangeInfo,
  XT: getMEXCExchangeInfo,
};

export const createOrderMap: {
  [key in ExchangeType]: (
    accessKey: string,
    secretKey: string,
    params: {
      symbol: string;
      side: string;
      type: string;
      quantity: string;
      price: string;
      timestamp: number;
    }
  ) => Promise<any>;
} = {
  MEXC: createMEXCOrder,
  GATE: createGATEOrder,
  BITMART: createBITMARTOrder,
  LBANK: getMEXCExchangeInfo,
  XT: getMEXCExchangeInfo,
};

export const checkOrderMap: {
  [key in ExchangeType]: (
    accessKey: string,
    secretKey: string,
    params: {
      orderId: string;
      symbol: string;
      timestamp: number;
    }
  ) => Promise<any>;
} = {
  MEXC: checkMEXCOrder,
  GATE: checkGATEOrder,
  BITMART: checkBITMARTOrder,
  LBANK: getMEXCExchangeInfo,
  XT: getMEXCExchangeInfo,
};

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
