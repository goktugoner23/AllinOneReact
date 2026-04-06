import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Search, Sun, Moon } from 'lucide-react-native';
import { useAppTheme } from '@shared/theme';
import { useCurrency, type CurrencyCode } from '@shared/hooks/useCurrency';
import { radius } from '@shared/theme/spacing';
import { navigationGroups } from './navigation-config';

const CURRENCIES: CurrencyCode[] = ['TRY', 'AED', 'USD'];

// Huginn raven SVG is not portable to RN easily — use text logo instead
function LogoIcon({ color }: { color: string }) {
  return (
    <View style={[styles.logoIcon, { backgroundColor: color }]}>
      <Text style={[styles.logoLetter, { color: color === '#171717' ? '#fff' : '#0a0a0a' }]}>H</Text>
    </View>
  );
}

export function DrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const [query, setQuery] = useState('');

  const activeRoute = state.routes[state.index]?.name;

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navigationGroups;
    return navigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          `${item.title} ${item.blurb}`.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <View style={[styles.container, { backgroundColor: colors.sidebar }]}>
      {/* Header card */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <LogoIcon color={colors.primary} />
          <View style={styles.headerText}>
            <Text
              style={[
                styles.brandLabel,
                { color: colors.foregroundMuted },
              ]}
            >
              HUGINN
            </Text>
            <Text
              style={[styles.brandTitle, { color: colors.foreground }]}
              numberOfLines={1}
            >
              Personal operating system
            </Text>
          </View>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f8f6f1',
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={16} color={colors.foregroundMuted} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search modules"
            placeholderTextColor={colors.foregroundMuted}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
      </View>

      {/* Navigation groups */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {filteredGroups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.foregroundMuted }]}>
              {group.title}
            </Text>
            {group.items.map((item) => {
              const isActive = activeRoute === item.route;
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.route}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(item.route)}
                  style={[
                    styles.navItem,
                    isActive && {
                      backgroundColor: isDark ? '#FFFFFF' : '#171717',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.navIcon,
                      {
                        backgroundColor: isActive
                          ? isDark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
                          : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)',
                        borderColor: isActive
                          ? isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'
                          : colors.border,
                      },
                    ]}
                  >
                    <Icon
                      size={16}
                      color={
                        isActive
                          ? isDark ? '#0a0a0a' : '#FFFFFF'
                          : colors.foreground
                      }
                    />
                  </View>
                  <View style={styles.navText}>
                    <Text
                      style={[
                        styles.navTitle,
                        {
                          color: isActive
                            ? isDark ? '#0a0a0a' : '#FFFFFF'
                            : colors.foreground,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.navBlurb,
                        {
                          color: isActive
                            ? isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'
                            : colors.foregroundMuted,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.blurb}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Footer: currency + theme */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={[styles.currencyPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}>
          {CURRENCIES.map((code) => (
            <TouchableOpacity
              key={code}
              onPress={() => setSelectedCurrency(code)}
              style={[
                styles.currencyButton,
                code === selectedCurrency && { backgroundColor: colors.primary },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.currencyText,
                  {
                    color: code === selectedCurrency ? colors.primaryForeground : colors.foregroundMuted,
                    fontWeight: code === selectedCurrency ? '600' : '500',
                  },
                ]}
              >
                {code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          {isDark ? <Moon size={16} color={colors.foreground} /> : <Sun size={16} color={colors.foreground} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  brandLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 3.7,
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    height: 44,
    borderRadius: radius['2xl'],
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  nav: {
    flex: 1,
    marginTop: 24,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: radius['2xl'],
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 4,
  },
  navIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  navText: {
    flex: 1,
    minWidth: 0,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  navBlurb: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  currencyPill: {
    flexDirection: 'row',
    borderRadius: 9999,
    borderWidth: 1,
    padding: 3,
  },
  currencyButton: {
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  currencyText: {
    fontSize: 12,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
