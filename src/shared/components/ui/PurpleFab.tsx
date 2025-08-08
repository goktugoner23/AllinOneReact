import React from 'react';
import { FAB, FABProps, useTheme } from 'react-native-paper';

type PurpleFabProps = Omit<FABProps, 'icon' | 'color' | 'style'> & {
  iconName?: string;
  style?: any;
};

export default function PurpleFab({ iconName = 'plus', style, ...rest }: PurpleFabProps) {
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


