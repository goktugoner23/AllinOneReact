import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Card,
  Text,
  FAB,
  Portal,
  Dialog,
  TextInput,
  Button,
  IconButton,
  useTheme,
  Surface,
  Chip,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { addSeminar, deleteSeminar } from '../../store/wtRegistrySlice';
import { WTSeminar } from '../../types/WTRegistry';
import DateTimePicker from '@react-native-community/datetimepicker';

export function SeminarsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const { seminars, loading } = useSelector((state: RootState) => state.wtRegistry);

  const [showDialog, setShowDialog] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    description: '',
    location: '',
  });

  const sortedSeminars = [...seminars].sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleOpenDialog = () => {
    const now = new Date();
    const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours later (default seminar duration)
    
    setFormData({
      name: '',
      date: now,
      startTime: now,
      endTime,
      description: '',
      location: '',
    });
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setShowDatePicker(false);
    setShowTimePicker(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Seminar name is required');
      return;
    }

    try {
      const seminarData = {
        name: formData.name,
        date: formData.date,
        startHour: formData.startTime.getHours(),
        startMinute: formData.startTime.getMinutes(),
        endHour: formData.endTime.getHours(),
        endMinute: formData.endTime.getMinutes(),
        description: formData.description,
        location: formData.location,
      };

      await dispatch(addSeminar(seminarData)).unwrap();
      handleCloseDialog();
    } catch (error) {
      Alert.alert('Error', 'Failed to save seminar');
    }
  };

  const handleDelete = (seminar: WTSeminar) => {
    Alert.alert(
      'Delete Seminar',
      `Are you sure you want to delete "${seminar.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteSeminar(seminar.id)).unwrap();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete seminar');
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime && showTimePicker) {
      setFormData({
        ...formData,
        [showTimePicker === 'start' ? 'startTime' : 'endTime']: selectedTime,
      });
    }
    setShowTimePicker(null);
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const isUpcoming = (date: Date) => {
    return date.getTime() > new Date().getTime();
  };

  const renderSeminarCard = ({ item: seminar }: { item: WTSeminar }) => (
    <Card 
      style={[
        styles.seminarCard, 
        { 
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 4,
          borderLeftColor: isUpcoming(seminar.date) ? theme.colors.primary : theme.colors.outline,
        }
      ]} 
      mode="outlined"
    >
      <Card.Content>
        <View style={styles.seminarHeader}>
          <View style={styles.seminarInfo}>
            <View style={styles.titleRow}>
              <Text variant="titleMedium" style={styles.seminarName}>
                {seminar.name}
              </Text>
              <Chip
                mode="outlined"
                compact
                style={[
                  styles.statusChip,
                  { 
                    backgroundColor: isUpcoming(seminar.date) 
                      ? theme.colors.primaryContainer 
                      : theme.colors.surfaceVariant 
                  }
                ]}
                textStyle={{ 
                  color: isUpcoming(seminar.date) 
                    ? theme.colors.onPrimaryContainer 
                    : theme.colors.onSurfaceVariant 
                }}
              >
                {isUpcoming(seminar.date) ? 'Upcoming' : 'Past'}
              </Chip>
            </View>
            
            <Text variant="bodyLarge" style={styles.dateTime}>
              📅 {seminar.date.toLocaleDateString()}
            </Text>
            <Text variant="bodyMedium" style={styles.timeRange}>
              🕐 {formatTime(seminar.startHour, seminar.startMinute)} - {formatTime(seminar.endHour, seminar.endMinute)}
            </Text>
            
            {seminar.location && (
              <Text variant="bodyMedium" style={styles.location}>
                📍 {seminar.location}
              </Text>
            )}
            
            {seminar.description && (
              <Text variant="bodySmall" style={styles.description}>
                {seminar.description}
              </Text>
            )}
          </View>
          <View style={styles.seminarActions}>
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => handleDelete(seminar)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Text variant="titleMedium" style={styles.headerTitle}>
          Wing Tzun Seminars
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          {seminars.length} seminar{seminars.length !== 1 ? 's' : ''} total
        </Text>
      </Surface>

      <FlatList
        data={sortedSeminars}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSeminarCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No seminars scheduled yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap the + button to add your first seminar
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleOpenDialog}
      />

      <Portal>
        <Dialog visible={showDialog} onDismiss={handleCloseDialog}>
          <Dialog.Title>Add Seminar</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Seminar Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={styles.input}
              mode="outlined"
            />

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              icon="calendar"
            >
              Date: {formData.date.toLocaleDateString()}
            </Button>

            <View style={styles.timeContainer}>
              <Button
                mode="outlined"
                onPress={() => setShowTimePicker('start')}
                style={styles.timeButton}
                icon="clock-outline"
              >
                Start: {formatTime(formData.startTime.getHours(), formData.startTime.getMinutes())}
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowTimePicker('end')}
                style={styles.timeButton}
                icon="clock-outline"
              >
                End: {formatTime(formData.endTime.getHours(), formData.endTime.getMinutes())}
              </Button>
            </View>

            <TextInput
              label="Location"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              style={styles.input}
              mode="outlined"
              left={<TextInput.Icon icon="map-marker" />}
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.durationContainer}>
              <Text variant="bodySmall" style={styles.durationText}>
                Duration: {Math.round(((formData.endTime.getHours() * 60 + formData.endTime.getMinutes()) - 
                (formData.startTime.getHours() * 60 + formData.startTime.getMinutes())) / 60 * 100) / 100} hours
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDialog}>Cancel</Button>
            <Button onPress={handleSave} mode="contained">
              Add Seminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={showTimePicker === 'start' ? formData.startTime : formData.endTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
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
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  seminarCard: {
    marginBottom: 12,
  },
  seminarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  seminarInfo: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seminarName: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  dateTime: {
    marginBottom: 4,
    fontWeight: '600',
  },
  timeRange: {
    marginBottom: 4,
    color: '#666',
  },
  location: {
    marginBottom: 4,
    color: '#666',
  },
  description: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#888',
  },
  seminarActions: {
    flexDirection: 'row',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    color: '#999',
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
  dateButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeButton: {
    flex: 0.48,
  },
  durationContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  durationText: {
    color: '#666',
    fontStyle: 'italic',
  },
}); 