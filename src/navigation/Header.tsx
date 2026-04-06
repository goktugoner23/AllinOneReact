import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu, Sun, Moon, Bot } from 'lucide-react-native';
import { useAppTheme } from '@shared/theme';
import { useCurrency, type CurrencyCode } from '@shared/hooks/useCurrency';
import { findNavigationItem } from './navigation-config';

const CURRENCIES: CurrencyCode[] = ['TRY', 'AED', 'USD'];

interface HeaderProps {
  routeName: string;
  onMenuPress: () => void;
  onMuninnPress?: () => void;
}

export function Header({ routeName, onMenuPress, onMuninnPress }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();

  const navItem = findNavigationItem(routeName);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colors.headerBg,
          borderBottomColor: colors.headerBorder,
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Left: hamburger */}
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton} activeOpacity={0.7}>
          <Menu size={20} color={colors.foreground} />
        </TouchableOpacity>

        {/* Center: title + badge */}
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
              {navItem?.item.title ?? 'Huginn'}
            </Text>
            {navItem?.group && (
              <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>
                  {navItem.group.title}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.blurb, { color: colors.foregroundMuted }]} numberOfLines={1}>
            {navItem?.item.blurb ?? 'Operational dashboard for every personal system.'}
          </Text>
        </View>

        {/* Right: currency + theme + muninn */}
        <View style={styles.actions}>
          {/* Currency switcher */}
          <View style={[styles.currencyPill, { backgroundColor: colors.pillBg, borderColor: colors.border }]}>
            {CURRENCIES.map((code) => (
              <TouchableOpacity
                key={code}
                onPress={() => setSelectedCurrency(code)}
                style={[
                  styles.currencyButton,
                  code === selectedCurrency && {
                    backgroundColor: colors.primary,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.currencyText,
                    {
                      color: code === selectedCurrency
                        ? colors.primaryForeground
                        : colors.foregroundMuted,
                      fontWeight: code === selectedCurrency ? '600' : '500',
                    },
                  ]}
                >
                  {code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Theme toggle */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.iconButton,
              { backgroundColor: colors.pillBg, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
          >
            {isDark ? (
              <Moon size={16} color={colors.foreground} />
            ) : (
              <Sun size={16} color={colors.foreground} />
            )}
          </TouchableOpacity>

          {/* Muninn button */}
          <TouchableOpacity
            onPress={onMuninnPress}
            style={[styles.muninnButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Bot size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        // Backdrop blur is CSS-only; approximate with slight opacity
      },
    }),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  blurb: {
    fontSize: 12,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyPill: {
    flexDirection: 'row',
    borderRadius: 9999,
    borderWidth: 1,
    padding: 3,
  },
  currencyButton: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  currencyText: {
    fontSize: 11,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muninnButton: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
