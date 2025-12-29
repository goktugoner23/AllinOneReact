import React from 'react';
import { Pressable, StyleSheet, ViewStyle, Text, Animated } from 'react-native';
import { useTheme } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface FABProps {
  icon: string;
  label?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'surface';
  size?: 'small' | 'regular' | 'large';
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  style?: ViewStyle;
  disabled?: boolean;
}

export function FAB({
  icon,
  label,
  onPress,
  variant = 'primary',
  size = 'regular',
  position = 'bottom-right',
  style,
  disabled = false,
}: FABProps) {
  const theme = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: theme.colors.primary,
          icon: theme.colors.onPrimary,
        };
      case 'secondary':
        return {
          bg: theme.colors.secondaryContainer,
          icon: theme.colors.onSecondaryContainer,
        };
      case 'surface':
        return {
          bg: theme.colors.surface,
          icon: theme.colors.primary,
        };
      default:
        return {
          bg: theme.colors.primary,
          icon: theme.colors.onPrimary,
        };
    }
  };

  const getSizeValues = () => {
    switch (size) {
      case 'small':
        return { size: 40, iconSize: 20, padding: 8 };
      case 'large':
        return { size: 64, iconSize: 28, padding: 16 };
      default:
        return { size: 56, iconSize: 24, padding: 16 };
    }
  };

  const getPosition = (): ViewStyle => {
    const base: ViewStyle = { position: 'absolute', bottom: 24 };
    switch (position) {
      case 'bottom-left':
        return { ...base, left: 24 };
      case 'bottom-center':
        return { ...base, alignSelf: 'center', left: '50%', marginLeft: -28 };
      default:
        return { ...base, right: 24 };
    }
  };

  const colors = getColors();
  const sizeValues = getSizeValues();
  const isExtended = !!label;

  const fabStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    borderRadius: isExtended ? 16 : sizeValues.size / 2,
    height: sizeValues.size,
    minWidth: sizeValues.size,
    paddingHorizontal: isExtended ? 20 : 0,
    gap: isExtended ? 8 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        fabStyle,
        getPosition(),
        pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
        style,
      ]}
    >
      <Ionicons name={icon} size={sizeValues.iconSize} color={colors.icon} />
      {label && <Text style={[styles.label, { color: colors.icon }]}>{label}</Text>}
    </Pressable>
  );
}

export interface FABGroupProps {
  mainIcon: string;
  actions: Array<{
    icon: string;
    label: string;
    onPress: () => void;
  }>;
  open: boolean;
  onToggle: () => void;
  style?: ViewStyle;
}

export function FABGroup({ mainIcon, actions, open, onToggle, style }: FABGroupProps) {
  const theme = useTheme();

  return (
    <>
      {open && <Pressable style={styles.backdrop} onPress={onToggle} />}
      <Animated.View style={[styles.groupContainer, style]}>
        {open &&
          actions.map((action, index) => (
            <Animated.View key={index} style={[styles.actionContainer, { bottom: (index + 1) * 64 }]}>
              <Text
                style={[
                  styles.actionLabel,
                  {
                    color: theme.colors.onSurface,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                {action.label}
              </Text>
              <FAB
                icon={action.icon}
                size="small"
                variant="surface"
                onPress={() => {
                  action.onPress();
                  onToggle();
                }}
                style={styles.actionFab}
              />
            </Animated.View>
          ))}
        <FAB icon={open ? 'close' : mainIcon} onPress={onToggle} style={styles.mainFab} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  groupContainer: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    alignItems: 'flex-end',
  },
  actionContainer: {
    position: 'absolute',
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
    fontSize: 14,
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionFab: {
    position: 'relative',
    bottom: 0,
    right: 0,
  },
  mainFab: {
    position: 'relative',
    bottom: 0,
    right: 0,
  },
});

export default FAB;
