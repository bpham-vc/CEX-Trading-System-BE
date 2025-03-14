import Bitmart from "@bitmartexchange/bitmart-node-sdk-api";

export const getBalance = async (
  accessKey: string,
  secretKey: string,
  currency: string
) => {
  const api = new Bitmart.BitmartSpotAPI({
    apiKey: accessKey,
    apiSecret: secretKey,
  });

  const { data: response } = await api.getSpotWallet();

  const balances = response.data.wallet;

  const tokenBalance = balances.find((b: any) => b.id === currency);
  const baseBalance = balances.find((b: any) => b.id === "USDT");

  return {
    token: {
      asset: currency,
      free: tokenBalance ? tokenBalance.available : "0",
      locked: tokenBalance ? tokenBalance.frozen : "0",
    },
    base: {
      asset: "USDT",
      free: baseBalance ? baseBalance.available : "0",
      locked: baseBalance ? baseBalance.frozen : "0",
    },
  };
};

export const getExchangeInfo = async (symbol: string) => {
  const api = new Bitmart.BitmartSpotAPI();

  const { data: response } = await api.getSymbolsDetails();

  const symbolInfo = response.data.symbols.find(
    (s: any) => s.symbol === symbol
  );

  if (symbolInfo) {
    return {
      tokenPrecision: symbolInfo.price_min_precision,
      basePrecision: symbolInfo.price_max_precision,
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
  }
) => {
  const api = new Bitmart.BitmartSpotAPI({
    apiKey: accessKey,
    apiSecret: secretKey,
    apiMemo: "API Trading", //TODO: Need to fix this
  });

  try {
    const { data: response } = await api.newSpotOrder(
      params.symbol,
      params.side,
      params.type,
      {
        size: params.quantity,
        price: params.price,
      }
    );

    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, error: error.response.data.message };
  }
};

export const checkOrder = async (
  accessKey: string,
  secretKey: string,
  params: {
    orderId: string;
    symbol: string;
  }
) => {
  const api = new Bitmart.BitmartSpotAPI({
    apiKey: accessKey,
    apiSecret: secretKey,
    apiMemo: "API Trading", //TODO: Need to fix this
  });

  try {
    const { data: response } = await api.queryOrderById(params.orderId, {
      queryState: "open",
    });

    console.log("BITMART - Check Order Response", response.data);

    const isNotExecuted = !!response.data;

    if (!isNotExecuted) return;

    const { response: cancelOrderResponse } = await api.cancelOrder(
      params.symbol,
      { order_id: params.orderId }
    );

    console.log("BITMART - Cancel Order Response", cancelOrderResponse.data);

    return cancelOrderResponse.data;
  } catch (error: any) {
    console.log("BITMART - Check Order Error", error.response.data.message);
    return null;
  }
};
