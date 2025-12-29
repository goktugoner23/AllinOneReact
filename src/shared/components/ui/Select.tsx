import React, { useState } from 'react';
import { View, Text, Modal, Pressable, FlatList, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  icon?: string;
  disabled?: boolean;
}

export interface SelectProps<T = string> {
  options: SelectOption<T>[];
  value?: T;
  placeholder?: string;
  label?: string;
  error?: string;
  onChange: (value: T) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Select<T = string>({
  options,
  value,
  placeholder = 'Select an option',
  label,
  error,
  onChange,
  disabled = false,
  style,
}: SelectProps<T>) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (option: SelectOption<T>) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const triggerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: error ? 1.5 : 1,
    borderColor: error ? theme.colors.error : theme.colors.outline,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: error ? theme.colors.error : theme.colors.onSurfaceVariant }]}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        style={({ pressed }) => [triggerStyle, pressed && { opacity: 0.8 }]}
      >
        <View style={styles.valueContainer}>
          {selectedOption?.icon && (
            <Ionicons name={selectedOption.icon} size={20} color={theme.colors.onSurface} style={styles.valueIcon} />
          )}
          <Text
            style={[
              styles.valueText,
              {
                color: selectedOption ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {selectedOption?.label || placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
      </Pressable>
      {error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)} />
        <View style={styles.modalContainer}>
          <View style={[styles.optionsList, { backgroundColor: theme.colors.surface }]}>
            <FlatList
              data={options}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [
                    styles.option,
                    item.value === value && {
                      backgroundColor: theme.colors.primaryContainer,
                    },
                    item.disabled && { opacity: 0.4 },
                    pressed && { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  {item.icon && (
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.value === value ? theme.colors.onPrimaryContainer : theme.colors.onSurface}
                      style={styles.optionIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: item.value === value ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  valueIcon: {
    marginRight: 12,
  },
  valueText: {
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  optionsList: {
    width: '100%',
    maxWidth: 360,
    maxHeight: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});

export default Select;
