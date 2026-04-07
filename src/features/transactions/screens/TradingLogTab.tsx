import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Chip, EmptyState, SkeletonCard } from '@shared/components/ui';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';
import { TradeLogEntry } from '@features/transactions/types/TradeLog';
import {
  getTradeLog,
  updateTradeNotes,
  deleteTrade,
} from '@features/transactions/services/tradeLog';
import { formatDate } from '@shared/utils/formatters';

type FilterStatus = 'ALL' | 'OPEN' | 'CLOSED';

export const TradingLogTab: React.FC = () => {
  const colors = useColors();
  const [trades, setTrades] = useState<TradeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('ALL');

  // Notes modal state
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [editingTrade, setEditingTrade] = useState<TradeLogEntry | null>(null);
  const [notesText, setNotesText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchTrades = useCallback(async () => {
    try {
      const status = filter === 'ALL' ? undefined : filter;
      const data = await getTradeLog(status);
      setTrades(data);
    } catch (err) {
      console.error('Failed to fetch trade log:', err);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchTrades().finally(() => setLoading(false));
  }, [fetchTrades]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrades();
    setRefreshing(false);
  }, [fetchTrades]);

  const handleDelete = (trade: TradeLogEntry) => {
    Alert.alert('Delete Trade', `Delete ${trade.side} ${trade.symbol}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTrade(trade.id);
            setTrades((prev) => prev.filter((t) => t.id !== trade.id));
          } catch {
            Alert.alert('Error', 'Failed to delete trade');
          }
        },
      },
    ]);
  };

  const handleOpenNotes = (trade: TradeLogEntry) => {
    setEditingTrade(trade);
    setNotesText(trade.notes ?? '');
    setNotesModalVisible(true);
  };

  const handleSaveNotes = async () => {
    if (!editingTrade) return;
    setSavingNotes(true);
    try {
      await updateTradeNotes(editingTrade.id, notesText);
      setTrades((prev) =>
        prev.map((t) => (t.id === editingTrade.id ? { ...t, notes: notesText } : t))
      );
      setNotesModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price == null) return '—';
    if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 8 });
  };

  const formatPnl = (pnl: number | null) => {
    if (pnl == null) return '—';
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const renderTradeCard = ({ item }: { item: TradeLogEntry }) => {
    const isOpen = item.status === 'OPEN';
    const isLong = item.side === 'LONG';
    const pnlColor = item.pnl == null ? colors.mutedForeground : item.pnl >= 0 ? colors.success : colors.destructive;
    const sideColor = isLong ? colors.success : colors.destructive;

    return (
      <Card
        style={[styles.tradeCard, { backgroundColor: colors.card }]}
        variant="elevated"
        padding="md"
      >
        {/* Header: Symbol + Side + Status */}
        <View style={styles.tradeHeader}>
          <View style={styles.symbolRow}>
            <Text style={[textStyles.h4, { color: colors.foreground }]}>{item.symbol}</Text>
            <Chip
              variant="filled"
              size="sm"
              style={{ backgroundColor: sideColor, marginLeft: spacing[2] }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>{item.side}</Text>
            </Chip>
            <Chip
              variant="outlined"
              size="sm"
              style={{ marginLeft: spacing[1], borderColor: colors.border }}
            >
              <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>{item.market_type}</Text>
            </Chip>
          </View>
          <View style={styles.tradeActions}>
            <TouchableOpacity onPress={() => handleOpenNotes(item)} style={styles.actionBtn}>
              <Ionicons
                name={item.notes ? 'document-text' : 'document-text-outline'}
                size={18}
                color={item.notes ? colors.primary : colors.mutedForeground}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Price row */}
        <View style={[styles.priceRow, { marginTop: spacing[2] }]}>
          <View style={styles.priceCol}>
            <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>Entry</Text>
            <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '600' }]}>
              {formatPrice(item.entry_price)}
            </Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>Exit</Text>
            <Text style={[textStyles.body, { color: isOpen ? colors.mutedForeground : colors.foreground, fontWeight: '600' }]}>
              {isOpen ? 'Active' : formatPrice(item.exit_price)}
            </Text>
          </View>
          <View style={styles.priceCol}>
            <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>Qty</Text>
            <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '600' }]}>
              {item.quantity}
            </Text>
          </View>
        </View>

        {/* PnL + Meta */}
        <View style={[styles.pnlRow, { marginTop: spacing[2] }]}>
          <View>
            <Text style={[textStyles.caption, { color: colors.mutedForeground }]}>P&L</Text>
            <Text style={[textStyles.body, { color: pnlColor, fontWeight: '700' }]}>
              {isOpen ? 'Running' : formatPnl(item.pnl)}
            </Text>
          </View>
          {item.leverage > 1 && (
            <Chip variant="outlined" size="sm" style={{ borderColor: colors.warning }}>
              <Text style={{ color: colors.warning, fontSize: 11, fontWeight: '600' }}>{item.leverage}x</Text>
            </Chip>
          )}
          <Text style={[textStyles.caption, { color: colors.foregroundSubtle }]}>
            {formatDate(item.open_time)}
          </Text>
        </View>

        {/* Notes preview */}
        {item.notes ? (
          <Text
            style={[textStyles.caption, { color: colors.mutedForeground, marginTop: spacing[2], fontStyle: 'italic' }]}
            numberOfLines={2}
          >
            {item.notes}
          </Text>
        ) : null}
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: spacing[4] }]}>
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter chips */}
      <View style={[styles.filterRow, { padding: spacing[4], paddingBottom: spacing[2] }]}>
        {(['ALL', 'OPEN', 'CLOSED'] as FilterStatus[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.filterChip,
              {
                backgroundColor: filter === s ? colors.primary : colors.muted,
                borderRadius: radius.full,
              },
            ]}
            onPress={() => setFilter(s)}
          >
            <Text
              style={[
                textStyles.labelSmall,
                { color: filter === s ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlashList
        data={trades}
        renderItem={renderTradeCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: spacing[4], paddingTop: 0, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No Trades"
            description={filter === 'OPEN' ? 'No open positions' : 'Trade history will appear here as positions are opened and closed'}
            style={styles.emptyState}
          />
        }
        showsVerticalScrollIndicator={false}
        estimatedItemSize={180}
      />

      {/* Notes Modal */}
      <Modal
        visible={notesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setNotesModalVisible(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.card }, shadow.xl]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[textStyles.h4, { color: colors.foreground, marginBottom: spacing[3] }]}>
              Trade Notes
            </Text>
            <Text style={[textStyles.caption, { color: colors.mutedForeground, marginBottom: spacing[2] }]}>
              {editingTrade?.side} {editingTrade?.symbol}
            </Text>
            <TextInput
              style={[
                styles.notesInput,
                {
                  color: colors.foreground,
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
              ]}
              value={notesText}
              onChangeText={setNotesText}
              placeholder="Add notes about this trade..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <View style={[styles.modalActions, { marginTop: spacing[3] }]}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.muted, borderRadius: radius.md }]}
                onPress={() => setNotesModalVisible(false)}
              >
                <Text style={[textStyles.label, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary, borderRadius: radius.md }]}
                onPress={handleSaveNotes}
                disabled={savingNotes}
              >
                <Text style={[textStyles.label, { color: colors.primaryForeground }]}>
                  {savingNotes ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  tradeCard: {
    marginBottom: 12,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tradeActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionBtn: {
    padding: 4,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceCol: {
    flex: 1,
  },
  pnlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    minHeight: 400,
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
  notesInput: {
    borderWidth: 1,
    padding: spacing[3],
    minHeight: 120,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalBtn: {
    flex: 1,
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
});

export default TradingLogTab;
