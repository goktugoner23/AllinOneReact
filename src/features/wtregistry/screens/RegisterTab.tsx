import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl, ScrollView, Linking } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { AddFab } from '@shared/components';
import { Card as UICard, Button, EmptyState, AlertDialog, Dialog } from '@shared/components/ui';
import { useAppTheme, spacing, radius, textStyles } from '@shared/theme';
import { useCurrency } from '@shared/hooks/useCurrency';
import {
  fetchStudents,
  fetchRegistrations,
  addRegistrationWithTransaction,
  updateRegistration,
  deleteRegistrationWithTransactions,
  updateRegistrationPaymentStatus,
} from '@features/wtregistry/services/wtRegistry';
import { WTStudent, WTRegistration } from '@features/wtregistry/types/WTRegistry';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useBalance } from '@features/transactions/store/balanceHooks';
import { AddRegistrationDialog } from '@features/wtregistry/components/AddRegistrationDialog';
import { EditRegistrationDialog } from '@features/wtregistry/components/EditRegistrationDialog';

export const RegisterTab: React.FC = () => {
  const { colors } = useAppTheme();
  const { format: formatCurrency } = useCurrency();
  const [registrations, setRegistrations] = useState<WTRegistration[]>([]);
  const [students, setStudents] = useState<WTStudent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<WTRegistration | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const { refreshBalance } = useBalance();

  const monthNames = [
    'All Months',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const loadData = async () => {
    try {
      const [regData, studentsData] = await Promise.all([fetchRegistrations(), fetchStudents()]);
      setRegistrations(regData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRegistrations = useMemo(() => {
    if (selectedMonth === null) {
      return registrations;
    } else {
      return registrations.filter((registration) => {
        if (registration.startDate) {
          const startDate = new Date(registration.startDate);
          return startDate.getMonth() + 1 === selectedMonth;
        }
        return false;
      });
    }
  }, [registrations, selectedMonth]);

  const totalAmount = filteredRegistrations.reduce((sum: number, reg: WTRegistration) => sum + reg.amount, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddRegistration = async (registrationData: Omit<WTRegistration, 'id'>) => {
    try {
      await addRegistrationWithTransaction(registrationData, registrationData.isPaid);
      setShowAddDialog(false);
      loadData();
    } catch (error) {
      console.error('Error adding registration:', error);
      Alert.alert('Error', 'Failed to add registration');
    }
  };

  const handleUpdateRegistration = async (registration: WTRegistration) => {
    try {
      await updateRegistration(registration);
      setShowEditDialog(false);
      setSelectedRegistration(null);
      loadData();
    } catch (error) {
      console.error('Error updating registration:', error);
      Alert.alert('Error', 'Failed to update registration');
    }
  };

  const handleDeleteRegistration = async (registration: WTRegistration) => {
    setSelectedRegistration(registration);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedRegistration) return;

    try {
      await deleteRegistrationWithTransactions(selectedRegistration.id);
      setShowDeleteDialog(false);
      setSelectedRegistration(null);
      loadData();
    } catch (error) {
      console.error('Error deleting registration:', error);
      Alert.alert('Error', 'Failed to delete registration');
    }
  };

  const getStudentName = (studentId: number) => {
    const student = students.find((s) => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const handleViewAttachment = async (attachmentUri: string) => {
    try {
      setIsDownloading(true);
      await Linking.openURL(attachmentUri);
    } catch (error) {
      console.error('Error handling attachment:', error);
      Alert.alert('Error', 'Failed to open file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePaymentStatusToggle = async (registration: WTRegistration) => {
    try {
      const newIsPaid = !registration.isPaid;
      await updateRegistrationPaymentStatus(registration, newIsPaid, registration.isPaid);
      await loadData();
      refreshBalance();
    } catch (error) {
      console.error('Error toggling payment status:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const renderRegistration = ({ item, index }: { item: WTRegistration; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === filteredRegistrations.length - 1;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          setSelectedRegistration(item);
          setShowDetailsDialog(true);
        }}
        onLongPress={() => {
          setSelectedRegistration(item);
          setShowContextMenu(true);
        }}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginHorizontal: 16,
          backgroundColor: colors.card,
          borderTopLeftRadius: isFirst ? 12 : 0,
          borderTopRightRadius: isFirst ? 12 : 0,
          borderBottomLeftRadius: isLast ? 12 : 0,
          borderBottomRightRadius: isLast ? 12 : 0,
          borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: colors.border,
        }}
      >
        {/* Header Row: Student Name and Status Badge */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: colors.foreground }} numberOfLines={1}>
            {getStudentName(item.studentId)}
          </Text>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handlePaymentStatusToggle(item);
            }}
            style={{
              backgroundColor: item.isPaid ? colors.success : colors.warning,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: item.isPaid ? '#fff' : '#000',
              }}
            >
              {item.isPaid ? 'Paid' : 'Unpaid'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount & Dates Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.primary }}>
            {formatCurrency(item.amount)}
          </Text>
          {item.startDate && (
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
              {new Date(item.startDate).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}
              {item.endDate && ` - ${new Date(item.endDate).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })}`}
            </Text>
          )}
        </View>

        {/* Notes & Attachment Row */}
        {(item.notes || item.attachmentUri) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            {item.notes && (
              <Text style={{ flex: 1, fontSize: 13, color: colors.mutedForeground, fontStyle: 'italic' }} numberOfLines={1}>
                {item.notes}
              </Text>
            )}
            {item.attachmentUri && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleViewAttachment(item.attachmentUri!);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}
              >
                <Ionicons name="document-attach" size={16} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Section */}
      <UICard
        style={{ marginHorizontal: spacing[4], marginTop: spacing[4], marginBottom: spacing[2] }}
        variant="elevated"
      >
        <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[3] }]}>Filters</Text>

        {/* Month Filter Dropdown */}
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing[3],
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.surface,
          }}
          onPress={() => setShowMonthPicker(true)}
        >
          <Text style={[textStyles.body, { color: colors.foreground }]}>{monthNames[selectedMonth || 0]}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.foregroundMuted} />
        </TouchableOpacity>

        {/* Total Amount Display */}
        <View
          style={{ marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: colors.border }}
        >
          <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
            Total Amount
          </Text>
          <Text
            style={[
              textStyles.amount,
              {
                color: totalAmount < 10000 ? colors.destructive : totalAmount < 20000 ? colors.warning : colors.success,
              },
            ]}
          >
            {formatCurrency(totalAmount)}
          </Text>
        </View>
      </UICard>

      <FlashList
        data={filteredRegistrations}
        renderItem={({ item, index }) => renderRegistration({ item, index })}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingTop: spacing[3], paddingBottom: spacing[20] }}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title={selectedMonth ? `No registrations in ${monthNames[selectedMonth]}` : 'No registrations yet'}
            description={
              selectedMonth
                ? 'Try selecting a different month or add a new registration'
                : 'Add your first registration to get started'
            }
            actionLabel="Add Registration"
            onAction={() => setShowAddDialog(true)}
          />
        }
        estimatedItemSize={100}
      />

      <AddFab style={styles.fab} onPress={() => setShowAddDialog(true)} />

      {/* Context Menu */}
      <Dialog
        visible={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        title="Registration Options"
        description="What would you like to do with this registration?"
      >
        <View style={{ flexDirection: 'column', alignItems: 'stretch', gap: spacing[2], marginTop: spacing[4] }}>
          <Button
            variant="outline"
            fullWidth
            onPress={() => {
              setShowContextMenu(false);
              setShowEditDialog(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            fullWidth
            onPress={() => {
              setShowContextMenu(false);
              handleDeleteRegistration(selectedRegistration!);
            }}
          >
            Delete
          </Button>
          <Button variant="ghost" fullWidth onPress={() => setShowContextMenu(false)}>
            Cancel
          </Button>
        </View>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Registration"
        description={`Are you sure you want to delete this registration for ${getStudentName(selectedRegistration?.studentId || 0)}? This will also delete any related transactions.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Details Dialog */}
      <Dialog visible={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} title="Registration Details">
        {selectedRegistration && (
          <View>
            <Text style={[textStyles.h4, { color: colors.foreground, marginBottom: spacing[2] }]}>
              {getStudentName(selectedRegistration.studentId)}
            </Text>
            <Text style={[textStyles.amountSmall, { color: colors.primary, marginBottom: spacing[2] }]}>
              {formatCurrency(selectedRegistration.amount)}
            </Text>
            <Text style={[textStyles.body, { color: colors.foreground, marginBottom: spacing[1] }]}>
              Status: {selectedRegistration.isPaid ? 'Paid' : 'Unpaid'}
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
              Payment Date: {new Date(selectedRegistration.paymentDate).toLocaleDateString()}
            </Text>
            {selectedRegistration.startDate && (
              <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
                Start: {new Date(selectedRegistration.startDate).toLocaleDateString()}
              </Text>
            )}
            {selectedRegistration.endDate && (
              <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
                End: {new Date(selectedRegistration.endDate).toLocaleDateString()}
              </Text>
            )}
            {selectedRegistration.notes && (
              <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
                Notes: {selectedRegistration.notes}
              </Text>
            )}
            {selectedRegistration.attachmentUri && (
              <View
                style={{
                  marginTop: spacing[4],
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={[textStyles.body, { color: colors.foreground }]}>Receipt: Attached</Text>
                <Button
                  variant="outline"
                  size="sm"
                  loading={isDownloading}
                  disabled={isDownloading}
                  onPress={() => {
                    setShowDetailsDialog(false);
                    handleViewAttachment(selectedRegistration.attachmentUri!);
                  }}
                >
                  {isDownloading ? 'Opening...' : 'View Receipt'}
                </Button>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[4], justifyContent: 'flex-end' }}>
              <Button variant="ghost" onPress={() => setShowDetailsDialog(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onPress={() => {
                  setShowDetailsDialog(false);
                  setShowEditDialog(true);
                }}
              >
                Edit
              </Button>
            </View>
          </View>
        )}
      </Dialog>

      {/* Add Registration Dialog */}
      <AddRegistrationDialog
        visible={showAddDialog}
        students={students}
        onDismiss={() => setShowAddDialog(false)}
        onSave={handleAddRegistration}
      />

      {/* Edit Registration Dialog */}
      {selectedRegistration && (
        <EditRegistrationDialog
          visible={showEditDialog}
          registration={selectedRegistration}
          students={students}
          onDismiss={() => {
            setShowEditDialog(false);
            setSelectedRegistration(null);
          }}
          onSave={handleUpdateRegistration}
        />
      )}

      {/* Month Picker Dialog */}
      <Dialog visible={showMonthPicker} onClose={() => setShowMonthPicker(false)} title="Select Month">
        <ScrollView style={{ maxHeight: 300 }}>
          {monthNames.map((month, index) => {
            const isSelected = selectedMonth === index || (index === 0 && selectedMonth === null);
            return (
              <TouchableOpacity
                key={index}
                style={{
                  padding: spacing[4],
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: isSelected ? colors.primaryMuted : 'transparent',
                  borderRadius: isSelected ? radius.md : 0,
                }}
                onPress={() => {
                  setSelectedMonth(index === 0 ? null : index);
                  setShowMonthPicker(false);
                }}
              >
                <Text
                  style={[
                    textStyles.body,
                    {
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={{ marginTop: spacing[4], alignItems: 'flex-end' }}>
          <Button variant="ghost" onPress={() => setShowMonthPicker(false)}>
            Cancel
          </Button>
        </View>
      </Dialog>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    zIndex: 999,
  },
});
