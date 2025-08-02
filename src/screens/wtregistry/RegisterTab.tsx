import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Card,
  Text,
  FAB,
  Portal,
  Dialog,
  TextInput,
  Button,
  Switch,
  Chip,
  IconButton,
  Menu,
  useTheme,
  Surface,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { addRegistration, updateRegistration, deleteRegistration } from '../../store/wtRegistrySlice';
import { WTRegistration, WTStudent } from '../../types/WTRegistry';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { downloadAndOpenFile, isFileDownloaded, getLocalFileUri, openFile } from '../../utils/fileUtils';

export function RegisterTab() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
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
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filteredRegistrations = useMemo(() => {
    return registrations
      .filter(registration => {
        const regDate = registration.paymentDate;
        return regDate.getMonth() === filterMonth && regDate.getFullYear() === filterYear;
      })
      .map(registration => ({
        ...registration,
        studentName: students.find(s => s.id === registration.studentId)?.name || 'Unknown Student'
      }))
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  }, [registrations, students, filterMonth, filterYear]);

  const totalAmount = filteredRegistrations.reduce((sum, reg) => sum + reg.amount, 0);
  const paidAmount = filteredRegistrations.filter(reg => reg.isPaid).reduce((sum, reg) => sum + reg.amount, 0);
  const unpaidAmount = totalAmount - paidAmount;

  const handleOpenDialog = (registration?: WTRegistration) => {
    if (registration) {
      setEditingRegistration(registration);
      setFormData({
        studentId: registration.studentId,
        amount: registration.amount.toString(),
        startDate: registration.startDate || new Date(),
        endDate: registration.endDate || new Date(),
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
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData({
          ...formData,
          attachmentUri: result.assets[0].uri,
        });
      }
    } catch (error) {
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
        await dispatch(updateRegistration({
          ...editingRegistration,
          ...registrationData,
        })).unwrap();
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
      <Card 
        style={[styles.registrationCard, { backgroundColor: theme.colors.surface }]} 
        mode="outlined"
        onPress={() => handleCardPress(registration)}
        onLongPress={() => handleLongPress(registration)}
      >
        <Card.Content style={styles.cardContent}>
          {/* Header Row: Student Name and Status Chip */}
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.studentName}>
              {registration.studentName}
            </Text>
            <Chip
              mode="outlined"
              style={[
                styles.statusChip,
                { 
                  backgroundColor: registration.isPaid 
                    ? theme.colors.primaryContainer 
                    : theme.colors.errorContainer 
                }
              ]}
              textStyle={{ 
                color: registration.isPaid 
                  ? theme.colors.onPrimaryContainer 
                  : theme.colors.onErrorContainer 
              }}
            >
              {registration.isPaid ? 'Paid' : 'Unpaid'}
            </Chip>
          </View>

          {/* Amount */}
          <Text variant="bodyLarge" style={styles.amount}>
            Amount: ${registration.amount.toFixed(2)}
          </Text>

          {/* Date Information */}
          {registration.startDate && (
            <Text variant="bodyMedium" style={styles.dateInfo}>
              Start: {registration.startDate.toLocaleDateString()}
            </Text>
          )}
          {registration.endDate && (
            <Text variant="bodyMedium" style={styles.dateInfo}>
              End: {registration.endDate.toLocaleDateString()}
            </Text>
          )}

          {/* Notes */}
          {registration.notes && (
            <Text variant="bodySmall" style={styles.notes}>
              {registration.notes}
            </Text>
          )}

          {/* Attachment Indicator */}
          {registration.attachmentUri && (
            <View style={styles.attachmentIndicator}>
              <IconButton
                icon={isDownloading ? "loading" : "attachment"}
                size={16}
                onPress={() => handleViewAttachment(registration.attachmentUri!)}
                disabled={isDownloading}
              />
              <Text variant="bodySmall" style={styles.attachmentText}>
                {isDownloading ? 'Opening...' : 'Receipt attached'}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading registrations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <View style={styles.filterContainer}>
          <Menu
            visible={showMonthMenu}
            onDismiss={() => setShowMonthMenu(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setShowMonthMenu(true)}
                icon="calendar"
              >
                {monthNames[filterMonth]} {filterYear}
              </Button>
            }
          >
            {monthNames.map((month, index) => (
              <Menu.Item
                key={index}
                onPress={() => {
                  setFilterMonth(index);
                  setShowMonthMenu(false);
                }}
                title={month}
              />
            ))}
          </Menu>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall">Total</Text>
            <Text variant="titleMedium">${totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall">Paid</Text>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              ${paidAmount.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text variant="bodySmall">Unpaid</Text>
            <Text variant="titleMedium" style={{ color: theme.colors.error }}>
              ${unpaidAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </Surface>

      <FlatList
        data={filteredRegistrations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRegistrationCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No registrations found for {monthNames[filterMonth]} {filterYear}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap the + button to add a new registration
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleOpenDialog()}
      />

      {/* Add/Edit Registration Dialog */}
      <Portal>
        <Dialog visible={showDialog} onDismiss={handleCloseDialog} style={[styles.dialog, { backgroundColor: 'white' }]}>
          <Dialog.Title>{editingRegistration ? 'Edit Registration' : 'Add Registration'}</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogContent}>
              {/* Student Selection */}
              <Text variant="bodyMedium" style={styles.sectionTitle}>Student *</Text>
              <View style={styles.studentSelector}>
                {students.filter(s => s.isActive).map(student => (
                  <Chip
                    key={student.id}
                    mode={formData.studentId === student.id ? 'flat' : 'outlined'}
                    selected={formData.studentId === student.id}
                    onPress={() => setFormData({ ...formData, studentId: student.id })}
                    style={styles.studentChip}
                  >
                    {student.name}
                  </Chip>
                ))}
              </View>

              {/* Amount */}
              <TextInput
                label="Amount *"
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                left={<TextInput.Icon icon="currency-usd" />}
              />

              {/* Date Selection */}
              <Text variant="bodyMedium" style={styles.sectionTitle}>Registration Period</Text>
              <View style={styles.dateContainer}>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker('start')}
                  style={styles.dateButton}
                  icon="calendar"
                >
                  Start: {formData.startDate.toLocaleDateString()}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker('end')}
                  style={styles.dateButton}
                  icon="calendar"
                >
                  End: {formData.endDate.toLocaleDateString()}
                </Button>
              </View>

              {/* Notes */}
              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />

              {/* Payment Status */}
              <View style={styles.switchContainer}>
                <Text variant="bodyMedium">Paid</Text>
                <Switch
                  value={formData.isPaid}
                  onValueChange={(value) => setFormData({ ...formData, isPaid: value })}
                />
              </View>

              {/* Receipt/Attachment section (only show if paid) */}
              {formData.isPaid && (
                <>
                  <Text variant="bodyMedium" style={styles.sectionTitle}>Receipt/Attachment</Text>
                  <View style={styles.attachmentContainer}>
                    <Button
                      mode="outlined"
                      onPress={handlePickAttachment}
                      icon="attachment"
                      style={styles.attachmentButton}
                    >
                      {formData.attachmentUri ? 'Change Receipt' : 'Add Receipt'}
                    </Button>
                    
                    {formData.attachmentUri && (
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={() => setFormData({ ...formData, attachmentUri: '' })}
                      />
                    )}
                  </View>
                  
                  {formData.attachmentUri && (
                    <Text variant="bodySmall" style={styles.attachmentTextDialog}>
                      File selected: {formData.attachmentUri.split('/').pop() || 'Unknown'}
                    </Text>
                  )}
                </>
              )}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDialog}>Cancel</Button>
            <Button onPress={handleSave} mode="contained">
              {editingRegistration ? 'Update' : 'Add'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Context Menu */}
      <Portal>
        <Menu
          visible={showContextMenu}
          onDismiss={() => setShowContextMenu(false)}
          anchor={{ x: 0, y: 0 }}
        >
          {selectedRegistration && (
            <>
              <Menu.Item
                onPress={() => {
                  setShowContextMenu(false);
                  handleOpenDialog(selectedRegistration);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setShowContextMenu(false);
                  handleDelete(selectedRegistration);
                }}
                title="Delete"
                leadingIcon="delete"
              />
              {selectedRegistration.attachmentUri && (
                <Menu.Item
                  onPress={() => {
                    setShowContextMenu(false);
                    handleViewAttachment(selectedRegistration.attachmentUri!);
                  }}
                  title="View Attachment"
                  leadingIcon="attachment"
                />
              )}
            </>
          )}
        </Menu>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)} style={{ backgroundColor: 'white' }}>
          <Dialog.Title>Delete Registration</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete this registration for {selectedRegistration?.studentName}? 
              This will also delete any related transactions.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={confirmDelete} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Details Dialog */}
      <Portal>
        <Dialog visible={showDetailsDialog} onDismiss={() => setShowDetailsDialog(false)} style={{ backgroundColor: 'white' }}>
          <Dialog.Title>Registration Details</Dialog.Title>
          <Dialog.Content>
            {selectedRegistration && (
              <View>
                <Text variant="titleMedium" style={styles.detailTitle}>
                  {selectedRegistration.studentName}
                </Text>
                <Text variant="bodyLarge" style={styles.detailAmount}>
                  Amount: ${selectedRegistration.amount.toFixed(2)}
                </Text>
                <Text variant="bodyMedium" style={styles.detailText}>
                  Status: {selectedRegistration.isPaid ? 'Paid' : 'Unpaid'}
                </Text>
                <Text variant="bodyMedium" style={styles.detailText}>
                  Payment Date: {selectedRegistration.paymentDate.toLocaleDateString()}
                </Text>
                {selectedRegistration.startDate && (
                  <Text variant="bodyMedium" style={styles.detailText}>
                    Start: {selectedRegistration.startDate.toLocaleDateString()}
                  </Text>
                )}
                {selectedRegistration.endDate && (
                  <Text variant="bodyMedium" style={styles.detailText}>
                    End: {selectedRegistration.endDate.toLocaleDateString()}
                  </Text>
                )}
                {selectedRegistration.notes && (
                  <Text variant="bodyMedium" style={styles.detailText}>
                    Notes: {selectedRegistration.notes}
                  </Text>
                )}
                {selectedRegistration.attachmentUri && (
                  <View style={styles.detailAttachment}>
                    <Text variant="bodyMedium" style={styles.detailText}>
                      Receipt: Attached
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setShowDetailsDialog(false);
                        handleViewAttachment(selectedRegistration.attachmentUri!);
                      }}
                      icon="attachment"
                      loading={isDownloading}
                      disabled={isDownloading}
                    >
                      {isDownloading ? 'Opening...' : 'View Receipt'}
                    </Button>
                  </View>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDetailsDialog(false)}>Close</Button>
            <Button 
              onPress={() => {
                setShowDetailsDialog(false);
                handleOpenDialog(selectedRegistration!);
              }}
              mode="contained"
            >
              Edit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>



      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'start' ? formData.startDate : formData.endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
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
    color: '#666',
  },
  notes: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#888',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 16,
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
  },
  dateButton: {
    flex: 0.48,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  attachmentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  attachmentText: {
    marginLeft: 4,
    color: '#666',
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  attachmentButton: {
    flex: 1,
  },
  attachmentTextDialog: {
    marginTop: 8,
    color: '#666',
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
    color: '#888',
  },
  dialog: {
    margin: 16,
  },
  dialogContent: {
    paddingBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
}); 