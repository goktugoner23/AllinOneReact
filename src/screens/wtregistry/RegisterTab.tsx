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
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { addRegistration, updateRegistration, deleteRegistration } from '../../store/wtRegistrySlice';
import { WTRegistration, WTStudent } from '../../types/WTRegistry';
import DateTimePicker from '@react-native-community/datetimepicker';

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

  // Form state
  const [formData, setFormData] = useState({
    studentId: 0,
    amount: '',
    startDate: new Date(),
    endDate: new Date(),
    notes: '',
    isPaid: false,
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
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingRegistration(null);
    setShowDatePicker(null);
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
    Alert.alert(
      'Delete Registration',
      `Are you sure you want to delete this registration for ${registration.studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteRegistration(registration.id)).unwrap();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete registration');
            }
          },
        },
      ]
    );
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

  const renderRegistrationCard = ({ item: registration }: { item: WTRegistration & { studentName: string } }) => (
    <Card style={[styles.registrationCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content>
        <View style={styles.registrationHeader}>
          <View style={styles.registrationInfo}>
            <Text variant="titleMedium" style={styles.studentName}>
              {registration.studentName}
            </Text>
            <Text variant="bodyLarge" style={styles.amount}>
              ${registration.amount.toFixed(2)}
            </Text>
            <View style={styles.statusContainer}>
              <Chip
                mode="outlined"
                compact
                style={[
                  styles.statusChip,
                  { backgroundColor: registration.isPaid ? theme.colors.primaryContainer : theme.colors.errorContainer }
                ]}
                textStyle={{ color: registration.isPaid ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer }}
              >
                {registration.isPaid ? 'Paid' : 'Unpaid'}
              </Chip>
            </View>
          </View>
          <View style={styles.registrationActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleOpenDialog(registration)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => handleDelete(registration)}
            />
          </View>
        </View>

        <Text variant="bodyMedium" style={styles.dateInfo}>
          Payment Date: {registration.paymentDate.toLocaleDateString()}
        </Text>
        {registration.startDate && (
          <Text variant="bodyMedium" style={styles.dateInfo}>
            Period: {registration.startDate.toLocaleDateString()} - {registration.endDate?.toLocaleDateString() || 'N/A'}
          </Text>
        )}
        {registration.notes && (
          <Text variant="bodySmall" style={styles.notes}>
            💬 {registration.notes}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

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
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleOpenDialog()}
      />

      <Portal>
        <Dialog visible={showDialog} onDismiss={handleCloseDialog}>
          <Dialog.Title>{editingRegistration ? 'Edit Registration' : 'Add Registration'}</Dialog.Title>
          <Dialog.Content>
            <Menu
              visible={false}
              onDismiss={() => {}}
              anchor={
                <TextInput
                  label="Student *"
                  value={students.find(s => s.id === formData.studentId)?.name || 'Select student...'}
                  onTouchStart={() => {}}
                  style={styles.input}
                  mode="outlined"
                  right={<TextInput.Icon icon="chevron-down" />}
                  editable={false}
                />
              }
            >
              {students.filter(s => s.isActive).map(student => (
                <Menu.Item
                  key={student.id}
                  onPress={() => setFormData({ ...formData, studentId: student.id })}
                  title={student.name}
                />
              ))}
            </Menu>

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

            <TextInput
              label="Amount *"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              left={<TextInput.Icon icon="currency-usd" />}
            />

            <View style={styles.dateContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker('start')}
                style={styles.dateButton}
              >
                Start: {formData.startDate.toLocaleDateString()}
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker('end')}
                style={styles.dateButton}
              >
                End: {formData.endDate.toLocaleDateString()}
              </Button>
            </View>

            <TextInput
              label="Notes"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.switchContainer}>
              <Text variant="bodyMedium">Paid</Text>
              <Switch
                value={formData.isPaid}
                onValueChange={(value) => setFormData({ ...formData, isPaid: value })}
              />
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
  registrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  registrationInfo: {
    flex: 1,
    marginRight: 8,
  },
  studentName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  amount: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusContainer: {
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  registrationActions: {
    flexDirection: 'row',
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
}); 