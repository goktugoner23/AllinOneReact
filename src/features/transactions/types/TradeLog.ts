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
  // Bot/SMC discrimination fields. Mode is the live/paper switch the
  // strategy validation card relies on.
  opened_by?: 'USER' | 'BOT';
  strategy_id?: number | null;
  signal_source?: string | null;
  client_order_id?: string | null;
  mode?: 'live' | 'paper';
  stop_loss?: number | null;
  take_profit?: number | null;
}
