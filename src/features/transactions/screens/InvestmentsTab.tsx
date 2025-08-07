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
import { fetchInvestments, addInvestment, updateInvestment, deleteInvestment } from '@features/transactions/services/investments';
import { Investment } from '@features/transactions/types/Investment';
import { FuturesTab } from './FuturesTab';



function InvestmentsContent() {
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
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
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
            <Chip mode="outlined">
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



export const InvestmentsTab: React.FC = () => {
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
        {activeTab === 'investments' ? <InvestmentsContent /> : <FuturesTab />}
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
    justifyContent: 'flex-end',
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

});
