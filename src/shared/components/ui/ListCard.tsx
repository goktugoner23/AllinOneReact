/**
 * ListCard Component - shadcn/ui style
 *
 * A reusable list item component with grouped card styling.
 * Supports avatars, icons, titles, subtitles, and right accessories.
 */

import * as React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useColors } from '@shared/theme';

// ============================================
// Types
// ============================================

export interface ListCardItemProps {
  /** Main title text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Left side content (avatar, icon, etc.) */
  leftContent?: React.ReactNode;
  /** Right side content (badge, switch, etc.) */
  rightContent?: React.ReactNode;
  /** Show chevron arrow on right */
  showChevron?: boolean;
  /** Status indicator color (shows a dot) */
  statusColor?: string;
  /** Press handler */
  onPress?: () => void;
  /** Long press handler */
  onLongPress?: () => void;
  /** Whether this is the first item in the list */
  isFirst?: boolean;
  /** Whether this is the last item in the list */
  isLast?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Custom style */
  style?: ViewStyle;
}

export interface ListCardGroupProps {
  /** List items data */
  children: React.ReactNode;
  /** Header title for the group */
  header?: string;
  /** Footer text for the group */
  footer?: string;
  /** Custom style for the container */
  style?: ViewStyle;
}

// ============================================
// ListCardItem Component
// ============================================

export function ListCardItem({
  title,
  subtitle,
  leftContent,
  rightContent,
  showChevron = true,
  statusColor,
  onPress,
  onLongPress,
  isFirst = false,
  isLast = false,
  disabled = false,
  style,
}: ListCardItemProps) {
  const colors = useColors();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderTopLeftRadius: isFirst ? 12 : 0,
    borderTopRightRadius: isFirst ? 12 : 0,
    borderBottomLeftRadius: isLast ? 12 : 0,
    borderBottomRightRadius: isLast ? 12 : 0,
    borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0,
    borderBottomColor: colors.border,
    opacity: disabled ? 0.5 : 1,
  };

  const content = (
    <>
      {/* Left Content */}
      {leftContent && <View style={styles.leftContent}>{leftContent}</View>}

      {/* Main Content */}
      <View style={styles.mainContent}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Content */}
      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}

      {/* Status Indicator */}
      {statusColor && (
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      )}

      {/* Chevron */}
      {showChevron && (
        <ChevronRight size={20} color={colors.mutedForeground} style={styles.chevron} />
      )}
    </>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={[containerStyle, style]}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[containerStyle, style]}>{content}</View>;
}

// ============================================
// ListCardGroup Component
// ============================================

export function ListCardGroup({ children, header, footer, style }: ListCardGroupProps) {
  const colors = useColors();
  const childArray = React.Children.toArray(children);
  const count = childArray.length;

  return (
    <View style={[styles.groupContainer, style]}>
      {/* Header */}
      {header && (
        <Text style={[styles.header, { color: colors.mutedForeground }]}>{header}</Text>
      )}

      {/* Items with isFirst/isLast props */}
      <View style={styles.itemsContainer}>
        {React.Children.map(childArray, (child, index) => {
          if (React.isValidElement<ListCardItemProps>(child)) {
            return React.cloneElement(child, {
              isFirst: index === 0,
              isLast: index === count - 1,
            });
          }
          return child;
        })}
      </View>

      {/* Footer */}
      {footer && (
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>{footer}</Text>
      )}
    </View>
  );
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  leftContent: {
    marginRight: 14,
  },
  mainContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  rightContent: {
    marginLeft: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 12,
  },
  chevron: {
    marginLeft: 8,
  },
  groupContainer: {
    marginHorizontal: 16,
  },
  itemsContainer: {
    overflow: 'hidden',
  },
  header: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  footer: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
  },
});

// ============================================
// Compound Export
// ============================================

export const ListCard = {
  Item: ListCardItem,
  Group: ListCardGroup,
};

export default ListCard;

