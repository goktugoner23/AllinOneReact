// Mirror of huginn-webapp/src/modules/v1.0/investments/types/index.ts
// trader-related interfaces. Kept in lockstep with the backend
// /api/trader contract so the mobile TraderTab can hit the same routes
// the webapp's trader-panel uses.

export interface BotConfig {
  id: number;
  enabled: boolean;
  allowed_symbols: string[];
  max_positions: number;
  max_notional_per_position: number;
  cooldown_seconds: number;
  llm_model: string;
  sentiment_model: string;
  dry_run: boolean;
  smc_enabled: boolean;
  updated_at: string;
}

export interface BotConfigPatch {
  enabled?: boolean;
  allowed_symbols?: string[];
  max_positions?: number;
  max_notional_per_position?: number;
  cooldown_seconds?: number;
  llm_model?: string;
  sentiment_model?: string;
  dry_run?: boolean;
  smc_enabled?: boolean;
}

export interface BotStatus {
  enabled: boolean;
  dryRun: boolean;
  smcEnabled: boolean;
  allowedSymbols: string[];
  maxPositions: number;
  openPositions: number;
  pnlTodayUsdt: number;
  winRate7d: number | null;
  lastSignalAt: string | null;
}

export interface TraderModeStats {
  mode: 'live' | 'paper';
  openCount: number;
  closedCount: number;
  wins: number;
  losses: number;
  winRate: number | null;
  pnlTotal: number;
  pnlToday: number;
  pnl7d: number;
  avgPnl: number | null;
  bestTrade: number | null;
  worstTrade: number | null;
}

export interface TwitterAccount {
  id: number;
  handle: string;
  display_name: string | null;
  enabled: boolean;
  added_at: string;
  last_scraped_at: string | null;
}

export interface TweetEntry {
  id: number;
  handle: string;
  text: string;
  posted_at: string;
  url: string | null;
  sentiment: number | null;
  impact_score: number | null;
  relevant_symbols: string[] | null;
  analyzed: boolean;
}

export interface NewsEntry {
  id: number;
  source: string;
  title: string;
  url: string;
  body: string | null;
  published_at: string;
  sentiment: number | null;
  impact_score: number | null;
  is_actionable: boolean | null;
  relevant_symbols: string[] | null;
  timing_assessment: string | null;
  analyzed: boolean;
}

export interface TradeSignal {
  id: number;
  symbol: string;
  source: 'TWEET' | 'NEWS' | 'INDICATOR' | 'VOLUME';
  source_id: number | null;
  direction: 'LONG' | 'SHORT' | 'NEUTRAL';
  strength: number;
  rationale: string | null;
  created_at: string;
  acted_on: boolean;
}
