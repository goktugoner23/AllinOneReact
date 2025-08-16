import React from 'react';
import { FAB, FABProps, useTheme } from 'react-native-paper';

type RefreshFabProps = Omit<FABProps, 'icon' | 'color' | 'style'> & {
  style?: any;
};

export default function RefreshFab({ style, ...rest }: RefreshFabProps) {
  const theme = useTheme();
  return (
    <FAB
      icon="refresh"
      color="#FFFFFF"
      style={[{ position: 'absolute', left: 16, bottom: 16, backgroundColor: (theme as any).colors?.primary || '#6C63FF' }, style]}
      {...rest}
    />
  );
}
