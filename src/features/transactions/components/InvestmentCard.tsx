import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle, Button, IconButton } from '@shared/components/ui';
import { Investment } from '../types/Investment';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';

interface InvestmentCardProps {
  investment: Investment;
  onInvestmentClick: (investment: Investment) => void;
  onDeleteClick: (investment: Investment) => void;
  onEditClick: (investment: Investment) => void;
  onLiquidateClick: (investment: Investment) => void;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({
  investment,
  onInvestmentClick,
  onDeleteClick,
  onEditClick,
  onLiquidateClick,
}) => {
  const colors = useColors();
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

  return (
    <Card
      style={[styles.card, { backgroundColor: colors.card }, shadow.sm]}
      variant="elevated"
      onPress={() => onInvestmentClick(investment)}
    >
      <CardHeader style={styles.cardHeader}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.foreground }]}>{investment.name}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{investment.type}</Text>
        </View>
        <View style={styles.actionsSection}>
          <IconButton
            icon="pencil-outline"
            size="sm"
            variant="ghost"
            onPress={() => onEditClick(investment)}
          />
          <IconButton
            icon="trash-outline"
            size="sm"
            variant="ghost"
            onPress={() => onDeleteClick(investment)}
          />
          <IconButton
            icon="cash-outline"
            size="sm"
            variant="ghost"
            onPress={() => onLiquidateClick(investment)}
          />
        </View>
      </CardHeader>
      <CardContent>
        <Text style={[styles.amount, { color: colors.investment }]}>
          Amount: {formatCurrency(investment.amount)}
        </Text>
        {investment.description ? (
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{investment.description}</Text>
        ) : null}
        <Text style={[styles.date, { color: colors.foregroundSubtle }]}>
          Date: {new Date(investment.date).toLocaleDateString()}
        </Text>
        <Text style={[styles.profitLoss, { color: (investment.profitLoss || 0) >= 0 ? colors.income : colors.expense }]}>
          Profit/Loss: {formatCurrency(investment.profitLoss || 0)}
        </Text>
        <Text style={[styles.currentValue, { color: colors.foreground }]}>
          Current Value: {formatCurrency(investment.currentValue || 0)}
        </Text>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[4],
    borderRadius: radius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    ...textStyles.h4,
  },
  subtitle: {
    ...textStyles.bodySmall,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  amount: {
    ...textStyles.body,
    marginBottom: spacing[1],
  },
  description: {
    ...textStyles.bodySmall,
    marginBottom: spacing[1],
  },
  date: {
    ...textStyles.bodySmall,
    marginBottom: spacing[1],
  },
  profitLoss: {
    ...textStyles.bodySmall,
    marginBottom: spacing[1],
  },
  currentValue: {
    ...textStyles.bodySmall,
  },
});
