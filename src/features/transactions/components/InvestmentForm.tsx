import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { Investment } from '../types/Investment';

interface InvestmentFormProps {
  initial?: Partial<Investment>;
  onSubmit: (values: Omit<Investment, 'id'>) => void;
  onCancel: () => void;
  submitLabel: string;
}

export const InvestmentForm: React.FC<InvestmentFormProps> = ({ initial = {}, onSubmit, onCancel, submitLabel }) => {
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
    <ScrollView contentContainerStyle={styles.form}>
      <Text variant="titleMedium" style={styles.title}>
        {submitLabel} Investment
      </Text>
      <TextInput label="Name*" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
      <TextInput
        label="Amount*"
        value={amount}
        onChangeText={setAmount}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput label="Type*" value={type} onChangeText={setType} mode="outlined" style={styles.input} />
      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        style={styles.input}
      />
      <TextInput label="Image URI" value={imageUri} onChangeText={setImageUri} mode="outlined" style={styles.input} />
      <TextInput label="Date" value={date} onChangeText={setDate} mode="outlined" style={styles.input} />
      <TextInput
        label="Profit/Loss"
        value={profitLoss}
        onChangeText={setProfitLoss}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        label="Current Value"
        value={currentValue}
        onChangeText={setCurrentValue}
        mode="outlined"
        style={styles.input}
        keyboardType="numeric"
      />
      {error ? (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      ) : null}
      <View style={styles.buttonRow}>
        <Button mode="contained" onPress={handleSubmit} style={styles.button}>
          {submitLabel}
        </Button>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Cancel
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  form: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 250,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
