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
  // Additional fields for enhanced calculations
  liquidationPrice?: number;
  notional?: number;
  bidNotional?: number;
  askNotional?: number;
  updateTime?: number;
  // Calculated fields
  marginRatio?: number;
  roi?: number;
  roe?: number;
  distanceToLiquidation?: number;
  marginBalance?: number;
  maintMargin?: number;
  initialMargin?: number;
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

// New interfaces for TP/SL orders
export interface TakeProfitStopLossData {
  symbol: string;
  side: 'BUY' | 'SELL';
  takeProfitPrice: number;
  stopLossPrice: number;
  quantity: number;
}

export interface PositionCalculations {
  liquidationPrice: number;
  marginRatio: number;
  roi: number;
  roe: number;
  distanceToLiquidation: number;
  notionalValue: number;
  initialMargin: number;
  maintMargin: number;
}
