import axios from "axios";

import { generateSignature } from "../utils";

const MEXC_BASE_URL = "https://api.mexc.com";

export const getExchangeInfo = async (symbol: string) => {
  const response = await axios.get(
    `${MEXC_BASE_URL}/api/v3/exchangeInfo?symbol=${symbol}`
  );

  if (response.data.symbols.length) {
    return {
      tokenPrecision: response.data.symbols[0].baseAssetPrecision,
      basePrecision: response.data.symbols[0].quoteAssetPrecision,
    };
  }

  return { tokenPrecision: 0, basePrecision: 0 };
};

export const createOrder = async (
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
) => {
  const formattedParams = { ...params, symbol: params.symbol.replace("_", "") };

  const queryString = Object.keys(formattedParams)
    .sort()
    .map(
      (key) =>
        `${key}=${encodeURIComponent(
          formattedParams[key as keyof typeof formattedParams]
        )}`
    )
    .join("&");

  const signature = generateSignature(queryString, secretKey);

  try {
    const response = await axios.post(
      `${MEXC_BASE_URL}/api/v3/order?${queryString}&signature=${signature}`,
      null,
      {
        headers: {
          "X-MEXC-APIKEY": accessKey,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.log("MEXC - Create Order Error", error?.message);
    return null;
  }
};

export const checkOrder = async (
  accessKey: string,
  secretKey: string,
  params: {
    orderId: string;
    symbol: string;
    timestamp: number;
  }
) => {
  const formattedParams = { ...params, symbol: params.symbol.replace("_", "") };

  const queryString = Object.keys(formattedParams)
    .sort()
    .map(
      (key) =>
        `${key}=${encodeURIComponent(
          formattedParams[key as keyof typeof formattedParams]
        )}`
    )
    .join("&");

  const signature = generateSignature(queryString, secretKey);

  try {
    const response = await axios.get(
      `${MEXC_BASE_URL}/api/v3/order?${queryString}&signature=${signature}`,
      { headers: { "X-MEXC-APIKEY": accessKey } }
    );

    console.log("check order response", response.data);

    const isNotExecuted = response.data.status === "NEW";

    if (!isNotExecuted) return;

    const cancelOrderResponse = await axios.delete(
      `${MEXC_BASE_URL}/api/v3/order?${queryString}&signature=${signature}`,
      { headers: { "X-MEXC-APIKEY": accessKey } }
    );

    console.log("cancel order response", cancelOrderResponse.data);

    return cancelOrderResponse.data;
  } catch (error: any) {
    console.log("MEXC - Check Order Error", error?.message);
    return null;
  }
};
