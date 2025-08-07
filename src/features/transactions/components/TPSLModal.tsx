import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Chip,
  Divider,
} from 'react-native-paper';
import { PositionData } from '../types/BinanceApiModels';
import { formatCurrency, formatNumber } from '../utils/futuresCalculations';

interface TPSLModalProps {
  visible: boolean;
  position: PositionData | null;
  onDismiss: () => void;
  onConfirm: (takeProfit: number, stopLoss: number) => void;
  loading?: boolean;
}

export const TPSLModal: React.FC<TPSLModalProps> = ({
  visible,
  position,
  onDismiss,
  onConfirm,
  loading = false,
}) => {
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onDismiss={onDismiss}
    >
      <View style={styles.overlay}>
        <Card style={styles.modal}>
          <Card.Title title="Set Take Profit & Stop Loss" />
          <Card.Content>
            <View style={styles.positionInfo}>
              <Text variant="titleMedium">{position.symbol}</Text>
              <Chip 
                mode="outlined" 
                style={{ 
                  backgroundColor: isLong ? '#4CAF50' : '#F44336',
                  marginLeft: 8 
                }}
                textStyle={{ color: 'white' }}
              >
                {isLong ? 'LONG' : 'SHORT'}
              </Chip>
            </View>
            
            <Text style={styles.currentPrice}>
              Current Price: {formatCurrency(currentPrice)}
            </Text>
            
            <Divider style={styles.divider} />
            
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Take Profit Price</Text>
              <TextInput
                mode="outlined"
                value={takeProfit}
                onChangeText={setTakeProfit}
                placeholder={formatCurrency(suggestedTP)}
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.suggestion}>
                Suggested: {formatCurrency(suggestedTP)}
              </Text>
            </View>
            
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Stop Loss Price</Text>
              <TextInput
                mode="outlined"
                value={stopLoss}
                onChangeText={setStopLoss}
                placeholder={formatCurrency(suggestedSL)}
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.suggestion}>
                Suggested: {formatCurrency(suggestedSL)}
              </Text>
            </View>
            
            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={handleUseSuggested}
                style={styles.button}
              >
                Use Suggested
              </Button>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirm}
                loading={loading}
                disabled={!takeProfit || !stopLoss || loading}
                style={styles.button}
              >
                Confirm
              </Button>
            </View>
          </Card.Content>
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
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
  },
  positionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  inputSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    marginBottom: 4,
  },
  suggestion: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
}); 