import React from 'react';
import { FAB, FABProps, useTheme } from 'react-native-paper';

type AddFabProps = Omit<FABProps, 'icon' | 'color' | 'style'> & {
  iconName?: string;
  style?: any;
};

export default function AddFab({ iconName = 'plus', style, ...rest }: AddFabProps) {
  const theme = useTheme();
  return (
    <FAB
      icon={iconName}
      color="#FFFFFF"
      style={[{ position: 'absolute', right: 16, bottom: 16, backgroundColor: (theme as any).colors?.primary || '#6C63FF' }, style]}
      {...rest}
    />
  );
}
