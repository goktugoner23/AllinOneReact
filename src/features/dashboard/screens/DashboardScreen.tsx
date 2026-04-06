import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { useAppTheme } from '@shared/theme';
import { radius } from '@shared/theme/spacing';
import { Skeleton } from '@shared/components/ui/Skeleton';
import { navigationGroups } from '../../../navigation/navigation-config';
import { DashboardSnapshot } from '../types';
import { fetchDashboardSnapshot } from '../services';

import {
  Wallet,
  TrendingUp,
  CheckSquare,
  StickyNote,
  CalendarDays,
  Dumbbell,
  Users,
  Clock,
  Bird,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

type DrawerParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Investments: undefined;
  Tasks: undefined;
  Notes: undefined;
  Calendar: undefined;
  Workout: undefined;
  WTRegistry: undefined;
  History: undefined;
  Muninn: undefined;
};

const ICON_MAP: Record<string, LucideIcon> = {
  Transactions: Wallet,
  Investments: TrendingUp,
  Tasks: CheckSquare,
  Notes: StickyNote,
  Calendar: CalendarDays,
  Workout: Dumbbell,
  WTRegistry: Users,
  History: Clock,
  Muninn: Bird,
};

interface CardData {
  route: string;
  title: string;
  blurb: string;
  group: string;
  icon: LucideIcon;
}

/** Flatten nav groups into card data, skipping Dashboard itself. */
const CARDS: CardData[] = navigationGroups.flatMap((group) =>
  group.items
    .filter((item) => item.route !== 'Dashboard')
    .map((item) => ({
      route: item.route,
      title: item.title,
      blurb: item.blurb,
      group: group.title,
      icon: ICON_MAP[item.route] ?? Clock,
    })),
);

// ---------------------------------------------------------------------------
// Stat resolver
// ---------------------------------------------------------------------------

function getStatForRoute(
  route: string,
  snap: DashboardSnapshot | null,
): { value: string; label: string } | null {
  if (!snap) return null;
  switch (route) {
    case 'Transactions':
      return { value: String(snap.transactions.totalCount), label: 'total entries' };
    case 'Investments':
      return null; // no dedicated stat
    case 'Tasks':
      return { value: String(snap.tasks.incompleteCount), label: 'open tasks' };
    case 'Notes':
      return { value: String(snap.notes.totalCount), label: 'notes' };
    case 'Calendar':
      return { value: String(snap.calendar.upcomingCount), label: 'upcoming' };
    case 'Workout':
      return { value: String(snap.workout.totalCompletedWorkouts), label: 'workouts' };
    case 'WTRegistry':
      return { value: String(snap.wtRegistry.activeStudents), label: 'students' };
    case 'History':
      return { value: String(snap.history.total), label: 'records' };
    case 'Muninn':
      return null; // no stat
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function DashboardCard({
  card,
  snapshot,
  loading,
  onPress,
}: {
  card: CardData;
  snapshot: DashboardSnapshot | null;
  loading: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const Icon = card.icon;
  const stat = getStatForRoute(card.route, snapshot);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: colors.cardIconBg }]}>
        <Icon size={22} color={colors.foregroundMuted} strokeWidth={1.8} />
      </View>

      {/* Group */}
      <Text style={[styles.groupLabel, { color: colors.foregroundMuted }]}>
        {card.group}
      </Text>

      {/* Title */}
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
        {card.title}
      </Text>

      {/* Blurb */}
      <Text style={[styles.blurb, { color: colors.foregroundMuted }]} numberOfLines={2}>
        {card.blurb}
      </Text>

      {/* Stat area */}
      {loading ? (
        <View style={[styles.statBox, { backgroundColor: colors.cardIconBg }]}>
          <Skeleton width={40} height={18} borderRadius={6} />
          <Skeleton width={60} height={11} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      ) : stat ? (
        <View style={[styles.statBox, { backgroundColor: colors.cardIconBg }]}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
          <Text style={[styles.statLabel, { color: colors.foregroundMuted }]}>{stat.label}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function DashboardScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await fetchDashboardSnapshot();
      setSnapshot(snap);
    } catch {
      // Keep whatever we had before
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const renderCard = useCallback(
    ({ item }: { item: CardData }) => (
      <DashboardCard
        card={item}
        snapshot={snapshot}
        loading={loading}
        onPress={() => navigation.navigate(item.route as keyof DrawerParamList)}
      />
    ),
    [snapshot, loading, navigation],
  );

  return (
    <FlatList
      data={CARDS}
      renderItem={renderCard}
      keyExtractor={(item) => item.route}
      numColumns={2}
      contentContainerStyle={[styles.list, { backgroundColor: colors.background }]}
      style={{ backgroundColor: colors.background }}
      columnWrapperStyle={styles.row}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default DashboardScreen;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderRadius: radius.card, // 28
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.icon, // 18
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  blurb: {
    fontSize: 12,
    lineHeight: 16,
  },
  statBox: {
    marginTop: 8,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
