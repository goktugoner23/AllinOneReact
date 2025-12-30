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
      color={theme.colors.onPrimary}
      style={[
        { position: 'absolute', right: 16, bottom: 16, backgroundColor: theme.colors.primary },
        style,
      ]}
      {...rest}
    />
  );
}
