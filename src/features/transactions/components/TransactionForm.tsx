import React, { useState, useMemo } from 'react';
import { View, Text, Alert, ScrollView, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, CardHeader, CardContent, Input } from '@shared/components/ui';
import { Dropdown, DropdownItem } from '@shared/components/Dropdown';
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
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [pendingDescription, setPendingDescription] = useState<string>('');
  const [pendingType, setPendingType] = useState<TransactionType>('expense');

  // TanStack Query mutations and queries
  const addTransactionMutation = useAddTransaction();
  const updateInvestmentMutation = useUpdateInvestment();
  const { data: investmentOptions = [] } = useInvestments();

  // Get categories for Dropdown component
  const categoryItems: DropdownItem[] = useMemo(
    () =>
      TransactionCategories.CATEGORIES.map((category) => {
        const iconData =
          TransactionCategories.CATEGORY_ICONS[category as keyof typeof TransactionCategories.CATEGORY_ICONS];
        return {
          label: category,
          value: category,
          icon: iconData?.name ? (
            <Ionicons name={iconData.name} size={20} color={iconData.color || colors.mutedForeground} />
          ) : undefined,
        };
      }),
    [colors.mutedForeground],
  );

  // Investment type options for Dropdown component
  const investmentTypeItems: DropdownItem[] = useMemo(
    () =>
      InvestmentCategories.TYPES.map((type) => ({
        label: type,
        value: type,
        icon: <Ionicons name="trending-up" size={20} color={colors.investment} />,
      })),
    [colors.investment],
  );

  const isSubmitting = addTransactionMutation.isPending || updateInvestmentMutation.isPending;

  const handleSubmit = async (type: TransactionType) => {
    const isIncome = type === 'income';

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
      setPendingType(type);
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
    const isIncome = pendingType === 'income';

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

  return (
    <Card variant="elevated" style={styles.card}>
      <CardHeader style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Add Transaction</Text>
      </CardHeader>

      <CardContent style={styles.formContainer}>
        {/* Amount Input */}
        <Input
          label="Amount"
          placeholder="0"
          value={amount}
          onChangeText={(text) => setAmount(formatCurrency(text))}
          keyboardType="numeric"
          editable={!isSubmitting}
          leftIcon={<Text style={[styles.currencySymbol, { color: colors.mutedForeground }]}>₺</Text>}
        />

        {/* Submit Buttons - Expense (Red) / Income (Green) */}
        <View style={styles.typeButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              {
                backgroundColor: colors.expense,
                borderColor: colors.expense,
              },
            ]}
            onPress={() => handleSubmit('expense')}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-up-circle" size={20} color={colors.expenseForeground} />
            <Text style={[styles.typeButtonText, { color: colors.expenseForeground }]}>
              Expense
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              {
                backgroundColor: colors.income,
                borderColor: colors.income,
              },
            ]}
            onPress={() => handleSubmit('income')}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-down-circle" size={20} color={colors.incomeForeground} />
            <Text style={[styles.typeButtonText, { color: colors.incomeForeground }]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Dropdown */}
        <View>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>Category</Text>
          <Dropdown
            items={categoryItems}
            selectedValue={selectedCategory}
            onValueChange={setSelectedCategory}
            placeholder="Select category"
            disabled={isSubmitting}
          />
        </View>

        {/* Investment Sub-Category Dropdown */}
        {selectedCategory === 'Investment' && (
          <View>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Investment Type</Text>
            <Dropdown
              items={investmentTypeItems}
              selectedValue={selectedInvestmentType}
              onValueChange={setSelectedInvestmentType}
              placeholder="Select investment type"
              disabled={isSubmitting}
            />
          </View>
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
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  typeButtonText: {
    ...textStyles.body,
    fontWeight: '600',
  },
  currencySymbol: {
    ...textStyles.body,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
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
