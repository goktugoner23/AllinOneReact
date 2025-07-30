import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Card, Button, Chip, Divider } from 'react-native-paper';
import { fetchInvestments, addInvestment, updateInvestment, deleteInvestment } from '../data/investments';
import { Investment } from '../types/Investment';

// Binance API types
interface BinancePosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  marginType: string;
  isolatedMargin: string;
  isAutoAddMargin: string;
  positionSide: string;
  notional: string;
  isolatedWallet: string;
  updateTime: number;
}

interface BinanceBalance {
  asset: string;
  walletBalance: string;
  unrealizedProfit: string;
  marginBalance: string;
  maintMargin: string;
  initialMargin: string;
  positionInitialMargin: string;
  openOrderInitialMargin: string;
  maxWithdrawAmount: string;
  crossWalletBalance: string;
  crossUnPnl: string;
  availableBalance: string;
}

interface BinanceAccount {
  feeTier: number;
  canTrade: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;
  updateTime: number;
  totalInitialMargin: string;
  totalMaintMargin: string;
  totalWalletBalance: string;
  totalUnrealizedProfit: string;
  totalMarginBalance: string;
  totalPositionInitialMargin: string;
  totalOpenOrderInitialMargin: string;
  totalCrossWalletBalance: string;
  totalCrossUnPnl: string;
  availableBalance: string;
  maxWithdrawAmount: string;
  assets: BinanceBalance[];
  positions: BinancePosition[];
}

// External API client
const EXTERNAL_API_BASE = 'http://129.212.143.6';

class BinanceApiClient {
  static async getFuturesAccount(): Promise<BinanceAccount> {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE}/api/binance/futures/account`);
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch account data');
      }
    } catch (error) {
      console.error('Error fetching futures account:', error);
      throw error;
    }
  }

  static async getFuturesPositions(): Promise<BinancePosition[]> {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE}/api/binance/futures/positions`);
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch positions');
      }
    } catch (error) {
      console.error('Error fetching futures positions:', error);
      throw error;
    }
  }

  static async getFuturesBalance(asset: string = 'USDT'): Promise<BinanceBalance> {
    try {
      const response = await fetch(`${EXTERNAL_API_BASE}/api/binance/futures/balance/${asset}`);
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to fetch balance');
      }
    } catch (error) {
      console.error('Error fetching futures balance:', error);
      throw error;
    }
  }
}

