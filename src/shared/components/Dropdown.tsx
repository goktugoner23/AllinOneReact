/**
 * Dropdown Component
 *
 * A shadcn/ui styled dropdown using native React Native Modal.
 * This wrapper provides backwards compatibility with the old Dropdown API.
 *
 * @see Select.tsx for the underlying implementation
 */

import * as React from 'react';
import { ViewStyle } from 'react-native';
import { SimpleSelect, SimpleSelectOption } from './ui/Select';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  selectedValue?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: string;
  style?: ViewStyle;
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  selectedValue,
  onValueChange,
  placeholder = 'Select an option',
  label,
  disabled = false,
  error,
  style,
}) => {
  // Convert DropdownItem[] to SimpleSelectOption[]
  const options: SimpleSelectOption[] = items.map((item) => ({
    label: item.label,
    value: item.value,
    icon: item.icon,
    disabled: item.disabled,
  }));

  return (
    <SimpleSelect
      options={options}
      value={selectedValue}
      onValueChange={onValueChange}
      placeholder={placeholder}
      label={label}
      error={error}
      disabled={disabled}
      style={style}
    />
  );
};

export default Dropdown;
