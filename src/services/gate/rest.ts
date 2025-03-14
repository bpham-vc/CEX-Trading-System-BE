import { ApiClient, SpotApi, Order } from "gate-api";

const client = new ApiClient();

export const getBalance = async (
  accessKey: string,
  secretKey: string,
  currency: string
) => {
  client.setApiKeySecret(accessKey, secretKey);

  const api = new SpotApi(client);

  const {
    response: { data: balances },
  } = await api.listSpotAccounts({});

  const tokenBalance = balances.find((b: any) => b.currency === currency);
  const baseBalance = balances.find((b: any) => b.currency === "USDT");

  return {
    token: {
      asset: currency,
      free: tokenBalance ? tokenBalance.available : "0",
      locked: tokenBalance ? tokenBalance.locked : "0",
    },
    base: {
      asset: "USDT",
      free: baseBalance ? baseBalance.available : "0",
      locked: baseBalance ? baseBalance.locked : "0",
    },
  };
};

export const getExchangeInfo = async (symbol: string) => {
  const api = new SpotApi(client);

  const { response } = await api.getCurrencyPair(symbol);

  if (response.data) {
    return {
      tokenPrecision: response.data.amount_precision,
      basePrecision: response.data.precision,
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
  client.setApiKeySecret(accessKey, secretKey);

  const api = new SpotApi(client);
  const order = new Order();

  order.currencyPair = params.symbol;
  order.side = params.side as any;
  order.type = params.type as any;
  order.amount = params.quantity;
  order.price = params.price;

  try {
    const { response } = await api.createOrder(order, {});

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
  client.setApiKeySecret(accessKey, secretKey);

  const api = new SpotApi(client);

  try {
    const { response } = await api.listOrders(params.symbol, "open", {
      side: "sell",
    });

    console.log("GATE - Check Order Response", response.data);

    const isNotExecuted = response.data.some(
      (order: any) => order.id === params.orderId
    );

    if (!isNotExecuted) return;

    const { response: cancelOrderResponse } = await api.cancelOrder(
      params.orderId,
      params.symbol,
      {}
    );

    console.log("GATE - Cancel Order Response", cancelOrderResponse.data);

    return cancelOrderResponse.data;
  } catch (error: any) {
    console.log("GATE - Check Order Error", error.response.data.message);
    return null;
  }
};
