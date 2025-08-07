import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, Button, IconButton } from 'react-native-paper';
import { Investment } from '../types/Investment';

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
  return (
    <Card style={styles.card} onPress={() => onInvestmentClick(investment)}>
      <Card.Title
        title={investment.name}
        subtitle={investment.type}
        right={props => (
          <>
            <IconButton
              icon="pencil"
              onPress={() => onEditClick(investment)}
              {...props}
            />
            <IconButton
              icon="delete"
              onPress={() => onDeleteClick(investment)}
              {...props}
            />
            <IconButton
              icon="cash-refund"
              onPress={() => onLiquidateClick(investment)}
              {...props}
            />
          </>
        )}
      />
      <Card.Content>
        <Text variant="bodyMedium">
          Amount: ${investment.amount.toFixed(2)}
        </Text>
        {investment.description ? (
          <Text variant="bodySmall">{investment.description}</Text>
        ) : null}
        <Text variant="bodySmall">
          Date: {new Date(investment.date).toLocaleDateString()}
        </Text>
        <Text variant="bodySmall">
          Profit/Loss: {investment.profitLoss?.toFixed(2)}
        </Text>
        <Text variant="bodySmall">
          Current Value: {investment.currentValue?.toFixed(2)}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
});
