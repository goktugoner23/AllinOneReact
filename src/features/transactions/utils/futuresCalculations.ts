import { PositionData, PositionCalculations } from '@features/transactions/types/BinanceApiModels';

/**
 * Calculate liquidation price for Binance futures positions
 * Based on Binance documentation: https://binance-docs.github.io/apidocs/futures/en/#position-information-v2-user_data
 */
export function calculateLiquidationPrice(
  position: PositionData,
  accountBalance: number = 0,
  allPositions: PositionData[] = [],
): number {
  const { positionAmount, entryPrice, markPrice, leverage, marginType, isolatedMargin } = position;
  if (positionAmount === 0 || leverage <= 0 || entryPrice <= 0) return 0;

  // Absolute quantity and entry
  const Q = Math.abs(positionAmount);
  const E = entryPrice;
  const isLong = positionAmount > 0;

  // Determine margin balance used for the position
  // Cross: use account margin balance; Isolated: use isolated margin assigned
  const marginBalance =
    marginType?.toLowerCase?.() === 'isolated' ? Math.max(0, isolatedMargin || 0) : Math.max(0, accountBalance || 0);

  // Maintenance margin rate (MMR) approximation.
  // NOTE: True MMR is tiered per symbol notional. If tier is unavailable,
  // use a conservative default. Using markPrice-based notional for MM basis.
  const MMR = 0.004; // 0.4%
  // Total maintenance margin across all positions (approx)
  const totalMaintenanceMargin = (allPositions && allPositions.length ? allPositions : [position]).reduce((sum, p) => {
    const qty = Math.abs(p.positionAmount);
    if (qty === 0) return sum;
    const priceBasis = p.markPrice > 0 ? p.markPrice : p.entryPrice;
    return sum + qty * priceBasis * MMR;
  }, 0);

  // Sum of unrealized PnL for all other positions at current mark
  const unrealizedOthers = (allPositions && allPositions.length ? allPositions : [])
    .filter((p) => p.symbol !== position.symbol || p.positionSide !== position.positionSide)
    .reduce((s, p) => s + (p.unrealizedProfit || 0), 0);

  // From cross formula:
  // marginBalance + UPNL_others + UPNL_this = totalMaintenanceMargin
  // Long: UPNL_this = Q*(P - E) => P = (Q*E + totalMM - marginBalance - UPNL_others)/Q
  // Short: UPNL_this = Q*(E - P) => P = (Q*E - (totalMM - marginBalance - UPNL_others))/Q
  const rhs = totalMaintenanceMargin - marginBalance - unrealizedOthers;
  const pLiq = isLong ? (Q * E + rhs) / Q : (Q * E - rhs) / Q;

  return Math.max(0, Number.isFinite(pLiq) ? pLiq : 0);
}

/**
 * Calculate margin ratio
 * Margin Ratio = Maintenance Margin / Margin Balance
 */
export function calculateMarginRatio(position: PositionData, accountBalance: number): number {
  const { positionAmount, entryPrice, leverage, marginType, isolatedMargin } = position;

  if (positionAmount === 0) return 0;

  const absPositionAmount = Math.abs(positionAmount);
  const notionalValue = absPositionAmount * entryPrice;

  let maintenanceMargin: number;

  if (marginType === 'isolated') {
    maintenanceMargin = isolatedMargin * 0.004; // 0.4% maintenance margin rate
  } else {
    maintenanceMargin = notionalValue * 0.004; // 0.4% for cross margin
  }

  const marginBalance = accountBalance;
  return marginBalance > 0 ? (maintenanceMargin / marginBalance) * 100 : 0;
}

/**
 * Calculate ROI (Return on Investment)
 * ROI = (Current Value - Initial Investment) / Initial Investment * 100
 */
export function calculateROI(position: PositionData): number {
  const { positionAmount, entryPrice, markPrice, unrealizedProfit } = position;

  if (positionAmount === 0) return 0;

  const absPositionAmount = Math.abs(positionAmount);
  const initialInvestment = absPositionAmount * entryPrice;

  return initialInvestment > 0 ? (unrealizedProfit / initialInvestment) * 100 : 0;
}

