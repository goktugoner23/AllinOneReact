import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors } from '@shared/theme';
import { PendingChoice } from '../types/Muninn';

interface UserChoiceCardProps {
  choice: PendingChoice;
  onSelect: (option: string) => void;
  disabled?: boolean;
}

export default function UserChoiceCard({ choice, onSelect, disabled }: UserChoiceCardProps) {
  const colors = useColors();
  const [freeText, setFreeText] = useState('');

  const handleFreeTextSend = () => {
    const trimmed = freeText.trim();
    if (!trimmed || disabled) return;
    onSelect(trimmed);
    setFreeText('');
  };

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
      {choice.allowFreeText && (
        <View style={[styles.freeTextRow, { borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.freeTextInput, { backgroundColor: colors.backgroundSecondary, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Or type your answer..."
            placeholderTextColor={colors.foregroundSubtle}
            value={freeText}
            onChangeText={setFreeText}
            editable={!disabled}
            onSubmitEditing={handleFreeTextSend}
          />
          <TouchableOpacity
            style={[styles.freeTextSendBtn, { backgroundColor: freeText.trim() && !disabled ? colors.primary : colors.border }]}
            onPress={handleFreeTextSend}
            disabled={!freeText.trim() || disabled}
          >
            <Ionicons name="send" size={16} color={freeText.trim() && !disabled ? colors.primaryForeground : colors.foregroundSubtle} />
          </TouchableOpacity>
        </View>
      )}
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
  freeTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  freeTextInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  freeTextSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
