import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { useTheme } from 'react-native-paper';

export interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  variant?: 'default' | 'pills' | 'underlined';
  fullWidth?: boolean;
  scrollable?: boolean;
  style?: ViewStyle;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'default',
  fullWidth = false,
  scrollable = false,
  style,
}: TabsProps) {
  const theme = useTheme();

  const renderTab = (tab: Tab) => {
    const isActive = tab.key === activeTab;

    const getTabStyle = (): ViewStyle => {
      const base: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
      };

      switch (variant) {
        case 'pills':
          return {
            ...base,
            backgroundColor: isActive ? theme.colors.primary : 'transparent',
            borderRadius: 999,
          };
        case 'underlined':
          return {
            ...base,
            borderBottomWidth: 2,
            borderBottomColor: isActive ? theme.colors.primary : 'transparent',
          };
        default:
          return {
            ...base,
            backgroundColor: isActive ? theme.colors.primaryContainer : 'transparent',
            borderRadius: 12,
          };
      }
    };

    const getTextColor = () => {
      if (variant === 'pills' && isActive) {
        return theme.colors.onPrimary;
      }
      return isActive ? theme.colors.primary : theme.colors.onSurfaceVariant;
    };

    return (
      <Pressable
        key={tab.key}
        onPress={() => onChange(tab.key)}
        style={({ pressed }) => [getTabStyle(), fullWidth && { flex: 1 }, pressed && { opacity: 0.7 }]}
      >
        {tab.icon}
        <Text style={[styles.tabLabel, { color: getTextColor() }, isActive && styles.activeTabLabel]}>{tab.label}</Text>
        {tab.badge !== undefined && tab.badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
            <Text style={[styles.badgeText, { color: theme.colors.onError }]}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: variant === 'underlined' ? 'transparent' : theme.colors.surfaceVariant,
    borderRadius: variant === 'underlined' ? 0 : 16,
    padding: variant === 'underlined' ? 0 : 4,
    ...(variant === 'underlined' && {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    }),
  };

  if (scrollable) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[containerStyle, style]}>
        {tabs.map(renderTab)}
      </ScrollView>
    );
  }

  return <View style={[containerStyle, style]}>{tabs.map(renderTab)}</View>;
}

export interface TabContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function TabContent({ children, style }: TabContentProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabLabel: {
    fontWeight: '600',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});

export default Tabs;
