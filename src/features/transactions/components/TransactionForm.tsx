import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Card,
  CardHeader,
  CardContent,
  Input,
  Button,
  Select,
  SelectOption,
  SegmentedControl,
} from '@shared/components/ui';
import { TransactionCategories } from '@features/transactions/config/TransactionCategories';
import { useAddTransaction, useInvestments, useUpdateInvestment } from '@shared/hooks/useTransactionsQueries';
import { logger } from '@shared/utils/logger';
import { Investment } from '@features/transactions/types/Investment';
import { InvestmentCategories } from '@features/transactions/config/InvestmentCategories';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';

type TransactionType = 'income' | 'expense';

export const TransactionForm: React.FC = () => {
  const colors = useColors();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedInvestmentType, setSelectedInvestmentType] = useState('');
  const [showInvestmentPicker, setShowInvestmentPicker] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
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

  const handleAddTransaction = async () => {
    const isIncome = transactionType === 'income';

    // Validation
    if (!amount.trim() || !selectedCategory.trim()) {
      Alert.alert('Error', 'Please enter both amount and category');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // If category is Investment, prompt to choose an investment
    if (selectedCategory === 'Investment') {
      setPendingAmount(amountValue);
      setPendingDescription(description.trim() || '');
      setShowInvestmentPicker(true);
      return;
    }

    // Regular non-investment flow
    try {
      await addTransactionMutation.mutateAsync({
        amount: amountValue,
        type: isIncome ? 'income' : 'expense',
        description: description.trim() || '',
        date: new Date().toISOString(),
        category: selectedCategory,
        isIncome,
      });
      resetForm();
    } catch (error) {
      logger.error('Error adding transaction', error, 'TransactionForm');
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const handleSelectInvestment = async (investment: Investment) => {
    const isIncome = transactionType === 'income';

    try {
      const txDescription = isIncome
        ? pendingDescription
          ? `Return from investment: ${investment.name} - ${pendingDescription}`
          : `Return from investment: ${investment.name}`
        : pendingDescription
          ? `Investment in ${investment.name} - ${pendingDescription}`
          : `Investment in ${investment.name}`;

      await addTransactionMutation.mutateAsync({
        amount: pendingAmount,
        type: isIncome ? 'income' : 'expense',
        description: selectedInvestmentType ? `${txDescription} [${selectedInvestmentType}]` : txDescription,
        date: new Date().toISOString(),
        category: investment.type,
        isIncome,
      });

      const adjustedAmount = isIncome ? investment.amount - pendingAmount : investment.amount + pendingAmount;

      await updateInvestmentMutation.mutateAsync({
        ...investment,
        amount: adjustedAmount,
        currentValue: typeof investment.currentValue === 'number' ? investment.currentValue : adjustedAmount,
      });

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
    const numericValue = value.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return numericValue;
  };

  // Quick amount buttons
  const quickAmounts = [50, 100, 250, 500, 1000];

  return (
    <Card variant="elevated" style={styles.card}>
      <CardHeader style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Add Transaction</Text>
      </CardHeader>

      <CardContent style={styles.formContainer}>
        {/* Transaction Type Segmented Control */}
        <SegmentedControl
          options={[
            {
              value: 'expense' as TransactionType,
              label: 'Expense',
              icon: (
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={transactionType === 'expense' ? colors.expense : colors.mutedForeground}
                />
              ),
            },
            {
              value: 'income' as TransactionType,
              label: 'Income',
              icon: (
                <Ionicons
                  name="arrow-down-circle"
                  size={16}
                  color={transactionType === 'income' ? colors.income : colors.mutedForeground}
                />
              ),
            },
          ]}
          value={transactionType}
          onChange={setTransactionType}
          fullWidth
          style={styles.segmentedControl}
        />

        {/* Amount Input */}
        <View style={styles.amountSection}>
          <Input
            label="Amount"
            placeholder="0.00"
            value={amount}
            onChangeText={(text) => setAmount(formatCurrency(text))}
            keyboardType="numeric"
            editable={!isSubmitting}
            containerStyle={styles.amountInput}
            leftIcon={<Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>₺</Text>}
          />

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {quickAmounts.map((quickAmount) => (
              <Pressable
                key={quickAmount}
                onPress={() => setAmount(quickAmount.toString())}
                style={({ pressed }) => [
                  styles.quickAmountBtn,
                  { backgroundColor: colors.muted },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.quickAmountText, { color: colors.foreground }]}>₺{quickAmount}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Category Select */}
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
            placeholder="Select investment type"
            options={investmentTypeOptions}
            value={selectedInvestmentType}
            onChange={setSelectedInvestmentType}
            disabled={isSubmitting}
          />
        )}

        {/* Description Input */}
        <Input
          label="Description"
          placeholder="Add a note (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={2}
          editable={!isSubmitting}
          containerStyle={styles.descriptionInput}
        />

        {/* Submit Button */}
        <Button
          variant={transactionType === 'income' ? 'success' : 'destructive'}
          onPress={handleAddTransaction}
          disabled={isSubmitting}
          loading={isSubmitting}
          fullWidth
          size="lg"
        >
          {transactionType === 'income' ? 'Add Income' : 'Add Expense'}
        </Button>
      </CardContent>

      {/* Investment Picker Modal */}
      <Modal
        visible={showInvestmentPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInvestmentPicker(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
          onPress={() => setShowInvestmentPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }, shadow.xl]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Investment</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator>
              {investmentOptions.map((inv) => (
                <TouchableOpacity
                  key={inv.id}
                  style={[styles.modalItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleSelectInvestment(inv)}
                >
                  <View style={[styles.modalItemIcon, { backgroundColor: colors.investmentMuted }]}>
                    <Ionicons name="trending-up" size={20} color={colors.investment} />
                  </View>
                  <View style={styles.modalItemContent}>
                    <Text style={[styles.modalItemText, { color: colors.foreground }]}>{inv.name}</Text>
                    <Text style={[styles.modalItemSubtext, { color: colors.mutedForeground }]}>
                      {inv.type} • ₺{inv.amount.toLocaleString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing[2],
  },
  header: {
    marginBottom: spacing[2],
  },
  title: {
    ...textStyles.h4,
  },
  formContainer: {
    gap: spacing[3],
  },
  segmentedControl: {
    marginBottom: spacing[2],
  },
  amountSection: {
    gap: spacing[2],
  },
  amountInput: {
    marginBottom: 0,
  },
  currencySymbol: {
    ...textStyles.body,
    fontWeight: '600',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  quickAmountBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.md,
  },
  quickAmountText: {
    ...textStyles.caption,
    fontWeight: '600',
  },
  descriptionInput: {
    marginBottom: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalContent: {
    borderRadius: radius.xl,
    padding: spacing[4],
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    ...textStyles.h4,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    gap: spacing[3],
  },
  modalItemIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    ...textStyles.body,
    fontWeight: '500',
  },
  modalItemSubtext: {
    ...textStyles.caption,
    marginTop: 2,
  },
});
