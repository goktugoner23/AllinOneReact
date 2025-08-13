import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Chip,
  Divider,
  IconButton,
} from 'react-native-paper';
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

const TopTab = createMaterialTopTabNavigator();

interface EnhancedPositionData extends PositionData {
  calculations?: ReturnType<typeof calculatePositionMetrics>;
}

function FuturesPositionCard({ position, onSetTPSL }: { 
  position: EnhancedPositionData; 
  onSetTPSL: (position: EnhancedPositionData) => void;
}) {
  const calculations = position.calculations || calculatePositionMetrics(position);
  const isLong = position.positionAmount > 0;
  const positionSideColor = isLong ? '#4CAF50' : '#F44336';
  const riskLevel = getRiskLevel(calculations.marginRatio);
  
  return (
    <Card style={styles.positionCard} mode="outlined">
      <Card.Content>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.symbolSection}>
            <Text variant="titleMedium" style={styles.symbol}>
              {position.symbol}
            </Text>
            <Chip 
              mode="outlined" 
              style={[styles.positionSideChip, { backgroundColor: positionSideColor }]}
              textStyle={{ color: 'white', fontWeight: 'bold' }}
            >
              {position.positionAmount > 0 ? 'LONG' : 'SHORT'}
            </Chip>
          </View>
          <IconButton
            icon="target"
            size={20}
            onPress={() => onSetTPSL(position)}
            style={styles.tpslButton}
          />
        </View>

        <Divider style={styles.divider} />

        {/* Position Details */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Position Size:</Text>
            <Text style={[styles.value, { color: positionSideColor }]}>
              {formatNumber(Math.abs(position.positionAmount))}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Entry Price:</Text>
            <Text style={styles.value}>{formatCurrency(position.entryPrice)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Mark Price:</Text>
            <Text style={styles.value}>{formatCurrency(position.markPrice)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Leverage:</Text>
            <Text style={styles.value}>{position.leverage}x</Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* PnL and ROI */}
        <View style={styles.pnlSection}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Unrealized PnL:</Text>
            <Text style={[styles.value, { color: getValueColor(position.unrealizedProfit) }]}>
              {formatCurrency(position.unrealizedProfit)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>ROI:</Text>
            <Text style={[styles.value, { color: getValueColor(calculations.roi) }]}>
              {formatPercentage(calculations.roi)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>ROE:</Text>
            <Text style={[styles.value, { color: getValueColor(calculations.roe) }]}>
              {formatPercentage(calculations.roe)}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Risk Metrics */}
        <View style={styles.riskSection}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Liquidation Price:</Text>
            <Text style={[styles.value, { color: '#FF5722' }]}>
              {formatCurrency(calculations.liquidationPrice, 'USDT', 2)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Distance to Liquidation:</Text>
            <Text style={[styles.value, { color: riskLevel.color }]}>
              {formatPercentage(calculations.distanceToLiquidation)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Margin Ratio:</Text>
            <View style={styles.marginRatioContainer}>
              <Text style={[styles.value, { color: riskLevel.color }]}>
                {formatPercentage(calculations.marginRatio)}
              </Text>
            </View>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Margin Details */}
        <View style={styles.marginSection}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Notional Value:</Text>
            <Text style={styles.value}>{formatCurrency(calculations.notionalValue, 'USDT', 2)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Initial Margin:</Text>
            <Text style={styles.value}>{formatCurrency(calculations.initialMargin, 'USDT', 2)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Maintenance Margin:</Text>
            <Text style={styles.value}>{formatCurrency(calculations.maintMargin, 'USDT', 2)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Margin Type:</Text>
            <Text style={styles.value}>{position.marginType}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

function FuturesPositionsList({ 
  positions, 
  onSetTPSL 
}: { 
  positions: EnhancedPositionData[]; 
  onSetTPSL: (position: EnhancedPositionData) => void;
}) {
  if (!positions.length)
    return <Text style={styles.empty}>No open positions.</Text>;
    
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {positions.map(pos => (
        <FuturesPositionCard 
          key={pos.symbol + pos.positionSide} 
          position={pos} 
          onSetTPSL={onSetTPSL}
        />
      ))}
    </ScrollView>
  );
}

function FuturesAccountCard({ account }: { account: AccountData | null }) {
  if (!account) return null;
  
  const totalBalance = account.totalWalletBalance;
  const unrealizedPnL = account.totalUnrealizedProfit;
  const marginBalance = account.totalMarginBalance;
  const availableBalance = totalBalance + unrealizedPnL;
  
  return (
    <Card style={styles.accountCard} mode="outlined">
      <Card.Title title="Account Overview" titleVariant="titleMedium" />
      <Card.Content>
        <View style={styles.accountGrid}>
          <View style={styles.accountItem}>
            <Text style={styles.accountLabel}>Total Balance</Text>
            <Text style={[styles.accountValue, { color: getValueColor(totalBalance) }]}>
              {formatCurrency(totalBalance)}
            </Text>
          </View>
          
          <View style={styles.accountItem}>
            <Text style={styles.accountLabel}>Unrealized PnL</Text>
            <Text style={[styles.accountValue, { color: getValueColor(unrealizedPnL) }]}>
              {formatCurrency(unrealizedPnL)}
            </Text>
          </View>
          
          <View style={styles.accountItem}>
            <Text style={styles.accountLabel}>Margin Balance</Text>
            <Text style={[styles.accountValue, { color: getValueColor(marginBalance) }]}>
              {formatCurrency(marginBalance)}
            </Text>
          </View>
          
          <View style={styles.accountItem}>
            <Text style={styles.accountLabel}>Available</Text>
            <Text style={[styles.accountValue, { color: getValueColor(availableBalance) }]}>
              {formatCurrency(availableBalance)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

function UsdMFuturesScreen() {
  const [positions, setPositions] = useState<EnhancedPositionData[]>([]);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tpslModalVisible, setTpslModalVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<EnhancedPositionData | null>(null);
  const [tpslLoading, setTpslLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pos, acc] = await Promise.all([
        getUsdMPositions(),
        getUsdMAccount(),
      ]);
      
      // Filter positions and add calculations
      const enhancedPositions = pos
        .filter(p => p.positionAmount !== 0)
        .map(p => ({
          ...p,
          calculations: calculatePositionMetrics(p, acc?.totalMarginBalance || 0)
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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Button
          mode="outlined"
          onPress={loadData}
          loading={loading}
          style={{ marginLeft: 8 }}
        >
          Refresh
        </Button>
      </View>
      {error && (
        <Chip
          icon="alert"
          style={{ marginBottom: 8 }}
          onClose={() => setError(null)}
        >
          {error}
        </Chip>
      )}
      <FuturesAccountCard account={account} />
      {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
      <FuturesPositionsList positions={positions} onSetTPSL={handleSetTPSL} />
      
      <TPSLModal
        visible={tpslModalVisible}
        position={selectedPosition}
        onDismiss={handleTPSLDismiss}
        onConfirm={handleTPSLConfirm}
        loading={tpslLoading}
      />
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pos, acc] = await Promise.all([
        getCoinMPositions(),
        getCoinMAccount(),
      ]);
      
      // Filter positions and add calculations
      const enhancedPositions = pos
        .filter(p => p.positionAmount !== 0)
        .map(p => ({
          ...p,
          calculations: calculatePositionMetrics(p, acc?.totalMarginBalance || 0)
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
      <View style={styles.headerRow}>
        <Button
          mode="outlined"
          onPress={loadData}
          loading={loading}
          style={{ marginLeft: 8 }}
        >
          Refresh
        </Button>
      </View>
      {error && (
        <Chip
          icon="alert"
          style={{ marginBottom: 8 }}
          onClose={() => setError(null)}
        >
          {error}
        </Chip>
      )}
      <FuturesAccountCard account={account} />
      {loading ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
      <FuturesPositionsList positions={positions} onSetTPSL={handleSetTPSL} />
      
      <TPSLModal
        visible={tpslModalVisible}
        position={selectedPosition}
        onDismiss={handleTPSLDismiss}
        onConfirm={handleTPSLConfirm}
        loading={tpslLoading}
      />
    </View>
  );
}

export const FuturesTab: React.FC = () => {
  return (
    <TopTab.Navigator>
      <TopTab.Screen name="USD-M" component={UsdMFuturesScreen} />
      <TopTab.Screen name="COIN-M" component={CoinMFuturesScreen} />
    </TopTab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
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
    height: 24,
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
});
