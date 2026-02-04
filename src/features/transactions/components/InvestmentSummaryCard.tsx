import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Card, CardHeader, CardTitle, CardContent } from '@shared/components/ui';
import { Investment } from '../types/Investment';
import { useColors, textStyles, spacing } from '@shared/theme';

interface InvestmentSummaryCardProps {
  investments: Investment[];
}

export const InvestmentSummaryCard: React.FC<InvestmentSummaryCardProps> = ({ investments }) => {
  const colors = useColors();
  const total = investments.reduce((sum, i) => sum + i.amount, 0);
  const profitLoss = investments.reduce((sum, i) => sum + (i.profitLoss || 0), 0);
  const currentValue = investments.reduce((sum, i) => sum + (i.currentValue || 0), 0);
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

  return (
    <Card variant="elevated" style={styles.card}>
      <CardHeader>
        <CardTitle>Investment Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={[textStyles.label, { color: colors.foregroundMuted }]}>Total Invested</Text>
            <Text style={[textStyles.h4, { color: colors.foreground }]}>{formatCurrency(total)}</Text>
          </View>
          <View style={styles.column}>
            <Text style={[textStyles.label, { color: colors.foregroundMuted }]}>Profit/Loss</Text>
            <Text style={[textStyles.h4, { color: profitLoss >= 0 ? colors.success : colors.destructive }]}>
              {formatCurrency(profitLoss)}
            </Text>
          </View>
          <View style={styles.column}>
            <Text style={[textStyles.label, { color: colors.foregroundMuted }]}>Current Value</Text>
            <Text style={[textStyles.h4, { color: colors.foreground }]}>{formatCurrency(currentValue)}</Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[4],
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    alignItems: 'center',
    flex: 1,
  },
});
