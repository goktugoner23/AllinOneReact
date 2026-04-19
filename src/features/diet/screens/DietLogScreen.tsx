import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Pressable,
  Image,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  EmptyState,
  Dialog,
  Input,
  FullscreenImage,
} from '@shared/components/ui';
import { useColors, spacing, textStyles, radius } from '@shared/theme';
import { useResolvedUri } from '@shared/hooks';
import {
  deleteDietEntry,
  getDietDay,
  updateDietEntry,
} from '@features/diet/services/diet';
import type { DietDayResult, DietLogEntry } from '@features/diet/types/Diet';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(n: number, digits = 0): string {
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

interface MealGroup {
  label: string;
  items: DietLogEntry[];
  totals: { kcal: number; proteinG: number; carbsG: number; fatG: number };
}

function groupByMeal(entries: DietLogEntry[]): MealGroup[] {
  const order: string[] = [];
  const map = new Map<string, DietLogEntry[]>();
  for (const e of entries) {
    const key = e.mealLabel?.trim() || 'Unlabeled';
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(e);
  }
  return order.map(label => {
    const items = map.get(label)!;
    const totals = items.reduce(
      (acc, e) => ({
        kcal: acc.kcal + e.kcal,
        proteinG: acc.proteinG + e.proteinG,
        carbsG: acc.carbsG + e.carbsG,
        fatG: acc.fatG + e.fatG,
      }),
      { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
    return { label, items, totals };
  });
}

export default function DietLogScreen() {
  const colors = useColors();
  const [date, setDate] = useState<string>(todayISO());
  const [data, setData] = useState<DietDayResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<DietLogEntry | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    kcal: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    mealLabel: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxKey, setLightboxKey] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await getDietDay(date);
      setData(res);
    } catch (e) {
      Alert.alert('Diet log', e instanceof Error ? e.message : 'Failed to load.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
    setExpanded(new Set());
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load({ silent: true });
  }, [load]);

  const toggleMeal = (label: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const openEdit = (entry: DietLogEntry) => {
    setEditing(entry);
    setEditForm({
      name: entry.name,
      kcal: String(entry.kcal),
      proteinG: String(entry.proteinG),
      carbsG: String(entry.carbsG),
      fatG: String(entry.fatG),
      mealLabel: entry.mealLabel ?? '',
      notes: entry.notes ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const num = (s: string) => {
      const n = parseFloat(s.replace(/,/g, ''));
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };
    setIsSaving(true);
    try {
      await updateDietEntry(editing.id, {
        name: editForm.name.trim(),
        kcal: num(editForm.kcal),
        proteinG: num(editForm.proteinG),
        carbsG: num(editForm.carbsG),
        fatG: num(editForm.fatG),
        mealLabel: editForm.mealLabel.trim() || null,
        notes: editForm.notes.trim() || null,
      });
      setEditing(null);
      await load({ silent: true });
    } catch (e) {
      Alert.alert('Diet log', e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDietEntry(id);
            await load({ silent: true });
          } catch (e) {
            Alert.alert('Diet log', e instanceof Error ? e.message : 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const totals = data?.totals ?? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const groups = data ? groupByMeal(data.entries) : [];

  const onChangeDate = (_event: unknown, picked?: Date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
    if (picked) {
      setDate(picked.toISOString().slice(0, 10));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Date picker row */}
        <View style={styles.dateRow}>
          <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>DATE</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.foreground} />
            <Text style={[textStyles.body, { color: colors.foreground }]}>{date}</Text>
          </Pressable>
        </View>
        {showDatePicker && (
          <DateTimePicker
            value={new Date(date)}
            mode="date"
            onChange={onChangeDate}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          />
        )}

        {/* Daily totals */}
        <View style={styles.totalsGrid}>
          <TotalCard label="Calories" value={fmt(totals.kcal)} hint="kcal" />
          <TotalCard label="Protein" value={`${fmt(totals.proteinG, 1)} g`} />
          <TotalCard label="Carbs" value={`${fmt(totals.carbsG, 1)} g`} />
          <TotalCard label="Fat" value={`${fmt(totals.fatG, 1)} g`} />
        </View>

        {loading ? (
          <Text style={{ color: colors.foregroundMuted, padding: spacing[6], textAlign: 'center' }}>
            Loading…
          </Text>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="restaurant-outline"
            title={`Nothing logged for ${date}`}
            description="Send Muninn a meal photo in chat to log conversationally — it'll fill the macros automatically."
          />
        ) : (
          groups.map(group => {
            const isOpen = expanded.has(group.label);
            return (
              <Card key={group.label} style={styles.mealCard}>
                <Pressable onPress={() => toggleMeal(group.label)}>
                  <CardHeader style={styles.mealHeader}>
                    <View style={styles.mealHeaderLeft}>
                      <Ionicons
                        name={isOpen ? 'chevron-down' : 'chevron-forward'}
                        size={16}
                        color={colors.foregroundMuted}
                      />
                      <Text style={[textStyles.h4, { color: colors.foreground }]}>
                        {group.label}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: colors.muted }]}>
                        <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>
                          {group.items.length}
                        </Text>
                      </View>
                    </View>
                    <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>
                      {fmt(group.totals.kcal)} kcal · {fmt(group.totals.proteinG, 1)}g P
                    </Text>
                  </CardHeader>
                </Pressable>
                {isOpen ? (
                  <CardContent style={styles.mealContent}>
                    {group.items.map(entry => (
                      <DietEntryRow
                        key={entry.id}
                        entry={entry}
                        onEdit={() => openEdit(entry)}
                        onDelete={() => confirmDelete(entry.id)}
                        onPhoto={key => setLightboxKey(key)}
                      />
                    ))}
                  </CardContent>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Edit dialog */}
      <Dialog
        visible={!!editing}
        onClose={() => setEditing(null)}
        title="Edit entry"
      >
        <View style={styles.dialogBody}>
          <FormRow label="Name">
            <Input value={editForm.name} onChangeText={v => setEditForm(f => ({ ...f, name: v }))} />
          </FormRow>
          <View style={styles.row2}>
            <View style={styles.col}>
              <FormRow label="Kcal">
                <Input
                  value={editForm.kcal}
                  onChangeText={v => setEditForm(f => ({ ...f, kcal: v }))}
                  keyboardType="numeric"
                />
              </FormRow>
            </View>
            <View style={styles.col}>
              <FormRow label="Meal label">
                <Input
                  value={editForm.mealLabel}
                  onChangeText={v => setEditForm(f => ({ ...f, mealLabel: v }))}
                  placeholder="e.g. Meal 1"
                />
              </FormRow>
            </View>
          </View>
          <View style={styles.row2}>
            <View style={styles.col}>
              <FormRow label="Protein (g)">
                <Input
                  value={editForm.proteinG}
                  onChangeText={v => setEditForm(f => ({ ...f, proteinG: v }))}
                  keyboardType="numeric"
                />
              </FormRow>
            </View>
            <View style={styles.col}>
              <FormRow label="Carbs (g)">
                <Input
                  value={editForm.carbsG}
                  onChangeText={v => setEditForm(f => ({ ...f, carbsG: v }))}
                  keyboardType="numeric"
                />
              </FormRow>
            </View>
          </View>
          <FormRow label="Fat (g)">
            <Input
              value={editForm.fatG}
              onChangeText={v => setEditForm(f => ({ ...f, fatG: v }))}
              keyboardType="numeric"
            />
          </FormRow>
          <FormRow label="Notes">
            <Input value={editForm.notes} onChangeText={v => setEditForm(f => ({ ...f, notes: v }))} />
          </FormRow>
          <View style={styles.dialogActions}>
            <Button variant="outline" onPress={() => setEditing(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onPress={saveEdit} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </View>
        </View>
      </Dialog>

      {/* Image lightbox */}
      <LightboxModal
        photoKey={lightboxKey}
        onClose={() => setLightboxKey(null)}
      />
    </View>
  );
}

// ── Subcomponents ──────────────────────────────────────────

function TotalCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.totalCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={[textStyles.caption, { color: colors.foregroundMuted, letterSpacing: 1 }]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[textStyles.h3, { color: colors.foreground }]}>{value}</Text>
      {hint ? (
        <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

function DietEntryRow({
  entry,
  onEdit,
  onDelete,
  onPhoto,
}: {
  entry: DietLogEntry;
  onEdit: () => void;
  onDelete: () => void;
  onPhoto: (key: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.entryRow, { backgroundColor: colors.muted }]}>
      {entry.photoKeys.length > 0 ? (
        <View style={styles.thumbsRow}>
          {entry.photoKeys.map((key, i) => (
            <DietThumb key={`${key}-${i}`} photoKey={key} onPress={() => onPhoto(key)} />
          ))}
        </View>
      ) : null}
      <View style={styles.entryBody}>
        <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '600' }]}>
          {entry.name}
        </Text>
        <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>
          {fmt(entry.kcal)} kcal · {fmt(entry.proteinG, 1)}g P · {fmt(entry.carbsG, 1)}g C ·{' '}
          {fmt(entry.fatG, 1)}g F
        </Text>
        {entry.notes ? (
          <Text style={[textStyles.caption, { color: colors.foregroundMuted, fontStyle: 'italic' }]}>
            {entry.notes}
          </Text>
        ) : null}
      </View>
      <View style={styles.entryActions}>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Ionicons name="pencil-outline" size={18} color={colors.foregroundMuted} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

function DietThumb({ photoKey, onPress }: { photoKey: string; onPress: () => void }) {
  const uri = useResolvedUri(photoKey);
  return (
    <Pressable onPress={onPress}>
      <Image source={{ uri }} style={styles.thumb} />
    </Pressable>
  );
}

function LightboxModal({
  photoKey,
  onClose,
}: {
  photoKey: string | null;
  onClose: () => void;
}) {
  const uri = useResolvedUri(photoKey ?? undefined);
  if (!photoKey) return null;
  return <FullscreenImage uri={uri ?? ''} onClose={onClose} />;
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.formRow}>
      <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>{label}</Text>
      {children}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing[4], gap: spacing[4] },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderRadius: radius.lg,
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  totalCard: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: spacing[3],
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: spacing[1],
  },
  mealCard: {
    marginBottom: spacing[2],
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  mealContent: {
    gap: spacing[3],
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: spacing[1],
    flexWrap: 'wrap',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  entryBody: {
    flex: 1,
    gap: 2,
  },
  entryActions: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
  },
  dialogBody: {
    gap: spacing[3],
  },
  row2: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  col: {
    flex: 1,
  },
  formRow: {
    gap: spacing[1],
  },
});
