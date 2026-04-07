export interface TradeLogEntry {
  id: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  market_type: 'USD-M' | 'COIN-M';
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  leverage: number;
  pnl: number | null;
  commission: number;
  status: 'OPEN' | 'CLOSED';
  open_time: string;
  close_time: string | null;
  notes: string | null;
  created_at: string;
}
