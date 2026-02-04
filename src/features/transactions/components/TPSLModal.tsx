import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Chip, Divider } from '@shared/components/ui';
import { PositionData } from '../types/BinanceApiModels';
import { formatCurrency, formatNumber } from '../utils/futuresCalculations';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';

interface TPSLModalProps {
  visible: boolean;
  position: PositionData | null;
  onDismiss: () => void;
  onConfirm: (takeProfit: number, stopLoss: number) => void;
  loading?: boolean;
}

export const TPSLModal: React.FC<TPSLModalProps> = ({ visible, position, onDismiss, onConfirm, loading = false }) => {
  const colors = useColors();
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  if (!position) return null;

  const isLong = position.positionAmount > 0;
  const currentPrice = position.markPrice;

  // Calculate suggested TP/SL prices
  const suggestedTP = isLong
    ? currentPrice * 1.05 // 5% above current price for long
    : currentPrice * 0.95; // 5% below current price for short

  const suggestedSL = isLong
    ? currentPrice * 0.95 // 5% below current price for long
    : currentPrice * 1.05; // 5% above current price for short

  const handleConfirm = () => {
    const tp = parseFloat(takeProfit);
    const sl = parseFloat(stopLoss);

    if (isNaN(tp) || isNaN(sl)) return;

    onConfirm(tp, sl);
  };

  const handleUseSuggested = () => {
    setTakeProfit(suggestedTP.toFixed(6));
    setStopLoss(suggestedSL.toFixed(6));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Card style={[styles.modal, { backgroundColor: colors.card }, shadow.xl]} variant="elevated">
          <CardHeader>
            <CardTitle>Set Take Profit & Stop Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.positionInfo}>
              <Text style={[styles.symbol, { color: colors.foreground }]}>{position.symbol}</Text>
              <Chip
                variant="filled"
                style={{
                  backgroundColor: isLong ? colors.income : colors.expense,
                  marginLeft: spacing[2],
                }}
              >
                <Text style={{ color: isLong ? colors.incomeForeground : colors.expenseForeground, fontWeight: 'bold' }}>
                  {isLong ? 'LONG' : 'SHORT'}
                </Text>
              </Chip>
            </View>

            <Text style={[styles.currentPrice, { color: colors.foreground }]}>
              Current Price: {formatCurrency(currentPrice)}
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.inputSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Take Profit Price</Text>
              <Input
                value={takeProfit}
                onChangeText={setTakeProfit}
                placeholder={formatCurrency(suggestedTP)}
                keyboardType="numeric"
                containerStyle={styles.input}
              />
              <Text style={[styles.suggestion, { color: colors.mutedForeground }]}>
                Suggested: {formatCurrency(suggestedTP)}
              </Text>
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stop Loss Price</Text>
              <Input
                value={stopLoss}
                onChangeText={setStopLoss}
                placeholder={formatCurrency(suggestedSL)}
                keyboardType="numeric"
                containerStyle={styles.input}
              />
              <Text style={[styles.suggestion, { color: colors.mutedForeground }]}>
                Suggested: {formatCurrency(suggestedSL)}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <Button variant="outline" onPress={handleUseSuggested} style={styles.button}>
                Use Suggested
              </Button>
              <Button variant="ghost" onPress={onDismiss} style={styles.button}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onPress={handleConfirm}
                loading={loading}
                disabled={!takeProfit || !stopLoss || loading}
                style={styles.button}
              >
                Confirm
              </Button>
            </View>
          </CardContent>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius['2xl'],
  },
  positionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  symbol: {
    ...textStyles.h4,
  },
  currentPrice: {
    ...textStyles.label,
    fontWeight: 'bold',
    marginBottom: spacing[4],
  },
  divider: {
    marginVertical: spacing[4],
  },
  inputSection: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    ...textStyles.label,
    fontWeight: '600',
    marginBottom: spacing[2],
  },
  input: {
    marginBottom: spacing[1],
  },
  suggestion: {
    ...textStyles.caption,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    gap: spacing[2],
  },
  button: {
    flex: 1,
  },
});
