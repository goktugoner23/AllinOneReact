export interface AccountData {
  totalWalletBalance: number;
  totalUnrealizedProfit: number;
  totalMarginBalance: number;
  totalPositionInitialMargin: number;
  totalOpenOrderInitialMargin: number;
  maxWithdrawAmount: number;
  assets: AssetData[];
}

export interface AssetData {
  asset: string;
  walletBalance: number;
  unrealizedProfit: number;
  marginBalance: number;
  maintMargin: number;
  initialMargin: number;
  positionInitialMargin: number;
  openOrderInitialMargin: number;
  maxWithdrawAmount: number;
}

export interface PositionData {
  symbol: string;
  positionAmount: number;
  entryPrice: number;
  markPrice: number;
  unrealizedProfit: number;
  percentage: number;
  positionSide: string;
  leverage: number;
  maxNotionalValue: number;
  marginType: string;
  isolatedMargin: number;
  isAutoAddMargin: boolean;
}

export interface OrderData {
  orderId: string;
  symbol: string;
  status: string;
  clientOrderId: string;
  price: number;
  avgPrice: number;
  origQty: number;
  executedQty: number;
  cumQuote: number;
  timeInForce: string;
  type: string;
  reduceOnly: boolean;
}
