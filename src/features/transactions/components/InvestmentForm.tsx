import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Input, Button } from '@shared/components/ui';
import { Investment } from '../types/Investment';
import { useColors, spacing, textStyles, radius } from '@shared/theme';

interface InvestmentFormProps {
  initial?: Partial<Investment>;
  onSubmit: (values: Omit<Investment, 'id'>) => void;
  onCancel: () => void;
  submitLabel: string;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({ initial = {}, onSubmit, onCancel, submitLabel }) => {
  const colors = useColors();
  const [name, setName] = useState(initial.name || '');
  const [amount, setAmount] = useState(initial.amount?.toString() || '');
  const [type, setType] = useState(initial.type || '');
  const [description, setDescription] = useState(initial.description || '');
  const [imageUri, setImageUri] = useState(initial.imageUri || '');
  const [date, setDate] = useState(
    initial.date ? new Date(initial.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  );
  const [profitLoss, setProfitLoss] = useState(initial.profitLoss?.toString() || '0');
  const [currentValue, setCurrentValue] = useState(initial.currentValue?.toString() || '0');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!name.trim()) return setError('Name is required');
    if (!amount || isNaN(Number(amount))) return setError('Amount must be a number');
    if (!type.trim()) return setError('Type is required');
    setError('');
    onSubmit({
      name: name.trim(),
      amount: Number(amount),
      type: type.trim(),
      description: description.trim(),
      imageUri: imageUri.trim(),
      date: new Date(date).toISOString(),
      isPast: false,
      profitLoss: Number(profitLoss),
      currentValue: Number(currentValue),
    });
  }

  return (
    <ScrollView contentContainerStyle={[styles.form, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>{submitLabel} Investment</Text>
      <Input
        label="Name*"
        value={name}
        onChangeText={setName}
        containerStyle={styles.input}
      />
      <Input
        label="Amount*"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        containerStyle={styles.input}
      />
      <Input
        label="Type*"
        value={type}
        onChangeText={setType}
        containerStyle={styles.input}
      />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        containerStyle={styles.input}
      />
      <Input
        label="Image URI"
        value={imageUri}
        onChangeText={setImageUri}
        containerStyle={styles.input}
      />
      <Input
        label="Date"
        value={date}
        onChangeText={setDate}
        containerStyle={styles.input}
      />
      <Input
        label="Profit/Loss"
        value={profitLoss}
        onChangeText={setProfitLoss}
        keyboardType="numeric"
        containerStyle={styles.input}
      />
      <Input
        label="Current Value"
        value={currentValue}
        onChangeText={setCurrentValue}
        keyboardType="numeric"
        containerStyle={styles.input}
      />
      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}
      <View style={styles.buttonRow}>
        <Button variant="primary" onPress={handleSubmit} style={styles.button}>
          {submitLabel}
        </Button>
        <Button variant="outline" onPress={onCancel} style={styles.button}>
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: spacing[3],
    borderRadius: radius.lg,
    minWidth: 250,
  },
  title: {
    ...textStyles.h4,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing[2],
  },
  errorText: {
    ...textStyles.bodySmall,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  button: {
    flex: 1,
    marginHorizontal: spacing[1],
  },
});
