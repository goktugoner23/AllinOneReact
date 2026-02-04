import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useColors } from '@shared/theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  inset?: boolean | number;
  style?: ViewStyle;
}

const DEFAULT_INSET = 16;

export function Divider({
  orientation = 'horizontal',
  inset,
  style,
}: DividerProps) {
  const colors = useColors();

  const isHorizontal = orientation === 'horizontal';

  const getInsetValue = (): number => {
    if (inset === true) {
      return DEFAULT_INSET;
    }
    if (typeof inset === 'number') {
      return inset;
    }
    return 0;
  };

  const insetValue = getInsetValue();

  const dividerStyle: ViewStyle = isHorizontal
    ? {
        height: 1,
        width: '100%',
        backgroundColor: colors.border,
        marginHorizontal: insetValue,
      }
    : {
        width: 1,
        height: '100%',
        backgroundColor: colors.border,
        marginVertical: insetValue,
      };

  return <View style={[dividerStyle, style]} />;
}

export default Divider;
