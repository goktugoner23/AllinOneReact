import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors } from '@shared/theme';
import { PendingChoice } from '../types/GPT';

interface UserChoiceCardProps {
  choice: PendingChoice;
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export default function UserChoiceCard({ choice, onSelect, disabled }: UserChoiceCardProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.question, { color: colors.foreground }]}>{choice.question}</Text>
      <View style={styles.options}>
        {choice.options.map((option, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.optionBtn, { borderColor: colors.primary, backgroundColor: colors.primaryMuted }]}
            onPress={() => onSelect(option)}
            disabled={disabled}
          >
            <Text style={[styles.optionText, { color: colors.primary }]}>{option}</Text>
          </TouchableOpacity>
        ))}
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
  options: {
    gap: 8,
  },
  optionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
