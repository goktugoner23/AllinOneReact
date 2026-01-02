import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Card, Text, Button, ActivityIndicator, Chip, Divider, IconButton, useTheme } from 'react-native-paper';
import RefreshFab from '@shared/components/ui/RefreshFab';
import BinanceWebSocketService from '../services/binanceWebSocket';
import { logger } from '@shared/utils/logger';
import { FuturesWebSocketProvider, useFuturesWebSocket } from '@features/transactions/context/FuturesWebSocketProvider';
import {
  getUsdMPositions,
  getCoinMPositions,
  getUsdMAccount,
  getCoinMAccount,
  setTakeProfitStopLoss,
  setCoinMTakeProfitStopLoss,
} from '@features/transactions/services/binanceApi';
import { PositionData, AccountData, TakeProfitStopLossData } from '@features/transactions/types/BinanceApiModels';
import {
  calculatePositionMetrics,
  formatNumber,
  formatCurrency,
  formatPercentage,
  getValueColor,
  getRiskLevel,
} from '@features/transactions/utils/futuresCalculations';
import { TPSLModal } from '@features/transactions/components/TPSLModal';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';

const TopTab = createMaterialTopTabNavigator();

interface EnhancedPositionData extends PositionData {
  calculations?: ReturnType<typeof calculatePositionMetrics>;
}

