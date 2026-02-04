import React, { useState, forwardRef } from 'react';
import { View, TextInput, Pressable, ViewStyle, TextStyle } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useColors, radius, spacing, textStyles } from '@shared/theme';

export interface SearchbarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
  style?: ViewStyle;
}

export const Searchbar = forwardRef<TextInput, SearchbarProps>(
  (
    {
      value,
      onChangeText,
      placeholder = 'Search...',
      onClear,
      onFocus,
      onBlur,
      onSubmit,
      autoFocus = false,
      style,
    },
    ref,
  ) => {
    const colors = useColors();
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
      onChangeText('');
      onClear?.();
    };

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    const handleBlur = () => {
      setIsFocused(false);
      onBlur?.();
    };

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      backgroundColor: colors.muted,
      borderRadius: radius.full,
      paddingHorizontal: spacing[4],
      gap: spacing[2],
      borderWidth: isFocused ? 2 : 0,
      borderColor: isFocused ? colors.primary : 'transparent',
    };

    const inputStyle: TextStyle = {
      flex: 1,
      ...textStyles.body,
      color: colors.foreground,
      paddingVertical: 0,
    };

    return (
      <View style={[containerStyle, style]}>
        <Ionicons name="search-outline" size={20} color={colors.foregroundMuted} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.foregroundMuted}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={onSubmit}
          autoFocus={autoFocus}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          cursorColor={colors.primary}
          selectionColor={colors.primaryMuted}
        />
        {value.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.foregroundMuted} />
          </Pressable>
        )}
      </View>
    );
  },
);

Searchbar.displayName = 'Searchbar';

export default Searchbar;
