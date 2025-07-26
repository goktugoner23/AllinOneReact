import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Investment } from '../types/Investment';

interface InvestmentSummaryCardProps {
  investments: Investment[];
}

export const InvestmentSummaryCard: React.FC<InvestmentSummaryCardProps> = ({
  investments,
}) => {
  const total = investments.reduce((sum, i) => sum + i.amount, 0);
  const profitLoss = investments.reduce(
    (sum, i) => sum + (i.profitLoss || 0),
    0,
  );
  const currentValue = investments.reduce(
    (sum, i) => sum + (i.currentValue || 0),
    0,
  );

  return (
    <Card style={styles.card}>
      <Card.Title title="Investment Summary" />
      <Card.Content>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text variant="labelLarge">Total Invested</Text>
            <Text variant="titleMedium">${total.toFixed(2)}</Text>
          </View>
          <View style={styles.column}>
            <Text variant="labelLarge">Profit/Loss</Text>
            <Text
              variant="titleMedium"
              style={{ color: profitLoss >= 0 ? '#2ecc71' : '#e74c3c' }}
            >
              {profitLoss.toFixed(2)}
            </Text>
          </View>
          <View style={styles.column}>
            <Text variant="labelLarge">Current Value</Text>
            <Text variant="titleMedium">${currentValue.toFixed(2)}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
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