function FuturesPositionCard({
  position,
  onSetTPSL,
}: {
  position: EnhancedPositionData;
  onSetTPSL: (position: EnhancedPositionData) => void;
}) {
  const theme = useTheme();
  const colors = useColors();
  const calculations = position.calculations || calculatePositionMetrics(position);
  const isLong = position.positionAmount > 0;
  // Use theme colors for LONG and SHORT
  const positionSideColor = isLong ? colors.income : colors.expense;
  const riskLevel = getRiskLevel(calculations.marginRatio);

  // Determine if this is COIN-M futures (check symbol pattern or contract type)
  const isCoinMFutures = position.symbol.includes('USD_PERP') || (position as any).contractType === 'COIN-M';

  // Format P&L based on futures type
  const formatPnL = (pnl: number) => {
    if (isCoinMFutures) {
      // For COIN-M, P&L is in the coin itself
      const coinSymbol = position.symbol.replace('USD_PERP', '');
      return `${pnl > 0 ? '+' : ''}${pnl.toFixed(6)} ${coinSymbol}`;
    } else {
      // For USD-M, P&L is in USDT
      return `${pnl > 0 ? '+' : ''}${pnl.toFixed(2)} USDT`;
    }
  };

  return (
    <Card style={[styles.positionCard, { backgroundColor: colors.card }, shadow.sm]} mode="elevated">
      <Card.Content>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.symbolSection}>
            <Text variant="titleMedium" style={[styles.symbol, { color: colors.foreground }]}>
              {position.symbol}
            </Text>
            <Chip
              mode="flat"
              style={[
                styles.positionSideChip,
                { backgroundColor: positionSideColor, paddingHorizontal: 6, height: 26 },
              ]}
              textStyle={{
                color: isLong ? colors.incomeForeground : colors.expenseForeground,
                fontWeight: 'bold',
                lineHeight: 16,
              }}
            >
              {position.positionAmount > 0 ? 'LONG' : 'SHORT'}
            </Chip>
            {/* Only show COIN-M chip if it's actually COIN-M and has valid data */}
            {isCoinMFutures && position.symbol.includes('USD_PERP') && (
              <Chip
                mode="outlined"
                style={[styles.futuresTypeChip, { borderColor: colors.primary }]}
                textStyle={{ color: colors.primary, fontSize: 10 }}
              >
                COIN-M
              </Chip>
            )}
          </View>
          <IconButton
            icon="target"
            size={20}
            onPress={() => onSetTPSL(position)}
            style={styles.tpslButton}
            iconColor={colors.primary}
          />
        </View>

        <Divider style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Position Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Position Size:</Text>
            <Text style={[styles.value, { color: positionSideColor }]}>
              {formatNumber(Math.abs(position.positionAmount))}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Entry Price:</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(position.entryPrice)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Mark Price:</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(position.markPrice)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Leverage:</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{position.leverage}x</Text>
          </View>
        </View>

        <Divider style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* PnL and ROI */}
        <View style={styles.pnlSection}>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Unrealized PnL:</Text>
            <Text style={[styles.value, { color: position.unrealizedProfit >= 0 ? colors.income : colors.expense }]}>
              {formatPnL(position.unrealizedProfit)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>ROI:</Text>
            <Text style={[styles.value, { color: calculations.roi >= 0 ? colors.income : colors.expense }]}>
              {formatPercentage(calculations.roi)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>ROE:</Text>
            <Text style={[styles.value, { color: calculations.roe >= 0 ? colors.income : colors.expense }]}>
              {formatPercentage(calculations.roe)}
            </Text>
          </View>
        </View>

        <Divider style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Risk Metrics */}
        <View style={styles.riskSection}>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Liquidation Price:</Text>
            <Text style={[styles.value, { color: colors.warning }]}>
              {formatCurrency(calculations.liquidationPrice, 'USDT', 2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Distance to Liquidation:</Text>
            <Text style={[styles.value, { color: riskLevel.color }]}>
              {formatPercentage(calculations.distanceToLiquidation)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Margin Ratio:</Text>
            <View style={styles.marginRatioContainer}>
              <Text style={[styles.value, { color: riskLevel.color }]}>
                {formatPercentage(calculations.marginRatio)}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Margin Details */}
        <View style={styles.marginSection}>
          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Notional Value:</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {formatCurrency(calculations.notionalValue, 'USDT', 2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Initial Margin:</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {formatCurrency(calculations.initialMargin, 'USDT', 2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Maintenance Margin:</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>
              {formatCurrency(calculations.maintMargin, 'USDT', 2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Margin Type:</Text>
            <Text style={[styles.value, { color: colors.foreground }]}>{position.marginType}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

function FuturesPositionsList({
  positions,
  onSetTPSL,
}: {
  positions: EnhancedPositionData[];
  onSetTPSL: (position: EnhancedPositionData) => void;
}) {
  const colors = useColors();
  if (!positions.length)
    return <Text style={[styles.empty, { color: colors.mutedForeground }]}>No open positions.</Text>;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {positions.map((pos) => (
        <FuturesPositionCard key={pos.symbol + pos.positionSide} position={pos} onSetTPSL={onSetTPSL} />
      ))}
    </ScrollView>
  );
}

function FuturesAccountCard({ account }: { account: AccountData | null }) {
  const colors = useColors();
  if (!account) return null;

  const totalBalance = account.totalWalletBalance;
  const unrealizedPnL = account.totalUnrealizedProfit;
  const marginBalance = account.totalMarginBalance;
  const availableBalance = totalBalance + unrealizedPnL;

  return (
    <Card style={[styles.accountCard, { backgroundColor: colors.card }, shadow.sm]} mode="elevated">
      <Card.Title title="Account Overview" titleVariant="titleMedium" titleStyle={{ color: colors.foreground }} />
      <Card.Content>
        <View style={styles.accountGrid}>
          <View style={styles.accountItem}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>Total Balance</Text>
            <Text style={[styles.accountValue, { color: totalBalance >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(totalBalance)}
            </Text>
          </View>

          <View style={styles.accountItem}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>Unrealized PnL</Text>
            <Text style={[styles.accountValue, { color: unrealizedPnL >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(unrealizedPnL)}
            </Text>
          </View>

          <View style={styles.accountItem}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>Margin Balance</Text>
            <Text style={[styles.accountValue, { color: marginBalance >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(marginBalance)}
            </Text>
          </View>

          <View style={styles.accountItem}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>Available</Text>
            <Text style={[styles.accountValue, { color: availableBalance >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(availableBalance)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

// COIN-M specific account card that calculates USD values from coin balances
function CoinMFuturesAccountCard({
  account,
  positions,
}: {
  account: AccountData | null;
  positions: EnhancedPositionData[];
}) {
  const colors = useColors();
  if (!account) return null;

  // Calculate total USD value from coin balances
  const totalCoinValue =
    account.assets?.reduce((total, asset) => {
      if (asset.walletBalance > 0) {
        // For COIN-M, we need to get the current price to convert to USD
        // Since we don't have real-time prices here, we'll use a rough estimate
        // In a real app, you'd fetch current prices for each coin
        const estimatedPrice = getEstimatedCoinPrice(asset.asset);
        return total + asset.walletBalance * estimatedPrice;
      }
      return total;
    }, 0) || 0;

  // Calculate total position value (contracts * $1 for COIN-M)
  const totalPositionValue = positions.reduce((total, pos) => {
    return total + Math.abs(pos.positionAmount); // Each contract = $1
  }, 0);

  // Calculate total unrealized PnL in USD
  const totalUnrealizedPnL = positions.reduce((total, pos) => {
    // For COIN-M, unrealized PnL is in the coin itself, convert to USD
    const estimatedPrice = getEstimatedCoinPrice(pos.symbol.replace('USD_PERP', ''));
    return total + pos.unrealizedProfit * estimatedPrice;
  }, 0);

  const totalValue = totalCoinValue + totalPositionValue + totalUnrealizedPnL;

  return (
    <Card style={[styles.accountCard, { backgroundColor: colors.card }, shadow.sm]} mode="elevated">
      <Card.Title
        title="COIN-M Account Overview"
        titleVariant="titleMedium"
        titleStyle={{ color: colors.foreground }}
      />
      <Card.Content>
        <View style={styles.accountGrid}>
          <View style={styles.accountItem}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>Coin Balances</Text>
            <Text style={[styles.accountValue, { color: totalCoinValue >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(totalCoinValue)}
            </Text>
          </View>

          <View style={styles.accountItem}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>Position Value</Text>
            <Text style={[styles.accountValue, { color: totalPositionValue >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(totalPositionValue)}
            </Text>
          </View>

          <View style={styles.accountItem}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>Unrealized PnL</Text>
            <Text style={[styles.accountValue, { color: totalUnrealizedPnL >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(totalUnrealizedPnL)}
            </Text>
          </View>

          <View style={styles.accountItem}>
            <Text style={[styles.accountLabel, { color: colors.mutedForeground }]}>Total Value</Text>
            <Text style={[styles.accountValue, { color: totalValue >= 0 ? colors.income : colors.expense }]}>
              {formatCurrency(totalValue)}
            </Text>
          </View>
        </View>

        {/* Show individual coin balances */}
        {account.assets
          ?.filter((asset) => asset.walletBalance > 0)
          .map((asset) => (
            <View key={asset.asset} style={[styles.coinBalanceRow, { backgroundColor: colors.muted }]}>
              <Text style={[styles.coinSymbol, { color: colors.foreground }]}>{asset.asset}</Text>
              <Text style={[styles.coinAmount, { color: colors.investment }]}>{asset.walletBalance.toFixed(6)}</Text>
              <Text style={[styles.coinValue, { color: colors.income }]}>
                {formatCurrency(asset.walletBalance * getEstimatedCoinPrice(asset.asset))}
              </Text>
            </View>
          ))}
      </Card.Content>
    </Card>
  );
}

// Helper function to get estimated coin prices (in a real app, fetch from API)
function getEstimatedCoinPrice(symbol: string): number {
  const prices: { [key: string]: number } = {
    SOL: 188.37, // Current SOL price
    BTC: 117349.5, // Current BTC price
    ETH: 4412.87, // Current ETH price
    // Add more coins as needed
  };
  return prices[symbol] || 1; // Default to $1 if unknown
}

// USD-M Futures Screen with WebSocket integration for live updates - UNIQUE_IDENTIFIER_USDM_FUNCTION_SPECIFIC
function UsdMFuturesScreen() {
  const colors = useColors();
  const [positions, setPositions] = useState<EnhancedPositionData[]>([]);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tpslModalVisible, setTpslModalVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<EnhancedPositionData | null>(null);
  const [tpslLoading, setTpslLoading] = useState(false);
  const [wsConnectedLocal, setWsConnectedLocal] = useState(false);

  // Shared WebSocket: subscribe and react to events
  const {
    connected: wsConnected,
    addListener,
    removeListener,
    subscribeToPositions,
    subscribeToOrders,
    subscribeToBalance,
    subscribeToTicker,
  } = useFuturesWebSocket();
  useEffect(() => {
    setWsConnectedLocal(wsConnected);
  }, [wsConnected]);

  useEffect(() => {
    const handlePositions = () => loadData();
    const handleOrders = () => loadData();
    const handleBalance = () =>
      getUsdMAccount()
        .then(setAccount)
        .catch(() => {});

    addListener('positions_update', handlePositions);
    addListener('order_update', handleOrders);
    addListener('balance_update', handleBalance);

    // Initial subscriptions
    subscribeToPositions();
    subscribeToOrders();
    subscribeToBalance();

    // Subscribe tickers for current positions
    positions.forEach((p) => subscribeToTicker(p.symbol));

    return () => {
      removeListener('positions_update', handlePositions);
      removeListener('order_update', handleOrders);
      removeListener('balance_update', handleBalance);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pos, acc] = await Promise.all([getUsdMPositions(), getUsdMAccount()]);

      // Filter positions and add calculations
      const enhancedPositions = pos
        .filter((p) => p.positionAmount !== 0)
        .map((p) => ({
          ...p,
          calculations: calculatePositionMetrics(p, acc?.totalMarginBalance || 0),
        }));

      setPositions(enhancedPositions);
      setAccount(acc);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const handleSetTPSL = (position: EnhancedPositionData) => {
    setSelectedPosition(position);
    setTpslModalVisible(true);
  };

  const handleTPSLConfirm = async (takeProfit: number, stopLoss: number) => {
    if (!selectedPosition) return;

    setTpslLoading(true);
    try {
      const tpslData: TakeProfitStopLossData = {
        symbol: selectedPosition.symbol,
        side: selectedPosition.positionAmount > 0 ? 'SELL' : 'BUY',
        takeProfitPrice: takeProfit,
        stopLossPrice: stopLoss,
        quantity: Math.abs(selectedPosition.positionAmount),
      };

      await setTakeProfitStopLoss(tpslData);
      setTpslModalVisible(false);
      setSelectedPosition(null);
      loadData(); // Refresh data after setting TP/SL
    } catch (e: any) {
      setError(`Failed to set TP/SL: ${e.message}`);
    } finally {
      setTpslLoading(false);
    }
  };

  const handleTPSLDismiss = () => {
    setTpslModalVisible(false);
    setSelectedPosition(null);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // WebSocket status indicator below (USD-M only)
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {error && (
        <Chip
          icon="alert"
          style={[styles.errorChip, { backgroundColor: colors.destructiveMuted }]}
          textStyle={{ color: colors.destructive }}
          onClose={() => setError(null)}
        >
          {error}
        </Chip>
      )}
      {/* WebSocket Connection Status for USD-M Futures */}
      <Chip
        icon={wsConnectedLocal ? 'wifi' : 'wifi-off'}
        style={[styles.statusChip, { backgroundColor: wsConnectedLocal ? colors.income : colors.warning }]}
        textStyle={{ color: wsConnectedLocal ? colors.incomeForeground : colors.warningForeground }}
      >
        {wsConnectedLocal ? 'Live Data Connected' : 'Live Data Disconnected'}
      </Chip>
      <FuturesAccountCard account={account} />
      {loading ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : null}
      <FuturesPositionsList positions={positions} onSetTPSL={handleSetTPSL} />

      <TPSLModal
        visible={tpslModalVisible}
        position={selectedPosition}
        onDismiss={handleTPSLDismiss}
        onConfirm={handleTPSLConfirm}
        loading={tpslLoading}
      />

      <RefreshFab onPress={loadData} />
    </View>
  );
}

function CoinMFuturesScreen() {
  const [positions, setPositions] = useState<EnhancedPositionData[]>([]);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tpslModalVisible, setTpslModalVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<EnhancedPositionData | null>(null);
  const [tpslLoading, setTpslLoading] = useState(false);
  // Shared WebSocket for COIN-M
  const {
    connected: wsConnectedCoin,
    addListener: addListenerCoin,
    removeListener: removeListenerCoin,
    subscribeToPositions: subPosCoin,
    subscribeToOrders: subOrdCoin,
    subscribeToBalance: subBalCoin,
    subscribeToTicker: subTickerCoin,
  } = useFuturesWebSocket();

  useEffect(() => {
    const handlePositions = () => loadData();
    const handleOrders = () => loadData();
    const handleBalance = () =>
      getCoinMAccount()
        .then(setAccount)
        .catch(() => {});

    addListenerCoin('positions_update', handlePositions);
    addListenerCoin('order_update', handleOrders);
    addListenerCoin('balance_update', handleBalance);

    subPosCoin();
    subOrdCoin();
    subBalCoin();
    positions.forEach((p) => subTickerCoin(p.symbol));

    return () => {
      removeListenerCoin('positions_update', handlePositions);
      removeListenerCoin('order_update', handleOrders);
      removeListenerCoin('balance_update', handleBalance);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pos, acc] = await Promise.all([getCoinMPositions(), getCoinMAccount()]);

      // Filter positions and add calculations
      const enhancedPositions = pos
        .filter((p) => p.positionAmount !== 0)
        .map((p) => ({
          ...p,
          calculations: calculatePositionMetrics(p, acc?.totalMarginBalance || 0),
        }));

      setPositions(enhancedPositions);
      setAccount(acc);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const handleSetTPSL = (position: EnhancedPositionData) => {
    setSelectedPosition(position);
    setTpslModalVisible(true);
  };

  const handleTPSLConfirm = async (takeProfit: number, stopLoss: number) => {
    if (!selectedPosition) return;

    setTpslLoading(true);
    try {
      const tpslData: TakeProfitStopLossData = {
        symbol: selectedPosition.symbol,
        side: selectedPosition.positionAmount > 0 ? 'SELL' : 'BUY',
        takeProfitPrice: takeProfit,
        stopLossPrice: stopLoss,
        quantity: Math.abs(selectedPosition.positionAmount),
      };

      await setCoinMTakeProfitStopLoss(tpslData);
      setTpslModalVisible(false);
      setSelectedPosition(null);
      loadData(); // Refresh data after setting TP/SL
    } catch (e: any) {
      setError(`Failed to set TP/SL: ${e.message}`);
    } finally {
      setTpslLoading(false);
    }
  };

  const handleTPSLDismiss = () => {
    setTpslModalVisible(false);
    setSelectedPosition(null);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      {error && (
        <Chip icon="alert" style={{ marginBottom: 8 }} onClose={() => setError(null)}>
          {error}
        </Chip>
      )}
      {/* WebSocket Connection Status for COIN-M Futures */}
      <Chip
        icon={wsConnectedCoin ? 'wifi' : 'wifi-off'}
        style={{
          marginBottom: 8,
          backgroundColor: wsConnectedCoin ? '#4CAF50' : '#FF9800',
          alignSelf: 'flex-start',
        }}
        textStyle={{ color: 'white' }}
      >
        {wsConnectedCoin ? 'Live Data Connected' : 'Live Data Disconnected'}
      </Chip>
      <CoinMFuturesAccountCard account={account} positions={positions} />
      {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
      <FuturesPositionsList positions={positions} onSetTPSL={handleSetTPSL} />

      <TPSLModal
        visible={tpslModalVisible}
        position={selectedPosition}
        onDismiss={handleTPSLDismiss}
        onConfirm={handleTPSLConfirm}
        loading={tpslLoading}
      />

      <RefreshFab onPress={loadData} />
    </View>
  );
}

export const FuturesTab: React.FC = () => {
  return (
    <FuturesWebSocketProvider>
      <TopTab.Navigator>
        <TopTab.Screen name="USD-M" component={UsdMFuturesScreen} />
        <TopTab.Screen name="COIN-M" component={CoinMFuturesScreen} />
      </TopTab.Navigator>
    </FuturesWebSocketProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },

  accountCard: {
    marginBottom: 16,
  },
  positionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symbolSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  symbol: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  positionSideChip: {
    borderRadius: 12,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  futuresTypeChip: {
    height: 20,
    marginLeft: 4,
  },
  tpslButton: {
    margin: 0,
  },
  divider: {
    marginVertical: 8,
  },
  detailsGrid: {
    marginBottom: 8,
  },
  pnlSection: {
    marginBottom: 8,
  },
  riskSection: {
    marginBottom: 8,
  },
  marginSection: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  marginRatioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  riskChip: {
    height: 20,
    marginLeft: 8,
  },
  accountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  accountItem: {
    width: '48%',
    marginBottom: 12,
  },
  accountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
    fontSize: 16,
  },
  coinBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  coinSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  coinAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  coinValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  errorChip: {
    marginBottom: 8,
  },
  statusChip: {
    marginBottom: 8,
  },
  loader: {
    marginVertical: 16,
  },
});
