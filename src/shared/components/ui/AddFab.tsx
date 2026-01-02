import React from 'react';
import { ViewStyle } from 'react-native';
import { FAB } from './FAB';

interface AddFabProps {
  iconName?: string;
  style?: ViewStyle;
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}

export default function AddFab({ iconName = 'add', style, onPress, disabled, label }: AddFabProps) {
  return (
    <FAB
      icon={iconName}
      onPress={onPress}
      disabled={disabled}
      label={label}
      variant="primary"
      position="bottom-right"
      style={style}
    />
  );
}
