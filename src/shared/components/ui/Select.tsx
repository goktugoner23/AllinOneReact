import * as React from 'react';
import { Platform, StyleSheet, View, Text, Pressable, ScrollView, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as SelectPrimitive from '@rn-primitives/select';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTheme } from 'react-native-paper';

type Option = SelectPrimitive.Option;

// Root Select Component
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

// Styled Trigger - wrapped version
interface SelectTriggerProps {
  children?: React.ReactNode;
  disabled?: boolean;
  style?: any;
}

function SelectTrigger({ children, disabled, style }: SelectTriggerProps) {
  const theme = useTheme();

  return (
    <SelectPrimitive.Trigger disabled={disabled}>
      <View
        style={[
          styles.trigger,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outline,
          },
          disabled && styles.triggerDisabled,
          style,
        ]}
      >
        <View style={styles.triggerContent}>{children}</View>
        <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
      </View>
    </SelectPrimitive.Trigger>
  );
}

// Styled Content
interface SelectContentProps {
  children?: React.ReactNode;
  portalHost?: string;
}

function SelectContent({ children, portalHost }: SelectContentProps) {
  const theme = useTheme();

  return (
    <SelectPrimitive.Portal hostName={portalHost}>
      <SelectPrimitive.Overlay style={Platform.OS !== 'web' ? StyleSheet.absoluteFill : undefined}>
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)}>
          <SelectPrimitive.Content position="popper">
            <View
              style={[
                styles.content,
                {
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <SelectPrimitive.Viewport style={styles.viewport}>{children}</SelectPrimitive.Viewport>
            </View>
          </SelectPrimitive.Content>
        </Animated.View>
      </SelectPrimitive.Overlay>
    </SelectPrimitive.Portal>
  );
}

// Styled Label
interface SelectLabelProps {
  children?: React.ReactNode;
}

function SelectLabel({ children }: SelectLabelProps) {
  const theme = useTheme();

  return (
    <SelectPrimitive.Label>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{children}</Text>
    </SelectPrimitive.Label>
  );
}

// Styled Item
interface SelectItemProps {
  label: string;
  value: string;
  disabled?: boolean;
}

function SelectItem({ label, value, disabled }: SelectItemProps) {
  const theme = useTheme();

  return (
    <SelectPrimitive.Item label={label} value={value} disabled={disabled}>
      <View style={styles.item}>
        <View style={styles.itemIndicator}>
          <SelectPrimitive.ItemIndicator>
            <Check size={18} strokeWidth={3} color={theme.colors.primary} />
          </SelectPrimitive.ItemIndicator>
        </View>
        <SelectPrimitive.ItemText style={[styles.itemText, { color: theme.colors.onSurface }]} />
      </View>
    </SelectPrimitive.Item>
  );
}

// Styled Separator
function SelectSeparator() {
  const theme = useTheme();

  return (
    <SelectPrimitive.Separator>
      <View style={[styles.separator, { backgroundColor: theme.colors.outlineVariant }]} />
    </SelectPrimitive.Separator>
  );
}

// ============================================
// SimpleSelect - Easy-to-use wrapper
// ============================================

interface SimpleSelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SimpleSelectProps {
  options: SimpleSelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  style?: any;
}

function SimpleSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  style,
}: SimpleSelectProps) {
  const theme = useTheme();
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View style={[styles.simpleSelectContainer, style]}>
      {label && (
        <Text style={[styles.simpleSelectLabel, { color: error ? theme.colors.error : theme.colors.onSurfaceVariant }]}>
          {label}
        </Text>
      )}
      <Select
        value={value ? { value, label: selectedOption?.label || '' } : undefined}
        onValueChange={(option) => option && onValueChange(option.value)}
      >
        <SelectTrigger disabled={disabled}>
          {selectedOption?.icon && <View style={styles.simpleSelectIcon}>{selectedOption.icon}</View>}
          <Text
            style={[
              styles.simpleSelectValue,
              { color: value ? theme.colors.onSurface : theme.colors.onSurfaceVariant },
            ]}
          >
            {selectedOption?.label || placeholder}
          </Text>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} label={option.label} value={option.value} disabled={option.disabled} />
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <Text style={[styles.simpleSelectError, { color: theme.colors.error }]}>{error}</Text>}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 180,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  viewport: {
    padding: 4,
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 52,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  itemIndicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  // SimpleSelect styles
  simpleSelectContainer: {
    marginBottom: 16,
  },
  simpleSelectLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  simpleSelectIcon: {
    marginRight: 12,
  },
  simpleSelectValue: {
    fontSize: 16,
    flex: 1,
  },
  simpleSelectError: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SimpleSelect,
  type Option,
  type SimpleSelectOption,
  type SimpleSelectProps,
};
