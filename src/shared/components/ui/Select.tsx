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
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
  ViewStyle,
  TextStyle,
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
  style?: ViewStyle;
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

  // Styles
  const containerStyle: ViewStyle = {
    marginBottom: 16,
    ...style,
  };

  const labelStyle: TextStyle = {
    fontSize: 14,
    fontWeight: '500',
    color: error ? colors.destructive : colors.mutedForeground,
    marginBottom: 6,
  };

  const triggerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: error ? colors.destructive : colors.border,
    backgroundColor: colors.card,
    opacity: disabled ? 0.5 : 1,
  };

  const triggerTextStyle: TextStyle = {
    flex: 1,
    fontSize: 14,
    color: selectedOption ? colors.foreground : colors.mutedForeground,
  };

  const modalOverlayStyle: ViewStyle = {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  };

  const contentStyle: ViewStyle = {
    width: '100%',
    maxWidth: 340,
    maxHeight: SCREEN_HEIGHT * 0.5,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 25,
      },
      android: {
        elevation: 10,
      },
    }),
  };

  return (
    <View style={containerStyle}>
      {/* Label */}
      {label && <Text style={labelStyle}>{label}</Text>}

      {/* Trigger */}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={triggerStyle}
      >
        {selectedOption?.icon && (
          <View style={{ marginRight: 10, flexDirection: 'row' }}>
            {selectedOption.icon}
          </View>
        )}
        <Text style={triggerTextStyle} numberOfLines={1}>
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </Pressable>

      {/* Error */}
      {error && (
        <Text style={{ fontSize: 12, color: colors.destructive, marginTop: 4 }}>
          {error}
        </Text>
      )}

      {/* Dropdown Modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <Pressable style={modalOverlayStyle} onPress={() => setOpen(false)}>
          <Pressable style={contentStyle} onPress={(e) => e.stopPropagation()}>
            <ScrollView
              contentContainerStyle={{ padding: 4 }}
              showsVerticalScrollIndicator={false}
            >
              {options.map((item) => {
                const isSelected = item.value === value;
                const itemStyle: ViewStyle = {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  marginHorizontal: 4,
                  marginVertical: 2,
                  borderRadius: 6,
                  backgroundColor: 'transparent',
                  opacity: item.disabled ? 0.5 : 1,
                };

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => !item.disabled && handleSelect(item.value)}
                    disabled={item.disabled}
                    style={({ pressed }) => [
                      itemStyle,
                      pressed && !item.disabled && { backgroundColor: colors.muted },
                    ]}
                  >
                    {/* Checkmark indicator */}
                    <View style={{ width: 24, marginRight: 8 }}>
                      {isSelected && (
                        <Check size={16} strokeWidth={3} color={colors.foreground} />
                      )}
                    </View>

                    {/* Icon - inline with text */}
                    {item.icon && (
                      <View style={{ marginRight: 12 }}>
                        {item.icon}
                      </View>
                    )}

                    {/* Label text */}
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        color: colors.foreground,
                      }}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

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
    <Pressable
      onPress={() => !disabled && setOpen(true)}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {selectedOption?.icon && (
        <View style={{ marginRight: 10 }}>{selectedOption.icon}</View>
      )}
      <Text
        style={{
          flex: 1,
          fontSize: 14,
          color: selectedOption ? colors.foreground : colors.mutedForeground,
        }}
        numberOfLines={1}
      >
        {selectedOption?.label || placeholder}
      </Text>
      {children}
      <ChevronDown size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

function SelectValue({ placeholder: ph }: { placeholder?: string }) {
  const { value, options, placeholder } = useSelectContext();
  const colors = useColors();
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Text
      style={{
        flex: 1,
        fontSize: 14,
        color: selectedOption ? colors.foreground : colors.mutedForeground,
      }}
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
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
        onPress={() => setOpen(false)}
      >
        <Pressable
          style={{
            width: '100%',
            maxWidth: 340,
            maxHeight: SCREEN_HEIGHT * 0.5,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.2,
                shadowRadius: 25,
              },
              android: {
                elevation: 10,
              },
            }),
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {children || (
            <ScrollView
              contentContainerStyle={{ padding: 4 }}
              showsVerticalScrollIndicator={false}
            >
              {options.map((item) => {
                const isSelected = item.value === value;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => !item.disabled && handleSelect(item.value)}
                    disabled={item.disabled}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      marginHorizontal: 4,
                      marginVertical: 2,
                      borderRadius: 6,
                      backgroundColor: pressed && !item.disabled ? colors.muted : 'transparent',
                      opacity: item.disabled ? 0.5 : 1,
                    })}
                  >
                    <View style={{ width: 24, marginRight: 8 }}>
                      {isSelected && (
                        <Check size={16} strokeWidth={3} color={colors.foreground} />
                      )}
                    </View>
                    {item.icon && <View style={{ marginRight: 12 }}>{item.icon}</View>}
                    <Text
                      style={{ flex: 1, fontSize: 14, color: colors.foreground }}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SelectItem({ value, label, disabled, icon }: SelectOption) {
  const { value: selectedValue, onValueChange, setOpen } = useSelectContext();
  const colors = useColors();
  const isSelected = value === selectedValue;

  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          onValueChange(value);
          setOpen(false);
        }
      }}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginHorizontal: 4,
        marginVertical: 2,
        borderRadius: 6,
        backgroundColor: pressed && !disabled ? colors.muted : 'transparent',
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <View style={{ width: 24, marginRight: 8 }}>
        {isSelected && <Check size={16} strokeWidth={3} color={colors.foreground} />}
      </View>
      {icon && <View style={{ marginRight: 12 }}>{icon}</View>}
      <Text style={{ flex: 1, fontSize: 14, color: colors.foreground }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
        paddingVertical: 6,
        paddingLeft: 36,
        paddingRight: 8,
      }}
    >
      {children}
    </Text>
  );
}

function SelectSeparator() {
  const colors = useColors();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        marginHorizontal: 8,
        marginVertical: 4,
      }}
    />
  );
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