/**
 * Calculate ROE (Return on Equity)
 * ROE = Unrealized PnL / Initial Margin * 100
 */
export function calculateROE(position: PositionData): number {
  const { positionAmount, entryPrice, leverage, unrealizedProfit } = position;

  if (positionAmount === 0) return 0;

  const absPositionAmount = Math.abs(positionAmount);
  const notionalValue = absPositionAmount * entryPrice;
  const initialMargin = notionalValue / leverage;

  return initialMargin > 0 ? (unrealizedProfit / initialMargin) * 100 : 0;
}

/**
 * Calculate distance to liquidation as percentage
 */
export function calculateDistanceToLiquidation(
  position: PositionData,
  accountBalance: number = 0,
  allPositions: PositionData[] = [],
): number {
  const { markPrice } = position;
  const liquidationPrice = calculateLiquidationPrice(position, accountBalance, allPositions);

  if (liquidationPrice === 0 || markPrice === 0) return 0;

  const isLong = position.positionAmount > 0;
  const distance = isLong
    ? ((markPrice - liquidationPrice) / markPrice) * 100
    : ((liquidationPrice - markPrice) / markPrice) * 100;

  return Math.max(0, distance);
}

/**
 * Calculate notional value
 */
export function calculateNotionalValue(position: PositionData): number {
  const { positionAmount, markPrice } = position;
  return Math.abs(positionAmount) * markPrice;
}

/**
 * Calculate initial margin
 */
export function calculateInitialMargin(position: PositionData): number {
  const notionalValue = calculateNotionalValue(position);
  return notionalValue / position.leverage;
}

/**
 * Calculate maintenance margin
 */
export function calculateMaintenanceMargin(position: PositionData): number {
  const { marginType, isolatedMargin } = position;

  if (marginType === 'isolated') {
    return isolatedMargin * 0.004; // 0.4% maintenance margin rate
  }

  const notionalValue = calculateNotionalValue(position);
  return notionalValue * 0.004; // 0.4% for cross margin
}

/**
 * Get all position calculations in one call
 */
export function calculatePositionMetrics(
  position: PositionData,
  accountBalance: number = 0,
  allPositions: PositionData[] = [],
): PositionCalculations {
  const liquidationPrice = calculateLiquidationPrice(position, accountBalance, allPositions);
  const marginRatio = calculateMarginRatio(position, accountBalance);
  const roi = calculateROI(position);
  const roe = calculateROE(position);
  const distanceToLiquidation = calculateDistanceToLiquidation(position, accountBalance, allPositions);
  const notionalValue = calculateNotionalValue(position);
  const initialMargin = calculateInitialMargin(position);
  const maintMargin = calculateMaintenanceMargin(position);

  return {
    liquidationPrice,
    marginRatio,
    roi,
    roe,
    distanceToLiquidation,
    notionalValue,
    initialMargin,
    maintMargin,
  };
}

/**
 * Format number with appropriate precision
 */
export function formatNumber(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}

/**
 * Format currency with appropriate precision
 */
export function formatCurrency(value: number, currency: string = 'USDT', decimalsAbove1: number = 2): string {
  if (value >= 1) {
    return `${currency} ${value.toFixed(decimalsAbove1)}`;
  } else {
    return `${currency} ${value.toFixed(6)}`;
  }
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Get color based on value (positive/negative)
 */
export function getValueColor(value: number): string {
  return value >= 0 ? '#4CAF50' : '#F44336';
}

/**
 * Get risk level based on margin ratio
 */
export function getRiskLevel(marginRatio: number): { level: string; color: string } {
  if (marginRatio >= 80) return { level: 'CRITICAL', color: '#F44336' };
  if (marginRatio >= 60) return { level: 'HIGH', color: '#FF9800' };
  if (marginRatio >= 40) return { level: 'MEDIUM', color: '#FFC107' };
  if (marginRatio >= 20) return { level: 'LOW', color: '#4CAF50' };
  return { level: 'SAFE', color: '#2196F3' };
}
