import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, CardHeader, CardContent, Input, Button, Select, SelectOption } from '@shared/components/ui';
import { TransactionCategories } from '@features/transactions/config/TransactionCategories';
import { useAddTransaction, useInvestments, useUpdateInvestment } from '@shared/hooks/useTransactionsQueries';
import { logger } from '@shared/utils/logger';
import { Investment } from '@features/transactions/types/Investment';
import { InvestmentCategories } from '@features/transactions/config/InvestmentCategories';

export const TransactionForm: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedInvestmentType, setSelectedInvestmentType] = useState('');
  const [showInvestmentPicker, setShowInvestmentPicker] = useState(false);
  const [pendingIsIncome, setPendingIsIncome] = useState<boolean>(false);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [pendingDescription, setPendingDescription] = useState<string>('');

  // TanStack Query mutations and queries
  const addTransactionMutation = useAddTransaction();
  const updateInvestmentMutation = useUpdateInvestment();
  const { data: investmentOptions = [] } = useInvestments();

  // Get categories for Select component
  const categoryOptions: SelectOption<string>[] = TransactionCategories.CATEGORIES.map((category) => {
    const iconData =
      TransactionCategories.CATEGORY_ICONS[category as keyof typeof TransactionCategories.CATEGORY_ICONS];
    return {
      label: category,
      value: category,
      icon: iconData?.name,
    };
  });

  // Investment type options for Select component
  const investmentTypeOptions: SelectOption<string>[] = InvestmentCategories.TYPES.map((type) => ({
    label: type,
    value: type,
    icon: 'trending-up',
  }));

  const isSubmitting = addTransactionMutation.isPending || updateInvestmentMutation.isPending;

  const handleAddTransaction = async (isIncome: boolean) => {
    // Exact validation logic from Kotlin app
    if (!amount.trim() || !selectedCategory.trim()) {
      Alert.alert('Error', 'Please enter both amount and category');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // If category is Investment, prompt to choose an investment and then adjust the investment amount
    if (selectedCategory === 'Investment') {
      setPendingIsIncome(isIncome);
      setPendingAmount(amountValue);
      setPendingDescription(description.trim() || '');
      setShowInvestmentPicker(true);
      return;
    }

    // Regular non-investment flow using TanStack Query mutation
    try {
      await addTransactionMutation.mutateAsync({
        amount: amountValue,
        type: isIncome ? 'income' : 'expense',
        description: description.trim() || '',
        date: new Date().toISOString(),
        category: selectedCategory,
        isIncome,
      });

      // Clear form
      resetForm();
    } catch (error) {
      logger.error('Error adding transaction', error, 'TransactionForm');
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const handleSelectInvestment = async (investment: Investment) => {
    // Following Kotlin logic:
    // - If income: add income transaction and DECREASE investment amount by value
    // - If expense: add expense transaction and INCREASE investment amount by value
    try {
      // Build description string
      const txDescription = pendingIsIncome
        ? pendingDescription
          ? `Return from investment: ${investment.name} - ${pendingDescription}`
          : `Return from investment: ${investment.name}`
        : pendingDescription
          ? `Investment in ${investment.name} - ${pendingDescription}`
          : `Investment in ${investment.name}`;

      // 1) Add the transaction using mutation
      await addTransactionMutation.mutateAsync({
        amount: pendingAmount,
        type: pendingIsIncome ? 'income' : 'expense',
        description: selectedInvestmentType ? `${txDescription} [${selectedInvestmentType}]` : txDescription,
        date: new Date().toISOString(),
        category: investment.type,
        isIncome: pendingIsIncome,
      });

      // 2) Adjust the investment amount
      const adjustedAmount = pendingIsIncome
        ? investment.amount - pendingAmount // income -> deduct from investment
        : investment.amount + pendingAmount; // expense -> add to investment

      await updateInvestmentMutation.mutateAsync({
        ...investment,
        amount: adjustedAmount,
        currentValue: typeof investment.currentValue === 'number' ? investment.currentValue : adjustedAmount,
      });

      // Clean up UI state
      setShowInvestmentPicker(false);
      resetForm();
    } catch (error) {
      logger.error('Error applying investment transaction', error, 'TransactionForm');
      Alert.alert('Error', 'Failed to apply investment change');
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setSelectedCategory('');
    setSelectedInvestmentType('');
    setPendingAmount(0);
    setPendingDescription('');
  };

  const formatCurrency = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');

    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }

    return numericValue;
  };

  return (
    <Card variant="elevated" style={styles.card}>
      <CardHeader>
        <Text style={styles.title}>Add Transaction</Text>
      </CardHeader>

      <CardContent style={styles.formContainer}>
        <Input
          label="Amount"
          placeholder="Enter amount"
          value={amount}
          onChangeText={(text) => setAmount(formatCurrency(text))}
          keyboardType="numeric"
          editable={!isSubmitting}
          containerStyle={styles.inputContainer}
        />

        <Select
          label="Category"
          placeholder="Select category"
          options={categoryOptions}
          value={selectedCategory}
          onChange={setSelectedCategory}
          disabled={isSubmitting}
        />

        {/* Investment Sub-Category Select */}
        {selectedCategory === 'Investment' && (
          <Select
            label="Investment Type"
            placeholder="Select investment type (Stock, Crypto, ...)"
            options={investmentTypeOptions}
            value={selectedInvestmentType}
            onChange={setSelectedInvestmentType}
            disabled={isSubmitting}
          />
        )}

        <Input
          label="Description"
          placeholder="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
          editable={!isSubmitting}
          containerStyle={styles.inputContainer}
        />

        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            onPress={() => handleAddTransaction(true)}
            disabled={isSubmitting}
            loading={isSubmitting && pendingIsIncome}
            style={[styles.button, styles.incomeButton]}
          >
            Income
          </Button>

          <Button
            variant="destructive"
            onPress={() => handleAddTransaction(false)}
            disabled={isSubmitting}
            loading={isSubmitting && !pendingIsIncome}
            style={styles.button}
          >
            Expense
          </Button>
        </View>
      </CardContent>

      {/* Investment Picker Modal - keeping the custom modal for investment selection */}
      <Modal
        visible={showInvestmentPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvestmentPicker(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowInvestmentPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Investment</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator>
              {investmentOptions.map((inv) => (
                <TouchableOpacity key={inv.id} style={styles.modalItem} onPress={() => handleSelectInvestment(inv)}>
                  <Ionicons name="trending-up" size={24} color="#2196F3" style={styles.modalItemIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemText}>
                      {inv.name} ({inv.type})
                    </Text>
                    <Text style={{ color: '#666', fontSize: 12 }}>Amount: {inv.amount}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    gap: 8,
  },
  inputContainer: {
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  incomeButton: {
    backgroundColor: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 44,
    backgroundColor: '#fff',
  },
  modalItemIcon: {
    marginRight: 10,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
});
