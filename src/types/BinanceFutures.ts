export interface BinanceFutures {
  id?: string;
  symbol: string;
  positionAmt: number;
  entryPrice: number;
  markPrice: number;
  unRealizedProfit: number;
  liquidationPrice: number;
  leverage: number;
  marginType: string;
  isolatedMargin: number;
  isAutoAddMargin: boolean;
  positionSide: string;
  updateTime?: string;
  futuresType: 'USD-M' | 'COIN-M';
}

export interface BinanceBalance {
  id?: string;
  asset: string;
  balance: number;
  crossWalletBalance: number;
  crossUnPnl: number;
  availableBalance: number;
  maxWithdrawAmount: number;
  marginAvailable: boolean;
  updateTime?: string;
  futuresType: 'USD-M' | 'COIN-M';
}
