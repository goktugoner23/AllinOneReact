import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors } from '@shared/theme';
import { PendingConfirmation } from '../types/GPT';

interface ConfirmationCardProps {
  confirmation: PendingConfirmation;
  onConfirm: (answer: string) => void;
  disabled?: boolean;
}

export default function ConfirmationCard({ confirmation, onConfirm, disabled }: ConfirmationCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.question, { color: colors.foreground }]}>{confirmation.question}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => onConfirm('Yes')}
          disabled={disabled}
        >
          <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.secondary }]}
          onPress={() => onConfirm('No')}
          disabled={disabled}
        >
          <Text style={[styles.btnText, { color: colors.secondaryForeground }]}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  question: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
