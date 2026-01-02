/**
 * Select Component - shadcn/ui design
 *
 * A pixel-perfect shadcn styled select dropdown for React Native.
 */

import * as React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  StyleSheet,
} from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useColors } from '@shared/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// Types
// ============================================

export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SimpleSelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  style?: any;
}

// ============================================
// SimpleSelect - shadcn styled
// ============================================

export function SimpleSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  label,
  error,
  disabled = false,
  style,
}: SimpleSelectProps) {
  const [open, setOpen] = React.useState(false);
  const colors = useColors();
  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, { color: error ? colors.destructive : colors.mutedForeground }]}>
          {label}
        </Text>
      )}

      {/* Trigger */}
      <TouchableOpacity
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.trigger,
          {
            borderColor: error ? colors.destructive : colors.border,
            backgroundColor: colors.card,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {selectedOption?.icon && <View style={styles.triggerIcon}>{selectedOption.icon}</View>}
        <Text
          style={[
            styles.triggerText,
            { color: selectedOption ? colors.foreground : colors.mutedForeground },
          ]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Error */}
      {error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}

      {/* Dropdown Modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {options.map((item, index) => {
                const isSelected = item.value === value;
                const isLast = index === options.length - 1;

                return (
                  <React.Fragment key={item.value}>
                    <TouchableOpacity
                      onPress={() => !item.disabled && handleSelect(item.value)}
                      disabled={item.disabled}
                      activeOpacity={0.6}
                      style={[
                        styles.item,
                        isSelected && { backgroundColor: colors.muted },
                        item.disabled && styles.itemDisabled,
                      ]}
                    >
                      {/* Icon on left */}
                      <View style={styles.itemIconContainer}>
                        {item.icon}
                      </View>

                      {/* Label */}
                      <Text
                        style={[styles.itemText, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>

                      {/* Checkmark on right */}
                      {isSelected && (
                        <Check size={18} strokeWidth={2.5} color={colors.primary} />
                      )}
                    </TouchableOpacity>

                    {/* Separator line */}
                    {!isLast && (
                      <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    )}
                  </React.Fragment>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  triggerIcon: {
    marginRight: 12,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    maxHeight: SCREEN_HEIGHT * 0.55,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemDisabled: {
    opacity: 0.4,
  },
  itemIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 58,
  },
});

// ============================================
// Compound Select (for advanced usage)
// ============================================

interface SelectContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within Select');
  }
  return context;
}

interface SelectRootProps {
  children: React.ReactNode;
  value?: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

function SelectRoot({
  children,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
}: SelectRootProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider
      value={{ open, setOpen, value, onValueChange, options, placeholder, disabled }}
    >
      {children}
    </SelectContext.Provider>
  );
}

function SelectTrigger({ children }: { children?: React.ReactNode }) {
  const { setOpen, value, options, placeholder, disabled } = useSelectContext();
  const colors = useColors();
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <TouchableOpacity
      onPress={() => !disabled && setOpen(true)}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.trigger,
        {
          borderColor: colors.border,
          backgroundColor: colors.card,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {selectedOption?.icon && <View style={styles.triggerIcon}>{selectedOption.icon}</View>}
      <Text
        style={[
          styles.triggerText,
          { color: selectedOption ? colors.foreground : colors.mutedForeground },
        ]}
        numberOfLines={1}
      >
        {selectedOption?.label || placeholder}
      </Text>
      {children}
      <ChevronDown size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

function SelectValue({ placeholder: ph }: { placeholder?: string }) {
  const { value, options, placeholder } = useSelectContext();
  const colors = useColors();
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Text
      style={[
        styles.triggerText,
        { color: selectedOption ? colors.foreground : colors.mutedForeground },
      ]}
      numberOfLines={1}
    >
      {selectedOption?.label || ph || placeholder}
    </Text>
  );
}

function SelectContent({ children }: { children?: React.ReactNode }) {
  const { open, setOpen, options, value, onValueChange } = useSelectContext();
  const colors = useColors();

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setOpen(false)}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {children || (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {options.map((item, index) => {
                const isSelected = item.value === value;
                const isLast = index === options.length - 1;

                return (
                  <React.Fragment key={item.value}>
                    <TouchableOpacity
                      onPress={() => !item.disabled && handleSelect(item.value)}
                      disabled={item.disabled}
                      activeOpacity={0.6}
                      style={[
                        styles.item,
                        isSelected && { backgroundColor: colors.muted },
                        item.disabled && styles.itemDisabled,
                      ]}
                    >
                      <View style={styles.itemIconContainer}>{item.icon}</View>
                      <Text
                        style={[styles.itemText, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {isSelected && (
                        <Check size={18} strokeWidth={2.5} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                    {!isLast && (
                      <View style={[styles.separator, { backgroundColor: colors.border }]} />
                    )}
                  </React.Fragment>
                );
              })}
            </ScrollView>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function SelectItem({ value, label, disabled, icon }: SelectOption) {
  const { value: selectedValue, onValueChange, setOpen } = useSelectContext();
  const colors = useColors();
  const isSelected = value === selectedValue;

  return (
    <TouchableOpacity
      onPress={() => {
        if (!disabled) {
          onValueChange(value);
          setOpen(false);
        }
      }}
      disabled={disabled}
      activeOpacity={0.6}
      style={[
        styles.item,
        isSelected && { backgroundColor: colors.muted },
        disabled && styles.itemDisabled,
      ]}
    >
      <View style={styles.itemIconContainer}>{icon}</View>
      <Text style={[styles.itemText, { color: colors.foreground }]} numberOfLines={1}>
        {label}
      </Text>
      {isSelected && <Check size={18} strokeWidth={2.5} color={colors.primary} />}
    </TouchableOpacity>
  );
}

function SelectGroup({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
}

function SelectLabel({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: '600',
        color: colors.mutedForeground,
        paddingVertical: 8,
        paddingHorizontal: 16,
      }}
    >
      {children}
    </Text>
  );
}

function SelectSeparator() {
  const colors = useColors();
  return <View style={[styles.separator, { backgroundColor: colors.border, marginLeft: 0 }]} />;
}

// Export compound component
export const Select = Object.assign(SelectRoot, {
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Item: SelectItem,
  Group: SelectGroup,
  Label: SelectLabel,
  Separator: SelectSeparator,
});

export type { SelectOption as SimpleSelectOption };