function InvestmentsTab() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [liquidateDialogVisible, setLiquidateDialogVisible] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', amount: '', type: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  const loadInvestments = async () => {
    try {
      const data = await fetchInvestments();
      setInvestments(data);
    } catch (error) {
      console.error('Error loading investments:', error);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvestments();
    setRefreshing(false);
  };

  const handleLongPress = (investment: Investment) => {
    setSelectedInvestment(investment);
    setActionModalVisible(true);
  };

  const handleEdit = () => {
    if (selectedInvestment) {
      setEditForm({
        name: selectedInvestment.name,
        amount: selectedInvestment.amount.toString(),
        type: selectedInvestment.type,
        description: selectedInvestment.description || '',
      });
      setEditModalVisible(true);
    }
    setActionModalVisible(false);
  };

  const handleDelete = () => {
    setDeleteDialogVisible(true);
    setActionModalVisible(false);
  };

  const handleLiquidate = () => {
    setLiquidateDialogVisible(true);
    setActionModalVisible(false);
  };

  const confirmDelete = async () => {
    if (selectedInvestment) {
      try {
        await deleteInvestment(selectedInvestment.id);
        setDeleteDialogVisible(false);
        setSelectedInvestment(null);
        loadInvestments();
        Alert.alert('Deleted', 'Investment deleted successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to delete investment');
      }
    }
  };

  const confirmLiquidate = async () => {
    if (selectedInvestment) {
      try {
        await deleteInvestment(selectedInvestment.id); // Same as delete, but different message
        setLiquidateDialogVisible(false);
        setSelectedInvestment(null);
        loadInvestments();
        Alert.alert('Liquidated', 'Investment liquidated successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to liquidate investment');
      }
    }
  };

  const confirmEdit = async () => {
    if (selectedInvestment) {
      setIsSaving(true);
      try {
        await updateInvestment({
          ...selectedInvestment,
          name: editForm.name,
          amount: parseFloat(editForm.amount),
          type: editForm.type,
          description: editForm.description,
        });
        setEditModalVisible(false);
        setSelectedInvestment(null);
        loadInvestments();
        Alert.alert('Updated', 'Investment updated successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to update investment');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderInvestment = ({ item }: { item: Investment }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={300}
    >
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.name}</Text>
            <Chip mode="outlined" compact>
              {item.type}
            </Chip>
          </View>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          {item.description && <Text style={styles.description}>{item.description}</Text>}
          <Text style={styles.date}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
          {item.isPast && (
            <View style={styles.profitLossContainer}>
              <Text style={[styles.profitLoss, (item.profitLoss || 0) >= 0 ? styles.profit : styles.loss]}>
                {(item.profitLoss || 0) >= 0 ? '+' : ''}{formatCurrency(item.profitLoss || 0)}
              </Text>
              <Text style={styles.currentValue}>
                Current: {formatCurrency(item.currentValue || item.amount)}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Investments</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert('Add Investment', 'Add investment functionality coming soon')}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={investments}
        renderItem={renderInvestment}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No investments yet</Text>
        }
      />

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setActionModalVisible(false)}>
          <View style={styles.actionModal}>
            <TouchableOpacity style={styles.actionOption} onPress={handleEdit}>
              <Text style={styles.actionOptionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionOption} onPress={handleDelete}>
              <Text style={styles.actionOptionText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionOption} onPress={handleLiquidate}>
              <Text style={styles.actionOptionText}>Liquidate</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.editModal}>
            <Text style={styles.editTitle}>Edit Investment</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editForm.name}
              onChangeText={text => setEditForm(f => ({ ...f, name: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={editForm.amount}
              onChangeText={text => setEditForm(f => ({ ...f, amount: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Type"
              value={editForm.type}
              onChangeText={text => setEditForm(f => ({ ...f, type: text }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={editForm.description}
              onChangeText={text => setEditForm(f => ({ ...f, description: text }))}
            />
            <View style={styles.modalActions}>
              <Button mode="contained" onPress={confirmEdit} loading={isSaving} disabled={isSaving}>
                Save
              </Button>
              <Button mode="text" onPress={() => setEditModalVisible(false)} disabled={isSaving}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Dialog */}
      <Modal
        visible={deleteDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteDialogVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Delete Investment</Text>
            <Text style={styles.confirmText}>Are you sure you want to delete "{selectedInvestment?.name}"? This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <Button mode="contained" onPress={confirmDelete}>
                Delete
              </Button>
              <Button mode="text" onPress={() => setDeleteDialogVisible(false)}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Liquidate Dialog */}
      <Modal
        visible={liquidateDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLiquidateDialogVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Liquidate Investment</Text>
            <Text style={styles.confirmText}>Are you sure you want to liquidate "{selectedInvestment?.name}"? This will remove the investment without affecting your transaction history.</Text>
            <View style={styles.modalActions}>
              <Button mode="contained" onPress={confirmLiquidate}>
                Liquidate
              </Button>
              <Button mode="text" onPress={() => setLiquidateDialogVisible(false)}>
                Cancel
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FuturesTab() {
  const [positions, setPositions] = useState<BinancePosition[]>([]);
  const [account, setAccount] = useState<BinanceAccount | null>(null);
  const [balance, setBalance] = useState<BinanceBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFuturesData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch account data
      const accountData = await BinanceApiClient.getFuturesAccount();
      setAccount(accountData);

      // Fetch positions
      const positionsData = await BinanceApiClient.getFuturesPositions();
      setPositions(positionsData);

      // Fetch USDT balance
      const balanceData = await BinanceApiClient.getFuturesBalance('USDT');
      setBalance(balanceData);

    } catch (error) {
      console.error('Error loading futures data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load futures data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFuturesData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFuturesData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatNumber = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(num);
  };

  const getPositionSideColor = (positionSide: string) => {
    return positionSide === 'LONG' ? '#4CAF50' : '#F44336';
  };

  const renderPosition = ({ item }: { item: BinancePosition }) => {
    const positionAmount = parseFloat(item.positionAmt);
    const unrealizedProfit = parseFloat(item.unRealizedProfit);
    const isLong = positionAmount > 0;
    
    return (
      <Card style={styles.card} mode="outlined">
        <Card.Content>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.symbol}</Text>
            <Chip 
              mode="outlined" 
              compact
              style={{ backgroundColor: getPositionSideColor(item.positionSide) }}
              textStyle={{ color: 'white' }}
            >
              {item.positionSide}
            </Chip>
          </View>
          
          <View style={styles.positionDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Position Amount:</Text>
              <Text style={[styles.value, { color: getPositionSideColor(item.positionSide) }]}>
                {formatNumber(item.positionAmt)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Entry Price:</Text>
              <Text style={styles.value}>{formatCurrency(item.entryPrice)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Mark Price:</Text>
              <Text style={styles.value}>{formatCurrency(item.markPrice)}</Text>
        </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Leverage:</Text>
              <Text style={styles.value}>{item.leverage}x</Text>
          </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Margin Type:</Text>
              <Text style={styles.value}>{item.marginType}</Text>
        </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Notional:</Text>
              <Text style={styles.value}>{formatCurrency(item.notional)}</Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.profitLossContainer}>
            <Text style={styles.label}>Unrealized P&L:</Text>
            <Text style={[styles.profitLoss, unrealizedProfit >= 0 ? styles.profit : styles.loss]}>
              {unrealizedProfit >= 0 ? '+' : ''}{formatCurrency(unrealizedProfit)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading futures data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button onPress={loadFuturesData}>Retry</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Account Summary */}
      {account && (
        <Card style={styles.summaryCard} mode="outlined">
          <Card.Content>
            <Text style={styles.summaryTitle}>Account Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Total Balance:</Text>
              <Text style={styles.value}>{formatCurrency(account.totalWalletBalance)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Available Balance:</Text>
              <Text style={styles.value}>{formatCurrency(account.availableBalance)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Unrealized P&L:</Text>
              <Text style={[styles.value, parseFloat(account.totalUnrealizedProfit) >= 0 ? styles.profit : styles.loss]}>
                {parseFloat(account.totalUnrealizedProfit) >= 0 ? '+' : ''}{formatCurrency(account.totalUnrealizedProfit)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* USDT Balance */}
      {balance && (
        <Card style={styles.summaryCard} mode="outlined">
          <Card.Content>
            <Text style={styles.summaryTitle}>USDT Balance</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Wallet Balance:</Text>
              <Text style={styles.value}>{formatCurrency(balance.walletBalance)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Available:</Text>
              <Text style={styles.value}>{formatCurrency(balance.availableBalance)}</Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Positions */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Positions ({positions.length})</Text>
        </View>

      <FlatList
        data={positions.filter(p => parseFloat(p.positionAmt) !== 0)}
        renderItem={renderPosition}
        keyExtractor={(item) => `${item.symbol}-${item.positionSide}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard} mode="outlined">
            <Card.Content>
              <Text style={styles.emptyText}>No open positions</Text>
            </Card.Content>
          </Card>
        }
      />
    </View>
  );
}

export const InvestmentsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'investments' | 'futures'>('investments');

  return (
    <View style={styles.mainContainer}>
      {/* Custom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'investments' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('investments')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'investments' && styles.activeTabButtonText
          ]}>
            Investments
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'futures' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('futures')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'futures' && styles.activeTabButtonText
          ]}>
            Futures
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'investments' ? <InvestmentsTab /> : <FuturesTab />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#2ecc71',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 220,
    alignItems: 'center',
    elevation: 4,
  },
  actionOption: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  actionOptionText: {
    fontSize: 18,
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  editModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 260,
    alignItems: 'stretch',
    elevation: 4,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 260,
    alignItems: 'center',
    elevation: 4,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  profitLossContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  profitLoss: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profit: {
    color: '#4CAF50',
  },
  loss: {
    color: '#F44336',
  },
  currentValue: {
    fontSize: 14,
    color: '#666',
  },
  // Futures specific styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  positionDetails: {
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  emptyCard: {
    marginTop: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
  },
});
