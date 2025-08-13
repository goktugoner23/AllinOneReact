import { PositionData, PositionCalculations } from '@features/transactions/types/BinanceApiModels';

/**
 * Calculate liquidation price for Binance futures positions
 * Based on Binance documentation: https://binance-docs.github.io/apidocs/futures/en/#position-information-v2-user_data
 */
export function calculateLiquidationPrice(position: PositionData): number {
  const { positionAmount, entryPrice, markPrice, leverage, marginType, isolatedMargin } = position;
  if (positionAmount === 0 || leverage <= 0 || entryPrice <= 0) return 0;

  const isLong = positionAmount > 0;
  const Q = Math.abs(positionAmount); // contract quantity
  const E = entryPrice; // entry price
  const L = leverage;

  // Approximate maintenance margin rate (MMR). In reality it's tiered per symbol notional.
  const MMR = 0.004; // 0.4%

  // Initial margin for linear contracts: IM = (Q * E) / L
  const IM = (Q * E) / L;

  // Maintenance margin: MM = (Q * Pliq) * MMR -> depends on Pliq, iterative. Use E approximation:
  // To avoid iteration, approximate with entry price for MM basis:
  const approxMM = (Q * E) * MMR;

  // Fees/funding ignored in simplified calc.
  // Long: liquidation when (Q * Pliq) <= Q*E - IM + approxMM
  // Solve for Pliq: Pliq_long ≈ E - (IM - approxMM) / Q
  // Short: liquidation when (Q * Pliq) >= Q*E + IM - approxMM
  // Pliq_short ≈ E + (IM - approxMM) / Q
  const delta = (IM - approxMM) / Q;
  const pLiq = isLong ? E - delta : E + delta;

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
export function calculateDistanceToLiquidation(position: PositionData): number {
  const { markPrice } = position;
  const liquidationPrice = calculateLiquidationPrice(position);
  
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
export function calculatePositionMetrics(position: PositionData, accountBalance: number = 0): PositionCalculations {
  const liquidationPrice = calculateLiquidationPrice(position);
  const marginRatio = calculateMarginRatio(position, accountBalance);
  const roi = calculateROI(position);
  const roe = calculateROE(position);
  const distanceToLiquidation = calculateDistanceToLiquidation(position);
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