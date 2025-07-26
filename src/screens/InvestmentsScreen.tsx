import React, { useEffect, useState, useCallback } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Button,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {
  fetchInvestments,
  addInvestment,
  updateInvestment,
  deleteInvestment,
} from '../data/investments';
import { Investment } from '../types/Investment';
import { InvestmentCard } from '../components/InvestmentCard';
import { InvestmentSummaryCard } from '../components/InvestmentSummaryCard';
import { InvestmentForm } from '../components/InvestmentForm';
import { FuturesTab } from './FuturesTab';

const Tab = createMaterialTopTabNavigator();

function InvestmentsTab() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showLiquidate, setShowLiquidate] = useState(false);
  const [selectedInvestment, setSelectedInvestment] =
    useState<Investment | null>(null);

  const loadInvestments = useCallback(async () => {
    setRefreshing(true);
    const data = await fetchInvestments();
    setInvestments(
      data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Investments</Text>
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          style={styles.addBtn}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
      <InvestmentSummaryCard investments={investments} />
      <FlatList
        data={investments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <InvestmentCard
            investment={item}
            onInvestmentClick={setSelectedInvestment}
            onEditClick={inv => {
              setSelectedInvestment(inv);
              setShowEdit(true);
            }}
            onDeleteClick={inv => {
              setSelectedInvestment(inv);
              setShowDelete(true);
            }}
            onLiquidateClick={inv => {
              setSelectedInvestment(inv);
              setShowLiquidate(true);
            }}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No investments found.</Text>
        }
        refreshing={refreshing}
        onRefresh={loadInvestments}
      />
      {/* Add Investment Dialog */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <InvestmentForm
              submitLabel="Add"
              onSubmit={async values => {
                await addInvestment(values);
                setShowAdd(false);
                loadInvestments();
              }}
              onCancel={() => setShowAdd(false)}
            />
          </View>
        </View>
      </Modal>
      {/* Edit Investment Dialog */}
      <Modal
        visible={showEdit && !!selectedInvestment}
        transparent
        animationType="slide"
      >
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <InvestmentForm
              initial={selectedInvestment || {}}
              submitLabel="Update"
              onSubmit={async values => {
                if (selectedInvestment) {
                  await updateInvestment({ ...selectedInvestment, ...values });
                  setShowEdit(false);
                  setSelectedInvestment(null);
                  loadInvestments();
                }
              }}
              onCancel={() => {
                setShowEdit(false);
                setSelectedInvestment(null);
              }}
            />
          </View>
        </View>
      </Modal>
      {/* Delete Investment Dialog */}
      <Modal
        visible={showDelete && !!selectedInvestment}
        transparent
        animationType="slide"
      >
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text>
              Are you sure you want to delete "{selectedInvestment?.name}"?
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <Button
                title="Delete"
                color="#e74c3c"
                onPress={async () => {
                  if (selectedInvestment) {
                    await deleteInvestment(selectedInvestment.id);
                    setShowDelete(false);
                    setSelectedInvestment(null);
                    loadInvestments();
                  }
                }}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setShowDelete(false);
                  setSelectedInvestment(null);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* Liquidate Investment Dialog */}
      <Modal
        visible={showLiquidate && !!selectedInvestment}
        transparent
        animationType="slide"
      >
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text>
              Liquidate "{selectedInvestment?.name}" (TODO: implement logic)
            </Text>
            <Button
              title="Close"
              onPress={() => {
                setShowLiquidate(false);
                setSelectedInvestment(null);
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}



export const InvestmentsScreen: React.FC = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Investments" component={InvestmentsTab} />
      <Tab.Screen name="Futures" component={FuturesTab} />
    </Tab.Navigator>
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
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 250,
    alignItems: 'center',
  },
});
