import React from 'react';
import { ViewStyle } from 'react-native';
import { FAB } from './FAB';

interface RefreshFabProps {
  style?: ViewStyle;
  onPress: () => void;
  disabled?: boolean;
}

export default function RefreshFab({ style, onPress, disabled }: RefreshFabProps) {
  return (
    <FAB icon="refresh" onPress={onPress} disabled={disabled} variant="primary" position="bottom-left" style={style} />
  );
}
