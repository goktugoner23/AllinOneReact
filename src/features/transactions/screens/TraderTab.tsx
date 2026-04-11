// Mobile mirror of huginn-webapp/src/modules/v1.0/investments/components/trader-panel.tsx
// Full feature parity (status bar, paper-vs-live validation card, bot
// positions, signal feed, strategy config, X account editor, emergency
// stop) tuned for a single scrollable mobile view.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Switch,
  Chip,
  EmptyState,
} from '@shared/components/ui';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';
import {
  addTwitterAccount,
  emergencyStopBot,
  getBotConfig,
  getBotPositions,
  getBotStatus,
  getNews,
  getSignals,
  getTraderModeStats,
  getTweets,
  listTwitterAccounts,
  removeTwitterAccount,
  updateBotConfig,
} from '@features/transactions/services/trader';
import type {
  BotConfig,
  BotStatus,
  NewsEntry,
  TradeSignal,
  TraderModeStats,
  TweetEntry,
  TwitterAccount,
} from '@features/transactions/types/Trader';
import type { TradeLogEntry } from '@features/transactions/types/TradeLog';

type FeedFilter = 'all' | 'tweet' | 'news' | 'signal';
type ModeFilter = 'live' | 'paper';

function formatMoney(n: number | null | undefined): string {
  if (n == null) return '—';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—';
  const val = Number(price);
  return val >= 1
    ? val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : val.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 8,
      });
}

