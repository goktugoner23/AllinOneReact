import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Alert, ScrollView, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  Card,
  CardContent,
  Dialog,
  Input,
  Button,
  Switch,
  Chip,
  IconButton,
  AlertDialog,
} from '@shared/components/ui';
import { AddFab } from '@shared/components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import { addRegistration, updateRegistration, deleteRegistration } from '@features/wtregistry/store/wtRegistrySlice';
import { WTRegistration, WTStudent } from '@features/wtregistry/types/WTRegistry';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppTheme, spacing, radius, textStyles } from '@shared/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Helper to convert string | Date to Date
const toDate = (date: string | Date): Date => {
  if (typeof date === 'string') return new Date(date);
  return date;
};

// Placeholder functions for file operations (not yet fully implemented)
const pickDocument = async (): Promise<{ uri: string; name?: string } | null> => {
  Alert.alert('Not Available', 'Document picker is not yet implemented');
  return null;
};

const isValidReceiptFile = (fileName: string): boolean => {
  const ext = fileName.toLowerCase().split('.').pop();
  return ['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'webp'].includes(ext || '');
};

const isFileDownloaded = async (_uri: string): Promise<boolean> => false;
const getLocalFileUri = async (_uri: string): Promise<string | null> => null;
const openFile = async (_localUri: string, _fileName: string): Promise<void> => {
  Alert.alert('Not Available', 'File viewer is not yet implemented');
};
const downloadAndOpenFile = async (_uri: string): Promise<void> => {
  Alert.alert('Not Available', 'File download is not yet implemented');
};

export function RegisterTab() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useAppTheme();
  const { students, registrations, loading } = useSelector((state: RootState) => state.wtRegistry);

  const [showDialog, setShowDialog] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<WTRegistration | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<WTRegistration | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    studentId: 0,
    amount: '',
    startDate: new Date(),
    endDate: new Date(),
    notes: '',
    isPaid: false,
    attachmentUri: '',
  });

  const monthNames = [
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

  const filteredRegistrations = useMemo(() => {
    return registrations
      .filter((registration) => {
        const regDate = toDate(registration.paymentDate);
        return regDate.getMonth() === filterMonth && regDate.getFullYear() === filterYear;
      })
      .map((registration) => ({
        ...registration,
        studentName: students.find((s) => s.id === registration.studentId)?.name || 'Unknown Student',
      }))
      .sort((a, b) => toDate(b.paymentDate).getTime() - toDate(a.paymentDate).getTime());
  }, [registrations, students, filterMonth, filterYear]);

  const totalAmount = filteredRegistrations.reduce((sum, reg) => sum + reg.amount, 0);
  const paidAmount = filteredRegistrations.filter((reg) => reg.isPaid).reduce((sum, reg) => sum + reg.amount, 0);
  const unpaidAmount = totalAmount - paidAmount;

  const handleOpenDialog = (registration?: WTRegistration) => {
    if (registration) {
      setEditingRegistration(registration);
      setFormData({
        studentId: registration.studentId,
        amount: registration.amount.toString(),
        startDate: registration.startDate ? toDate(registration.startDate) : new Date(),
        endDate: registration.endDate ? toDate(registration.endDate) : new Date(),
        notes: registration.notes || '',
        isPaid: registration.isPaid,
        attachmentUri: registration.attachmentUri || '',
      });
    } else {
      setEditingRegistration(null);
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      setFormData({
        studentId: 0,
        amount: '',
        startDate: now,
        endDate: nextMonth,
        notes: '',
        isPaid: false,
        attachmentUri: '',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingRegistration(null);
    setShowDatePicker(null);
  };

  const handlePickAttachment = async () => {
    try {
      const result = await pickDocument();

      if (result && result.uri) {
        const fileName = result.name || result.uri.split('/').pop() || '';

        if (isValidReceiptFile(fileName)) {
          setFormData({
            ...formData,
            attachmentUri: result.uri,
          });
        } else {
          Alert.alert('Invalid File Type', 'Please select only PDF or image files (JPG, PNG, BMP, WEBP).');
        }
      }
    } catch (error) {
      console.error('DocumentPicker Error: ', error);
      Alert.alert('Error', 'Failed to pick attachment');
    }
  };

  const handleSave = async () => {
    if (formData.studentId === 0) {
      Alert.alert('Error', 'Please select a student');
      return;
    }
    if (!formData.amount.trim() || isNaN(parseFloat(formData.amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      const registrationData = {
        studentId: formData.studentId,
        amount: parseFloat(formData.amount),
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes,
        isPaid: formData.isPaid,
        attachmentUri: formData.attachmentUri,
      };

      if (editingRegistration) {
        await dispatch(
          updateRegistration({
            ...editingRegistration,
            ...registrationData,
          }),
        ).unwrap();
      } else {
        await dispatch(addRegistration(registrationData)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      Alert.alert('Error', 'Failed to save registration');
    }
  };

  const handleDelete = (registration: WTRegistration) => {
    setSelectedRegistration(registration);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedRegistration) return;

    try {
      await dispatch(deleteRegistration(selectedRegistration.id)).unwrap();
      setShowDeleteDialog(false);
      setSelectedRegistration(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete registration');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate && showDatePicker) {
      setFormData({
        ...formData,
        [showDatePicker === 'start' ? 'startDate' : 'endDate']: selectedDate,
      });
    }
    setShowDatePicker(null);
  };

  const handleLongPress = (registration: WTRegistration) => {
    setSelectedRegistration(registration);
    setShowContextMenu(true);
  };

  const handleCardPress = (registration: WTRegistration) => {
    setSelectedRegistration(registration);
    setShowDetailsDialog(true);
  };

  const handleViewAttachment = async (attachmentUri: string) => {
    try {
      setIsDownloading(true);

      // Check if file is already downloaded
      const isDownloaded = await isFileDownloaded(attachmentUri);

      if (isDownloaded) {
        // File is already downloaded, open it directly
        const localUri = await getLocalFileUri(attachmentUri);
        if (localUri) {
          await openFile(localUri, attachmentUri.split('/').pop() || 'file');
        }
      } else {
        // Download and open the file
        await downloadAndOpenFile(attachmentUri);
      }
    } catch (error) {
      console.error('Error handling attachment:', error);
      Alert.alert('Error', 'Failed to open file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderRegistrationCard = ({ item: registration }: { item: WTRegistration & { studentName: string } }) => {
    return (
      <TouchableOpacity
        onPress={() => handleCardPress(registration)}
        onLongPress={() => handleLongPress(registration)}
        activeOpacity={0.7}
      >
        <Card style={styles.registrationCard} variant="outlined">
          <CardContent style={styles.cardContent}>
            {/* Header Row: Student Name and Status Chip */}
            <View style={styles.cardHeader}>
              <Text style={[textStyles.bodyLarge, styles.studentName, { color: colors.foreground }]}>
                {registration.studentName}
              </Text>
              <Chip
                variant="filled"
                color={registration.isPaid ? 'success' : 'error'}
                size="sm"
                style={styles.statusChip}
              >
                {registration.isPaid ? 'Paid' : 'Unpaid'}
              </Chip>
            </View>

            {/* Amount */}
            <Text style={[textStyles.bodyLarge, styles.amount, { color: colors.primary }]}>
              Amount: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(registration.amount)}
            </Text>

            {/* Date Information */}
            {registration.startDate && (
              <Text style={[textStyles.body, styles.dateInfo, { color: colors.foregroundMuted }]}>
                Start: {toDate(registration.startDate).toLocaleDateString()}
              </Text>
            )}
            {registration.endDate && (
              <Text style={[textStyles.body, styles.dateInfo, { color: colors.foregroundMuted }]}>
                End: {toDate(registration.endDate).toLocaleDateString()}
              </Text>
            )}

            {/* Notes */}
            {registration.notes && (
              <Text style={[textStyles.bodySmall, styles.notes, { color: colors.foregroundMuted }]}>
                {registration.notes}
              </Text>
            )}

            {/* Attachment Indicator */}
            {registration.attachmentUri && (
              <View style={styles.attachmentIndicator}>
                <IconButton
                  icon={isDownloading ? 'sync' : 'attach'}
                  size="sm"
                  onPress={() => handleViewAttachment(registration.attachmentUri!)}
                  disabled={isDownloading}
                />
                <Text style={[textStyles.bodySmall, styles.attachmentText, { color: colors.foregroundMuted }]}>
                  {isDownloading ? 'Opening...' : 'Receipt attached'}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[textStyles.body, styles.loadingText, { color: colors.foregroundMuted }]}>Loading registrations...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => setShowMonthMenu(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing[2],
              paddingHorizontal: spacing[3],
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              gap: spacing[2],
            }}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[textStyles.body, { color: colors.foreground }]}>
              {monthNames[filterMonth]} {filterYear}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Total</Text>
            <Text style={[textStyles.bodyLarge, { color: colors.foreground }]}>
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalAmount)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Paid</Text>
            <Text style={[textStyles.bodyLarge, { color: colors.success }]}>
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(paidAmount)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>Unpaid</Text>
            <Text style={[textStyles.bodyLarge, { color: colors.destructive }]}>
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(unpaidAmount)}
            </Text>
          </View>
        </View>
      </View>

      <FlashList
        data={filteredRegistrations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRegistrationCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[textStyles.bodyLarge, styles.emptyText, { color: colors.foreground }]}>
              No registrations found for {monthNames[filterMonth]} {filterYear}
            </Text>
            <Text style={[textStyles.body, styles.emptySubtext, { color: colors.foregroundMuted }]}>
              Tap the + button to add a new registration
            </Text>
          </View>
        }
        estimatedItemSize={120}
      />

      <AddFab style={styles.fab} onPress={() => handleOpenDialog()} />

      {/* Add/Edit Registration Dialog */}
      <Dialog
        visible={showDialog}
        onClose={handleCloseDialog}
        title={editingRegistration ? 'Edit Registration' : 'Add Registration'}
      >
        <ScrollView style={{ maxHeight: 400 }}>
          <View style={styles.dialogContent}>
            {/* Student Selection */}
            <Text style={[textStyles.label, styles.sectionTitle, { color: colors.foreground }]}>
              Student *
            </Text>
            <View style={styles.studentSelector}>
              {students
                .filter((s) => s.isActive)
                .map((student) => (
                  <Chip
                    key={student.id}
                    variant={formData.studentId === student.id ? 'filled' : 'outlined'}
                    selected={formData.studentId === student.id}
                    onPress={() => setFormData({ ...formData, studentId: student.id })}
                    color={formData.studentId === student.id ? 'primary' : 'default'}
                    style={styles.studentChip}
                  >
                    {student.name}
                  </Chip>
                ))}
            </View>

            {/* Amount */}
            <Input
              label="Amount *"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              keyboardType="numeric"
            />

            {/* Date Selection */}
            <Text style={[textStyles.label, styles.sectionTitle, { color: colors.foreground }]}>
              Registration Period
            </Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity
                onPress={() => setShowDatePicker('start')}
                style={[styles.dateButton, { borderColor: colors.border }]}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={[textStyles.bodySmall, { color: colors.foreground }]}>
                  Start: {formData.startDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDatePicker('end')}
                style={[styles.dateButton, { borderColor: colors.border }]}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={[textStyles.bodySmall, { color: colors.foreground }]}>
                  End: {formData.endDate.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <Input
              label="Notes"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
            />

            {/* Payment Status */}
            <Switch
              value={formData.isPaid}
              onChange={(value) => setFormData({ ...formData, isPaid: value })}
              label="Paid"
            />

            {/* Receipt/Attachment section (only show if paid) */}
            {formData.isPaid && (
              <>
                <Text style={[textStyles.label, styles.sectionTitle, { color: colors.foreground }]}>
                  Receipt/Attachment
                </Text>
                <View style={styles.attachmentContainer}>
                  <Button
                    variant="outline"
                    onPress={handlePickAttachment}
                    style={styles.attachmentButtonStyle}
                  >
                    {formData.attachmentUri ? 'Change Receipt' : 'Add Receipt'}
                  </Button>

                  {formData.attachmentUri && (
                    <IconButton
                      icon="close-circle"
                      size="sm"
                      onPress={() => setFormData({ ...formData, attachmentUri: '' })}
                    />
                  )}
                </View>

                {formData.attachmentUri && (
                  <Text style={[textStyles.bodySmall, styles.attachmentTextDialog, { color: colors.foregroundMuted }]}>
                    File selected: {formData.attachmentUri.split('/').pop() || 'Unknown'}
                  </Text>
                )}
              </>
            )}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[4], justifyContent: 'flex-end' }}>
          <Button variant="ghost" onPress={handleCloseDialog}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave}>
            {editingRegistration ? 'Update' : 'Add'}
          </Button>
        </View>
      </Dialog>

      {/* Context Menu */}
      <Dialog
        visible={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        title="Registration Options"
      >
        {selectedRegistration && (
          <View style={{ flexDirection: 'column', gap: spacing[2], marginTop: spacing[4] }}>
            <Button
              variant="outline"
              fullWidth
              onPress={() => {
                setShowContextMenu(false);
                handleOpenDialog(selectedRegistration);
              }}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              fullWidth
              onPress={() => {
                setShowContextMenu(false);
                handleDelete(selectedRegistration);
              }}
            >
              Delete
            </Button>
            {selectedRegistration.attachmentUri && (
              <Button
                variant="outline"
                fullWidth
                onPress={() => {
                  setShowContextMenu(false);
                  handleViewAttachment(selectedRegistration.attachmentUri!);
                }}
              >
                View Attachment
              </Button>
            )}
            <Button variant="ghost" fullWidth onPress={() => setShowContextMenu(false)}>
              Cancel
            </Button>
          </View>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Registration"
        description={`Are you sure you want to delete this registration for ${selectedRegistration?.studentName}? This will also delete any related transactions.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Details Dialog */}
      <Dialog visible={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} title="Registration Details">
        {selectedRegistration && (
          <View>
            <Text style={[textStyles.bodyLarge, styles.detailTitle, { color: colors.foreground }]}>
              {selectedRegistration.studentName}
            </Text>
            <Text style={[textStyles.bodyLarge, styles.detailAmount, { color: colors.primary }]}>
              Amount:{' '}
              {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                selectedRegistration.amount,
              )}
            </Text>
            <Text style={[textStyles.body, styles.detailText, { color: colors.foreground }]}>
              Status: {selectedRegistration.isPaid ? 'Paid' : 'Unpaid'}
            </Text>
            <Text style={[textStyles.body, styles.detailText, { color: colors.foregroundMuted }]}>
              Payment Date: {toDate(selectedRegistration.paymentDate).toLocaleDateString()}
            </Text>
            {selectedRegistration.startDate && (
              <Text style={[textStyles.body, styles.detailText, { color: colors.foregroundMuted }]}>
                Start: {toDate(selectedRegistration.startDate).toLocaleDateString()}
              </Text>
            )}
            {selectedRegistration.endDate && (
              <Text style={[textStyles.body, styles.detailText, { color: colors.foregroundMuted }]}>
                End: {toDate(selectedRegistration.endDate).toLocaleDateString()}
              </Text>
            )}
            {selectedRegistration.notes && (
              <Text style={[textStyles.body, styles.detailText, { color: colors.foregroundMuted }]}>
                Notes: {selectedRegistration.notes}
              </Text>
            )}
            {selectedRegistration.attachmentUri && (
              <View style={styles.detailAttachment}>
                <Text style={[textStyles.body, styles.detailText, { color: colors.foreground }]}>
                  Receipt: Attached
                </Text>
                <Button
                  variant="outline"
                  onPress={() => {
                    setShowDetailsDialog(false);
                    handleViewAttachment(selectedRegistration.attachmentUri!);
                  }}
                  loading={isDownloading}
                  disabled={isDownloading}
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
                  handleOpenDialog(selectedRegistration!);
                }}
              >
                Edit
              </Button>
            </View>
          </View>
        )}
      </Dialog>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'start' ? formData.startDate : formData.endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Month Picker Dialog */}
      <Dialog visible={showMonthMenu} onClose={() => setShowMonthMenu(false)} title="Select Month">
        <ScrollView style={{ maxHeight: 300 }}>
          {monthNames.map((month, index) => {
            const isSelected = filterMonth === index;
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
                  setFilterMonth(index);
                  setShowMonthMenu(false);
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
          <Button variant="ghost" onPress={() => setShowMonthMenu(false)}>
            Cancel
          </Button>
        </View>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  filterContainer: {
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  summaryItem: {
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  registrationCard: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  amount: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  dateInfo: {
    marginBottom: 2,
  },
  notes: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  studentSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  studentChip: {
    margin: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  attachmentText: {
    marginLeft: 4,
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  attachmentButtonStyle: {
    flex: 1,
  },
  attachmentTextDialog: {
    marginTop: 8,
  },
  detailTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailAmount: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailText: {
    marginBottom: 4,
  },
  detailAttachment: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    textAlign: 'center',
  },
  dialogContent: {
    paddingBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
});
