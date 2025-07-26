import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import {
  Text,
  FAB,
  Portal,
  Dialog,
  TextInput,
  Button,
  Card,
  useTheme,
  Surface,
  Chip,
  IconButton,
} from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  generateCalendarEvents,
  addCalendarEvent,
  setSelectedDate,
  setShowEventModal,
  setSelectedEvent,
} from '../store/calendarSlice';
import { CalendarEvent } from '../types/WTRegistry';
import DateTimePicker from '@react-native-community/datetimepicker';

export function CalendarScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const { events, selectedDate, showEventModal, selectedEvent, loading } = useSelector(
    (state: RootState) => state.calendar
  );
  const { students, registrations, lessons, seminars } = useSelector(
    (state: RootState) => state.wtRegistry
  );

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);

  // Form state for adding new events
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    endDate: new Date(),
    type: 'event' as CalendarEvent['type'],
  });

  useEffect(() => {
    // Generate calendar events whenever WTRegistry data changes
    dispatch(generateCalendarEvents());
  }, [dispatch, students, registrations, lessons, seminars]);

  const handleDayPress = (day: DateData) => {
    dispatch(setSelectedDate(day.dateString));
    const dayEvents = events.filter(event => 
      event.date.toISOString().split('T')[0] === day.dateString
    );
    if (dayEvents.length > 0) {
      dispatch(setShowEventModal(true));
    }
  };

  const handleEventPress = (event: CalendarEvent) => {
    dispatch(setSelectedEvent(event));
    dispatch(setShowEventModal(true));
  };

  const handleAddEvent = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date(selectedDate),
      endDate: new Date(selectedDate),
      type: 'event',
    });
    setShowAddDialog(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Event title is required');
      return;
    }

    try {
      await dispatch(addCalendarEvent({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        endDate: formData.endDate,
        type: formData.type,
      })).unwrap();
      
      setShowAddDialog(false);
      // Regenerate events to include the new one
      dispatch(generateCalendarEvents());
    } catch (error) {
      Alert.alert('Error', 'Failed to add event');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate, endDate: selectedDate });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime && showTimePicker) {
      const newDate = new Date(formData.date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
      
      if (showTimePicker === 'start') {
        setFormData({ ...formData, date: newDate });
      } else {
        setFormData({ ...formData, endDate: newDate });
      }
    }
    setShowTimePicker(null);
  };

  // Prepare calendar marks
  const markedDates = events.reduce((marks: any, event) => {
    const dateKey = event.date.toISOString().split('T')[0];
    
    if (!marks[dateKey]) {
      marks[dateKey] = { dots: [] };
    }
    
    let color = theme.colors.primary;
    switch (event.type) {
      case 'registration_start':
        color = theme.colors.secondary;
        break;
      case 'registration_end':
        color = theme.colors.error;
        break;
      case 'lesson':
        color = theme.colors.tertiary;
        break;
      case 'seminar':
        color = '#FF9800';
        break;
      default:
        color = theme.colors.primary;
    }
    
    marks[dateKey].dots.push({ color });
    
    if (dateKey === selectedDate) {
      marks[dateKey].selected = true;
      marks[dateKey].selectedColor = theme.colors.primaryContainer;
    }
    
    return marks;
  }, {});

  // Add selected date mark if no events
  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: theme.colors.primaryContainer,
    };
  }

  const selectedDateEvents = events.filter(event => 
    event.date.toISOString().split('T')[0] === selectedDate
  );

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'registration_start':
        return theme.colors.secondaryContainer;
      case 'registration_end':
        return theme.colors.errorContainer;
      case 'lesson':
        return theme.colors.tertiaryContainer;
      case 'seminar':
        return '#FFF3E0';
      default:
        return theme.colors.primaryContainer;
    }
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'registration_start':
        return '🟢';
      case 'registration_end':
        return '🔴';
      case 'lesson':
        return '📚';
      case 'seminar':
        return '🎯';
      default:
        return '📅';
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        markingType="multi-dot"
        markedDates={markedDates}
        theme={{
          backgroundColor: theme.colors.surface,
          calendarBackground: theme.colors.surface,
          textSectionTitleColor: theme.colors.onSurface,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimary,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.onSurface,
          textDisabledColor: theme.colors.onSurfaceDisabled,
          dotColor: theme.colors.primary,
          selectedDotColor: theme.colors.onPrimary,
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.onSurface,
          indicatorColor: theme.colors.primary,
        }}
      />

      <Surface style={styles.eventsContainer} elevation={1}>
        <View style={styles.eventsHeader}>
          <Text variant="titleMedium">
            Events for {new Date(selectedDate).toLocaleDateString()}
          </Text>
          <IconButton
            icon="plus"
            size={20}
            onPress={handleAddEvent}
            mode="contained"
            containerColor={theme.colors.primaryContainer}
          />
        </View>

        <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
          {selectedDateEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No events for this date
              </Text>
              <Text variant="bodySmall" style={styles.emptySubtext}>
                Tap + to add an event
              </Text>
            </View>
          ) : (
            selectedDateEvents.map((event) => (
              <Card
                key={event.id}
                style={[
                  styles.eventCard,
                  { backgroundColor: getEventTypeColor(event.type) }
                ]}
                mode="outlined"
                onPress={() => handleEventPress(event)}
              >
                <Card.Content>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventIcon}>
                      {getEventTypeIcon(event.type)}
                    </Text>
                    <View style={styles.eventInfo}>
                      <Text variant="titleSmall" style={styles.eventTitle}>
                        {event.title}
                      </Text>
                      <Text variant="bodySmall" style={styles.eventTime}>
                        {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {event.endDate && event.endDate.getTime() !== event.date.getTime() && 
                          ` - ${event.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        }
                      </Text>
                      {event.description && (
                        <Text variant="bodySmall" style={styles.eventDescription}>
                          {event.description}
                        </Text>
                      )}
                    </View>
                    <Chip mode="outlined" compact>
                      {event.type.replace('_', ' ')}
                    </Chip>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </Surface>

      {/* Event Details Modal */}
      <Portal>
        <Dialog visible={showEventModal} onDismiss={() => dispatch(setShowEventModal(false))}>
          <Dialog.Title>Event Details</Dialog.Title>
          <Dialog.Content>
            {selectedEvent && (
              <View>
                <Text variant="titleMedium" style={styles.modalTitle}>
                  {selectedEvent.title}
                </Text>
                <Text variant="bodyMedium" style={styles.modalDetail}>
                  📅 {selectedEvent.date.toLocaleString()}
                </Text>
                {selectedEvent.endDate && selectedEvent.endDate.getTime() !== selectedEvent.date.getTime() && (
                  <Text variant="bodyMedium" style={styles.modalDetail}>
                    ⏰ Until {selectedEvent.endDate.toLocaleString()}
                  </Text>
                )}
                <Text variant="bodyMedium" style={styles.modalDetail}>
                  🏷️ {selectedEvent.type.replace('_', ' ')}
                </Text>
                {selectedEvent.description && (
                  <Text variant="bodyMedium" style={styles.modalDescription}>
                    {selectedEvent.description}
                  </Text>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => dispatch(setShowEventModal(false))}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add Event Modal */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add Event</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
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
                Start: {formData.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowTimePicker('end')}
                style={styles.timeButton}
                icon="clock-outline"
              >
                End: {formData.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Button>
            </View>

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onPress={handleSaveEvent} mode="contained">
              Add Event
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
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={showTimePicker === 'start' ? formData.date : formData.endDate}
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
  eventsContainer: {
    flex: 1,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsList: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginBottom: 4,
    color: '#666',
  },
  emptySubtext: {
    color: '#999',
  },
  eventCard: {
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  eventInfo: {
    flex: 1,
    marginRight: 8,
  },
  eventTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  eventTime: {
    color: '#666',
    marginBottom: 4,
  },
  eventDescription: {
    color: '#888',
    fontStyle: 'italic',
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalDetail: {
    marginBottom: 8,
  },
  modalDescription: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#666',
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
});