export const TraderTab: React.FC = () => {
  const colors = useColors();

  const [status, setStatus] = useState<BotStatus | null>(null);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [positions, setPositions] = useState<TradeLogEntry[]>([]);
  const [tweets, setTweets] = useState<TweetEntry[]>([]);
  const [news, setNews] = useState<NewsEntry[]>([]);
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [paperStats, setPaperStats] = useState<TraderModeStats | null>(null);
  const [liveStats, setLiveStats] = useState<TraderModeStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  // Mode pill defaults to whatever the bot is currently writing — paper
  // while dry_run is on, live otherwise. Synced once on first load.
  const [modeFilter, setModeFilter] = useState<ModeFilter>('paper');
  const [hasSyncedMode, setHasSyncedMode] = useState(false);

  // Add-account modal
  const [addOpen, setAddOpen] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [adding, setAdding] = useState(false);

  // Local config drafts (only persisted on Save)
  const [symbolsDraft, setSymbolsDraft] = useState('');
  const [maxNotionalDraft, setMaxNotionalDraft] = useState('');
  const [maxPositionsDraft, setMaxPositionsDraft] = useState('');
  const [cooldownDraft, setCooldownDraft] = useState('');

  const refreshAll = useCallback(async () => {
    const results = await Promise.allSettled([
      getBotStatus(),
      getBotConfig(),
      getBotPositions(50, modeFilter),
      getTweets(30),
      getNews(30),
      getSignals(30),
      listTwitterAccounts(),
      getTraderModeStats('paper'),
      getTraderModeStats('live'),
    ]);
    if (results[0].status === 'fulfilled') {
      const st = results[0].value;
      setStatus(st);
      // First load only: snap mode pill to bot's active mode.
      if (!hasSyncedMode) {
        setModeFilter(st.dryRun ? 'paper' : 'live');
        setHasSyncedMode(true);
      }
    }
    if (results[1].status === 'fulfilled') {
      const cfg = results[1].value;
      setConfig(cfg);
      if (cfg) {
        setSymbolsDraft(cfg.allowed_symbols.join(', '));
        setMaxNotionalDraft(String(cfg.max_notional_per_position));
        setMaxPositionsDraft(String(cfg.max_positions));
        setCooldownDraft(String(cfg.cooldown_seconds));
      }
    }
    if (results[2].status === 'fulfilled') setPositions(results[2].value);
    if (results[3].status === 'fulfilled') setTweets(results[3].value);
    if (results[4].status === 'fulfilled') setNews(results[4].value);
    if (results[5].status === 'fulfilled') setSignals(results[5].value);
    if (results[6].status === 'fulfilled') setAccounts(results[6].value);
    if (results[7].status === 'fulfilled') setPaperStats(results[7].value);
    if (results[8].status === 'fulfilled') setLiveStats(results[8].value);
  }, [modeFilter, hasSyncedMode]);

  useEffect(() => {
    setLoading(true);
    refreshAll().finally(() => setLoading(false));
  }, [refreshAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!config) return;
    setSavingConfig(true);
    try {
      const updated = await updateBotConfig({ enabled });
      if (updated) setConfig(updated);
      const st = await getBotStatus();
      setStatus(st);
    } catch (err) {
      console.error('Failed to toggle bot:', err);
      Alert.alert('Error', 'Failed to update config');
    } finally {
      setSavingConfig(false);
    }
  };

  // Both flags share a single toggle path. dry_run flip resyncs the
  // positions table mode pill to match the new active mode.
  const handleToggleFlag = (flag: 'dry_run' | 'smc_enabled', value: boolean) => {
    if (!config) return;
    const apply = async () => {
      setSavingConfig(true);
      try {
        const updated = await updateBotConfig({ [flag]: value });
        if (updated) setConfig(updated);
        if (flag === 'dry_run') setModeFilter(value ? 'paper' : 'live');
        await refreshAll();
      } catch (err) {
        console.error(`Failed to toggle ${flag}:`, err);
        Alert.alert('Error', `Failed to toggle ${flag}`);
      } finally {
        setSavingConfig(false);
      }
    };
    if (flag === 'dry_run' && value === false) {
      Alert.alert(
        'Disable dry-run?',
        'The bot will place REAL Binance orders on its next tick. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', style: 'destructive', onPress: apply },
        ]
      );
      return;
    }
    apply();
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSavingConfig(true);
    try {
      const symbols = symbolsDraft
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      const updated = await updateBotConfig({
        allowed_symbols: symbols,
        max_notional_per_position: Number(maxNotionalDraft) || 0,
        max_positions: Number(maxPositionsDraft) || 0,
        cooldown_seconds: Number(cooldownDraft) || 0,
      });
      if (updated) setConfig(updated);
    } catch (err) {
      console.error('Failed to save config:', err);
      Alert.alert('Error', 'Failed to save config');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleEmergencyStop = () => {
    Alert.alert(
      'Emergency stop',
      'This disables the bot and cancels all bot-owned orders. Open positions will NOT be closed — you decide those manually. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await emergencyStopBot();
              Alert.alert('Bot disabled', `Cancelled ${res.cancelled} bot orders.`);
              await refreshAll();
            } catch (err) {
              console.error('Emergency stop failed:', err);
              Alert.alert('Error', 'Emergency stop failed');
            }
          },
        },
      ]
    );
  };

  const handleAddAccount = async () => {
    if (!newHandle.trim()) return;
    setAdding(true);
    try {
      await addTwitterAccount(newHandle.trim(), newDisplayName.trim() || undefined);
      setNewHandle('');
      setNewDisplayName('');
      setAddOpen(false);
      const list = await listTwitterAccounts();
      setAccounts(list);
    } catch (err) {
      console.error('Failed to add account:', err);
      Alert.alert('Error', 'Failed to add account');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAccount = (id: number, handle: string) => {
    Alert.alert('Remove account', `Remove @${handle}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeTwitterAccount(id);
            setAccounts((prev) => prev.filter((a) => a.id !== id));
          } catch (err) {
            console.error('Failed to remove account:', err);
            Alert.alert('Error', 'Failed to remove account');
          }
        },
      },
    ]);
  };

  // Unified signal feed: tweets + news + raw signals sorted by time.
  const unifiedFeed = useMemo(() => {
    type FeedItem = {
      key: string;
      kind: 'tweet' | 'news' | 'signal';
      at: string;
      title: string;
      body: string;
      symbols: string[];
      sentiment: number | null;
      direction?: string;
      strength?: number;
      source: string;
    };
    const items: FeedItem[] = [];

    if (feedFilter === 'all' || feedFilter === 'tweet') {
      for (const t of tweets) {
        items.push({
          key: `tweet-${t.id}`,
          kind: 'tweet',
          at: t.posted_at,
          title: `@${t.handle}`,
          body: t.text,
          symbols: t.relevant_symbols ?? [],
          sentiment: t.sentiment != null ? Number(t.sentiment) : null,
          source: 'twitter',
        });
      }
    }
    if (feedFilter === 'all' || feedFilter === 'news') {
      for (const n of news) {
        items.push({
          key: `news-${n.id}`,
          kind: 'news',
          at: n.published_at,
          title: n.title,
          body: n.body ?? '',
          symbols: n.relevant_symbols ?? [],
          sentiment: n.sentiment != null ? Number(n.sentiment) : null,
          source: n.source,
        });
      }
    }
    if (feedFilter === 'all' || feedFilter === 'signal') {
      for (const s of signals) {
        items.push({
          key: `signal-${s.id}`,
          kind: 'signal',
          at: s.created_at,
          title: `${s.direction} ${s.symbol}`,
          body: s.rationale ?? '',
          symbols: [s.symbol],
          sentiment: null,
          direction: s.direction,
          strength: Number(s.strength),
          source: s.source,
        });
      }
    }

    return items
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 40);
  }, [feedFilter, tweets, news, signals]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const enabled = config?.enabled ?? false;
  const dryRun = status?.dryRun ?? config?.dry_run ?? true;
  const smcEnabled = status?.smcEnabled ?? config?.smc_enabled ?? false;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* ── Status card ── */}
      <Card style={[styles.card, { backgroundColor: colors.card }]} variant="elevated" padding="md">
        <CardHeader>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.titleRow}>
                <Ionicons name="hardware-chip-outline" size={22} color={colors.foreground} />
                <CardTitle>
                  <Text style={[textStyles.h3, { color: colors.foreground }]}>Trader bot</Text>
                </CardTitle>
              </View>
              <Text style={[textStyles.caption, { color: colors.mutedForeground, marginTop: spacing[1] }]}>
                Autonomous futures bot. Only touches positions it opened.
              </Text>
            </View>
          </View>
        </CardHeader>
        <CardContent>
          {/* Stat tiles */}
          <View style={styles.statGrid}>
            <View style={[styles.statTile, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>Enabled</Text>
              <View style={styles.enabledRow}>
                <Switch value={enabled} onChange={handleToggleEnabled} disabled={savingConfig} size="sm" />
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: enabled ? colors.success : colors.muted,
                      marginLeft: spacing[2],
                    },
                  ]}
                >
                  <Text
                    style={[
                      textStyles.caption,
                      {
                        color: enabled ? colors.successForeground : colors.mutedForeground,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {enabled ? 'LIVE' : 'OFF'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.statTile, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>Open positions</Text>
              <Text style={[textStyles.h3, { color: colors.foreground }]}>
                {status?.openPositions ?? 0}
                <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>
                  {' '}
                  / {status?.maxPositions ?? 0}
                </Text>
              </Text>
            </View>
            <View style={[styles.statTile, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>PnL today</Text>
              <Text
                style={[
                  textStyles.h3,
                  {
                    color:
                      (status?.pnlTodayUsdt ?? 0) >= 0 ? colors.success : colors.destructive,
                  },
                ]}
              >
                {formatMoney(status?.pnlTodayUsdt ?? 0)}
              </Text>
            </View>
            <View style={[styles.statTile, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>Win rate (7d)</Text>
              <Text style={[textStyles.h3, { color: colors.foreground }]}>
                {status?.winRate7d != null ? `${Math.round(status.winRate7d * 100)}%` : '—'}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Button variant="outline" size="sm" onPress={onRefresh} style={styles.flexBtn}>
              <View style={styles.btnInner}>
                <Ionicons name="refresh" size={16} color={colors.foreground} />
                <Text style={[textStyles.label, { color: colors.foreground, marginLeft: 6 }]}>Refresh</Text>
              </View>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onPress={handleEmergencyStop}
              style={styles.flexBtn}
            >
              <View style={styles.btnInner}>
                <Ionicons name="warning-outline" size={16} color={colors.destructiveForeground} />
                <Text
                  style={[textStyles.label, { color: colors.destructiveForeground, marginLeft: 6 }]}
                >
                  Stop
                </Text>
              </View>
            </Button>
          </View>
        </CardContent>
      </Card>

      {/* ── Strategy validation (paper vs live) ── */}
      <Card style={[styles.card, { backgroundColor: colors.card }]} variant="elevated" padding="md">
        <CardHeader>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <CardTitle>
                <Text style={[textStyles.h4, { color: colors.foreground }]}>Strategy validation</Text>
              </CardTitle>
              <Text style={[textStyles.caption, { color: colors.mutedForeground, marginTop: spacing[1] }]}>
                Paper rows accumulate while dry-run is on. Compare against live
                fills before flipping the switch.
              </Text>
            </View>
            <View style={styles.headerBadges}>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: dryRun ? colors.success : colors.muted, marginRight: 4 },
                ]}
              >
                <Text
                  style={[
                    textStyles.caption,
                    {
                      color: dryRun ? colors.successForeground : colors.mutedForeground,
                      fontWeight: '700',
                    },
                  ]}
                >
                  dry-run {dryRun ? 'ON' : 'OFF'}
                </Text>
              </View>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: smcEnabled ? colors.success : colors.muted },
                ]}
              >
                <Text
                  style={[
                    textStyles.caption,
                    {
                      color: smcEnabled ? colors.successForeground : colors.mutedForeground,
                      fontWeight: '700',
                    },
                  ]}
                >
                  smc {smcEnabled ? 'ON' : 'OFF'}
                </Text>
              </View>
            </View>
          </View>
        </CardHeader>
        <CardContent>
          {(['paper', 'live'] as const).map((m) => {
            const s = m === 'paper' ? paperStats : liveStats;
            const tone = (s?.pnlTotal ?? 0) >= 0 ? colors.success : colors.destructive;
            return (
              <View
                key={m}
                style={[
                  styles.modeBlock,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <View style={styles.modeBlockHeader}>
                  <View
                    style={[
                      styles.pill,
                      { backgroundColor: m === 'paper' ? colors.muted : colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        textStyles.caption,
                        {
                          color: m === 'paper' ? colors.mutedForeground : colors.primaryForeground,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                        },
                      ]}
                    >
                      {m}
                    </Text>
                  </View>
                  <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>
                    {s?.closedCount ?? 0} closed · {s?.openCount ?? 0} open
                  </Text>
                  <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>
                    win{' '}
                    {s?.winRate != null ? `${Math.round(s.winRate * 100)}%` : '—'}
                  </Text>
                </View>
                <Text style={[textStyles.h2, { color: tone, marginTop: spacing[1] }]}>
                  {formatMoney(s?.pnlTotal ?? 0)}
                </Text>
                <View style={styles.miniGrid}>
                  <MiniStat label="Today" value={formatMoney(s?.pnlToday ?? 0)} colors={colors} />
                  <MiniStat label="7d" value={formatMoney(s?.pnl7d ?? 0)} colors={colors} />
                  <MiniStat
                    label="Avg"
                    value={s?.avgPnl != null ? formatMoney(s.avgPnl) : '—'}
                    colors={colors}
                  />
                  <MiniStat
                    label="Best"
                    value={s?.bestTrade != null ? formatMoney(s.bestTrade) : '—'}
                    colors={colors}
                    valueColor={colors.success}
                  />
                  <MiniStat
                    label="Worst"
                    value={s?.worstTrade != null ? formatMoney(s.worstTrade) : '—'}
                    colors={colors}
                    valueColor={colors.destructive}
                  />
                  <MiniStat label="W / L" value={`${s?.wins ?? 0} / ${s?.losses ?? 0}`} colors={colors} />
                </View>
              </View>
            );
          })}
        </CardContent>
      </Card>

      {/* ── Bot positions ── */}
      <Card style={[styles.card, { backgroundColor: colors.card }]} variant="elevated" padding="md">
        <CardHeader>
          <View style={styles.headerRow}>
            <CardTitle>
              <Text style={[textStyles.h4, { color: colors.foreground }]}>Bot positions</Text>
            </CardTitle>
            <View style={styles.modeToggleRow}>
              {(['paper', 'live'] as ModeFilter[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setModeFilter(m)}
                  style={[
                    styles.modeBtn,
                    {
                      backgroundColor: modeFilter === m ? colors.primary : colors.muted,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      textStyles.caption,
                      {
                        color:
                          modeFilter === m ? colors.primaryForeground : colors.mutedForeground,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      },
                    ]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <EmptyState
              icon="briefcase-outline"
              title="No bot positions"
              description="The bot doesn't hold any positions in this mode right now."
            />
          ) : (
            positions.map((p) => (
              <View
                key={p.id}
                style={[styles.posRow, { borderColor: colors.border, backgroundColor: colors.background }]}
              >
                <View style={styles.posHeader}>
                  <View style={styles.symbolWrap}>
                    <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '700' }]}>
                      {p.symbol}
                    </Text>
                    {p.mode === 'paper' ? (
                      <Chip
                        variant="outlined"
                        size="sm"
                        style={{ borderColor: colors.warning, marginLeft: spacing[1] }}
                      >
                        <Text style={{ color: colors.warning, fontSize: 10, fontWeight: '700' }}>
                          PAPER
                        </Text>
                      </Chip>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: p.side === 'LONG' ? colors.success : colors.destructive,
                      },
                    ]}
                  >
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{p.side}</Text>
                  </View>
                </View>
                <View style={styles.posGrid}>
                  <PosCell label="Entry" value={formatPrice(p.entry_price)} colors={colors} />
                  <PosCell label="SL" value={formatPrice(p.stop_loss)} colors={colors} valueColor={colors.destructive} />
                  <PosCell label="TP" value={formatPrice(p.take_profit)} colors={colors} valueColor={colors.success} />
                  <PosCell label="Qty" value={String(p.quantity)} colors={colors} />
                </View>
                <View style={styles.posFooter}>
                  <Text style={[textStyles.caption, { color: colors.foregroundSubtle }]}>
                    {format(new Date(p.open_time), 'MMM d HH:mm')}
                  </Text>
                  {p.signal_source ? (
                    <Text
                      style={[textStyles.caption, { color: colors.mutedForeground, flex: 1, textAlign: 'right' }]}
                      numberOfLines={1}
                    >
                      {p.signal_source}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Signal feed ── */}
      <Card style={[styles.card, { backgroundColor: colors.card }]} variant="elevated" padding="md">
        <CardHeader>
          <View style={styles.headerRow}>
            <CardTitle>
              <Text style={[textStyles.h4, { color: colors.foreground }]}>Signal feed</Text>
            </CardTitle>
          </View>
          <View style={[styles.filterRow, { marginTop: spacing[2] }]}>
            {(['all', 'tweet', 'news', 'signal'] as FeedFilter[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFeedFilter(f)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: feedFilter === f ? colors.primary : colors.muted,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    textStyles.caption,
                    {
                      color:
                        feedFilter === f ? colors.primaryForeground : colors.mutedForeground,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </CardHeader>
        <CardContent>
          {unifiedFeed.length === 0 ? (
            <EmptyState
              icon="newspaper-outline"
              title="No items yet"
              description="Add X handles below and wait a couple of minutes for the scrapers to run."
            />
          ) : (
            unifiedFeed.map((item) => (
              <View
                key={item.key}
                style={[
                  styles.feedItem,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <View style={styles.feedMetaRow}>
                  <View style={[styles.pill, { backgroundColor: colors.muted }]}>
                    <Text
                      style={[
                        textStyles.caption,
                        {
                          color: colors.mutedForeground,
                          textTransform: 'uppercase',
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {item.kind}
                    </Text>
                  </View>
                  <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>
                    {item.source}
                  </Text>
                  <Text style={[textStyles.caption, { color: colors.foregroundSubtle }]}>
                    {format(new Date(item.at), 'MMM d HH:mm')}
                  </Text>
                  {item.sentiment != null ? (
                    <Text
                      style={[
                        textStyles.caption,
                        {
                          color:
                            item.sentiment > 0.1
                              ? colors.success
                              : item.sentiment < -0.1
                                ? colors.destructive
                                : colors.mutedForeground,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {item.sentiment > 0 ? '+' : ''}
                      {item.sentiment.toFixed(2)}
                    </Text>
                  ) : null}
                  {item.strength != null ? (
                    <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>
                      str {item.strength.toFixed(1)}
                    </Text>
                  ) : null}
                </View>
                {item.symbols.length > 0 ? (
                  <View style={styles.symbolChipsRow}>
                    {item.symbols.slice(0, 4).map((s) => (
                      <View
                        key={s}
                        style={[styles.symbolChip, { borderColor: colors.border }]}
                      >
                        <Text style={[textStyles.caption, { color: colors.foreground }]}>{s}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                <Text
                  style={[textStyles.body, { color: colors.foreground, fontWeight: '600', marginTop: 4 }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                {item.body ? (
                  <Text
                    style={[textStyles.caption, { color: colors.mutedForeground, marginTop: 2 }]}
                    numberOfLines={3}
                  >
                    {item.body}
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Strategy config ── */}
      <Card style={[styles.card, { backgroundColor: colors.card }]} variant="elevated" padding="md">
        <CardHeader>
          <CardTitle>
            <Text style={[textStyles.h4, { color: colors.foreground }]}>Strategy config</Text>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* dry_run + smc toggles */}
          <View style={[styles.toggleRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <View style={styles.toggleText}>
              <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '600' }]}>
                Dry-run (paper mode)
              </Text>
              <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>
                Writes paper rows instead of real Binance orders.
              </Text>
            </View>
            <Switch
              value={config?.dry_run ?? true}
              onChange={(v) => handleToggleFlag('dry_run', v)}
              disabled={savingConfig}
              size="sm"
            />
          </View>
          <View
            style={[
              styles.toggleRow,
              { borderColor: colors.border, backgroundColor: colors.background, marginTop: spacing[2] },
            ]}
          >
            <View style={styles.toggleText}>
              <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '600' }]}>
                SMC strategy
              </Text>
              <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>
                Use the SMC A+ Setup checklist instead of indicator confluence.
              </Text>
            </View>
            <Switch
              value={config?.smc_enabled ?? false}
              onChange={(v) => handleToggleFlag('smc_enabled', v)}
              disabled={savingConfig}
              size="sm"
            />
          </View>

          {/* allowed symbols */}
          <View style={{ marginTop: spacing[3] }}>
            <Text style={[textStyles.caption, { color: colors.mutedForeground, marginBottom: spacing[1] }]}>
              Allowed symbols (comma-separated)
            </Text>
            <TextInput
              value={symbolsDraft}
              onChangeText={setSymbolsDraft}
              placeholder="BTCUSDT, ETHUSDT"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
              ]}
              autoCapitalize="characters"
            />
          </View>

          {/* numeric caps */}
          <View style={[styles.numericRow, { marginTop: spacing[3] }]}>
            <NumericField
              label="Max positions"
              value={maxPositionsDraft}
              onChange={setMaxPositionsDraft}
              colors={colors}
            />
            <NumericField
              label="Max notional"
              value={maxNotionalDraft}
              onChange={setMaxNotionalDraft}
              colors={colors}
            />
            <NumericField
              label="Cooldown (s)"
              value={cooldownDraft}
              onChange={setCooldownDraft}
              colors={colors}
            />
          </View>

          <Button
            variant="primary"
            onPress={handleSaveConfig}
            disabled={savingConfig}
            style={{ marginTop: spacing[3] }}
          >
            <Text style={[textStyles.label, { color: colors.primaryForeground }]}>
              {savingConfig ? 'Saving...' : 'Save config'}
            </Text>
          </Button>

          <Text style={[textStyles.caption, { color: colors.mutedForeground, marginTop: spacing[2] }]}>
            LLM: {config?.llm_model ?? '—'} · Sentiment: {config?.sentiment_model ?? '—'}
          </Text>
        </CardContent>
      </Card>

      {/* ── X / Twitter accounts ── */}
      <Card style={[styles.card, { backgroundColor: colors.card }]} variant="elevated" padding="md">
        <CardHeader>
          <View style={styles.headerRow}>
            <CardTitle>
              <Text style={[textStyles.h4, { color: colors.foreground }]}>X accounts</Text>
            </CardTitle>
            <Button variant="primary" size="sm" onPress={() => setAddOpen(true)}>
              <View style={styles.btnInner}>
                <Ionicons name="add" size={16} color={colors.primaryForeground} />
                <Text
                  style={[textStyles.label, { color: colors.primaryForeground, marginLeft: 4 }]}
                >
                  Add
                </Text>
              </View>
            </Button>
          </View>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <EmptyState
              icon="logo-twitter"
              title="No accounts yet"
              description="Add an X handle to start scraping its timeline for sentiment."
            />
          ) : (
            accounts.map((a) => (
              <View
                key={a.id}
                style={[
                  styles.accountRow,
                  { borderColor: colors.border, backgroundColor: colors.background },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.handleRow}>
                    <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '600' }]}>
                      @{a.handle}
                    </Text>
                    {a.display_name ? (
                      <Text
                        style={[textStyles.caption, { color: colors.mutedForeground, marginLeft: 6 }]}
                        numberOfLines={1}
                      >
                        {a.display_name}
                      </Text>
                    ) : null}
                  </View>
                  {a.last_scraped_at ? (
                    <Text style={[textStyles.caption, { color: colors.foregroundSubtle }]}>
                      Last scraped {format(new Date(a.last_scraped_at), 'MMM d HH:mm')}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => handleRemoveAccount(a.id, a.handle)}>
                  <Ionicons name="trash-outline" size={20} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </CardContent>
      </Card>

      {/* ── Add account modal ── */}
      <Modal
        visible={addOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAddOpen(false)}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.card }, shadow.xl]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[textStyles.h4, { color: colors.foreground }]}>Add X account</Text>
            <View style={{ marginTop: spacing[3] }}>
              <Text style={[textStyles.caption, { color: colors.mutedForeground, marginBottom: spacing[1] }]}>
                Handle (without @)
              </Text>
              <TextInput
                value={newHandle}
                onChangeText={setNewHandle}
                placeholder="elonmusk"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                  },
                ]}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={{ marginTop: spacing[2] }}>
              <Text style={[textStyles.caption, { color: colors.mutedForeground, marginBottom: spacing[1] }]}>
                Display name (optional)
              </Text>
              <TextInput
                value={newDisplayName}
                onChangeText={setNewDisplayName}
                placeholder="Elon Musk"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                  },
                ]}
              />
            </View>
            <View style={[styles.modalActions, { marginTop: spacing[3] }]}>
              <Button
                variant="outline"
                onPress={() => setAddOpen(false)}
                style={styles.flexBtn}
                disabled={adding}
              >
                <Text style={[textStyles.label, { color: colors.foreground }]}>Cancel</Text>
              </Button>
              <Button
                variant="primary"
                onPress={handleAddAccount}
                style={styles.flexBtn}
                disabled={adding}
              >
                <Text style={[textStyles.label, { color: colors.primaryForeground }]}>
                  {adding ? 'Adding...' : 'Add'}
                </Text>
              </Button>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

// ── Local helpers ────────────────────────────────────────────────────

type ColorTokens = ReturnType<typeof useColors>;

function MiniStat({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: ColorTokens;
  valueColor?: string;
}) {
  return (
    <View style={styles.miniStat}>
      <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>{label}</Text>
      <Text
        style={[textStyles.body, { color: valueColor ?? colors.foreground, fontWeight: '600' }]}
      >
        {value}
      </Text>
    </View>
  );
}

function PosCell({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: ColorTokens;
  valueColor?: string;
}) {
  return (
    <View style={styles.posCell}>
      <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>{label}</Text>
      <Text
        style={[textStyles.body, { color: valueColor ?? colors.foreground, fontWeight: '600' }]}
      >
        {value}
      </Text>
    </View>
  );
}

function NumericField({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  colors: ColorTokens;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[textStyles.caption, { color: colors.mutedForeground, marginBottom: spacing[1] }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderRadius: radius.md,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[4],
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: spacing[4],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing[2],
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing[2],
    gap: spacing[2],
  },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing[3],
    minHeight: 72,
    justifyContent: 'space-between',
  },
  enabledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  flexBtn: {
    flex: 1,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeBlock: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing[3],
    marginTop: spacing[2],
  },
  modeBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing[2],
  },
  miniStat: {
    width: '33.33%',
    paddingVertical: 4,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  modeBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
  },
  posRow: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  posHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  symbolWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  posGrid: {
    flexDirection: 'row',
    marginTop: spacing[2],
  },
  posCell: {
    flex: 1,
  },
  posFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
  },
  feedItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  feedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  symbolChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  symbolChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing[3],
  },
  toggleText: {
    flex: 1,
    marginRight: spacing[2],
  },
  numericRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: 14,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing[4],
  },
  modalContent: {
    width: '100%',
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
});

export default TraderTab;
