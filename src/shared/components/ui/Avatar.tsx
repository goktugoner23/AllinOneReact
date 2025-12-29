import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

export interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export function Avatar({ source, name, size = 'md', style }: AvatarProps) {
  const theme = useTheme();

  const sizes: Record<string, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const fontSizes: Record<string, number> = {
    xs: 10,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 32,
  };

  const sizeValue = sizes[size];
  const fontSize = fontSizes[size];

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const avatarStyle: ViewStyle = {
    width: sizeValue,
    height: sizeValue,
    borderRadius: sizeValue / 2,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  if (source) {
    return (
      <View style={[avatarStyle, style]}>
        <Image
          source={source}
          style={{
            width: sizeValue,
            height: sizeValue,
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[avatarStyle, style]}>
      <Text
        style={{
          color: theme.colors.onPrimaryContainer,
          fontSize,
          fontWeight: '600',
        }}
      >
        {name ? getInitials(name) : '?'}
      </Text>
    </View>
  );
}

export interface AvatarGroupProps {
  avatars: Array<{ source?: { uri: string }; name?: string }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export function AvatarGroup({ avatars, max = 4, size = 'md', style }: AvatarGroupProps) {
  const theme = useTheme();
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const sizes: Record<string, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const sizeValue = sizes[size];
  const overlap = sizeValue * 0.3;

  return (
    <View style={[styles.group, style]}>
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.avatarWrapper,
            {
              marginLeft: index > 0 ? -overlap : 0,
              zIndex: displayAvatars.length - index,
              borderRadius: sizeValue / 2,
              borderWidth: 2,
              borderColor: theme.colors.surface,
            },
          ]}
        >
          <Avatar source={avatar.source} name={avatar.name} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.avatarWrapper,
            {
              marginLeft: -overlap,
              width: sizeValue,
              height: sizeValue,
              borderRadius: sizeValue / 2,
              backgroundColor: theme.colors.surfaceVariant,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: theme.colors.surface,
            },
          ]}
        >
          <Text
            style={{
              color: theme.colors.onSurfaceVariant,
              fontSize: sizeValue * 0.35,
              fontWeight: '600',
            }}
          >
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    overflow: 'hidden',
  },
});

export default Avatar;
