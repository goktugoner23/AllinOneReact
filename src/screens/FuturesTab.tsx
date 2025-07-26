import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import {
  getUsdMPositions,
  getCoinMPositions,
  getUsdMAccount,
  getCoinMAccount,
} from '../data/binanceApi';
import { PositionData, AccountData } from '../types/BinanceApiModels';

const TopTab = createMaterialTopTabNavigator();

function FuturesPositionsList({ positions }: { positions: PositionData[] }) {
  if (!positions.length)
    return <Text style={styles.empty}>No open positions.</Text>;
  return (
    <ScrollView>
      {positions.map(pos => (
        <Card key={pos.symbol + pos.positionSide} style={styles.card}>
          <Card.Title title={pos.symbol} subtitle={pos.positionSide} />
          <Card.Content>
            <Text>Position: {pos.positionAmount}</Text>
            <Text>Entry: {pos.entryPrice}</Text>
            <Text>Mark: {pos.markPrice}</Text>
            <Text>Unrealized PnL: {pos.unrealizedProfit}</Text>
            <Text>Leverage: {pos.leverage}x</Text>
            <Text>Margin Type: {pos.marginType}</Text>
            <Text>Isolated Margin: {pos.isolatedMargin}</Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

function FuturesAccountCard({ account }: { account: AccountData | null }) {
  if (!account) return null;
  return (
    <Card style={styles.card}>
      <Card.Title title="Account Info" />
      <Card.Content>
        <Text>Total Wallet Balance: {account.totalWalletBalance}</Text>
        <Text>Total Unrealized Profit: {account.totalUnrealizedProfit}</Text>
        <Text>Total Margin Balance: {account.totalMarginBalance}</Text>
        <Text>Max Withdraw Amount: {account.maxWithdrawAmount}</Text>
      </Card.Content>
    </Card>
  );
}

function UsdMFuturesScreen() {
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pos, acc] = await Promise.all([
        getUsdMPositions(),
        getUsdMAccount(),
      ]);
      setPositions(pos.filter(p => p.positionAmount !== 0));
      setAccount(acc);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="titleLarge">USD-M Futures</Text>
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
      {loading && <ActivityIndicator style={{ marginVertical: 16 }} />}
      <FuturesPositionsList positions={positions} />
    </View>
  );
}

function CoinMFuturesScreen() {
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pos, acc] = await Promise.all([
        getCoinMPositions(),
        getCoinMAccount(),
      ]);
      setPositions(pos.filter(p => p.positionAmount !== 0));
      setAccount(acc);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="titleLarge">COIN-M Futures</Text>
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
      {loading && <ActivityIndicator style={{ marginVertical: 16 }} />}
      <FuturesPositionsList positions={positions} />
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
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  card: {
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
  },
});
