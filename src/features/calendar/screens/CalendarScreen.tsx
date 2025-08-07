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
import { RootState, AppDispatch } from '@shared/store/rootStore';
import {
  generateCalendarEvents,
  fetchFirebaseEvents,
  addFirebaseEvent,
  updateFirebaseEvent,
  deleteFirebaseEvent,
  setSelectedDate,
  setShowEventModal,
  setSelectedEvent,
  setSelectedFirebaseEvent,
} from '@features/calendar/store/calendarSlice';
import {
  loadStudents,
  loadRegistrations,
  loadLessons,
  loadSeminars,
} from '@features/wtregistry/store/wtRegistrySlice';
import { CalendarEvent } from '@features/wtregistry/types/WTRegistry';
import { Event, EventFormData, SerializableEvent, serializableToEvent } from '@features/calendar/types/Event';
import DateTimePicker from '@react-native-community/datetimepicker';

export function CalendarScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const { 
    events, 
    firebaseEvents, 
    selectedDate, 
    showEventModal, 
    selectedEvent, 
    selectedFirebaseEvent,
    loading 
  } = useSelector((state: RootState) => state.calendar);
  const { students, registrations, lessons, seminars } = useSelector(
    (state: RootState) => state.wtRegistry
  );

  // Temporary debug: Check registration data
  console.log('Registrations with dates:', registrations.map(r => ({
    id: r.id,
    studentName: students.find(s => s.id === r.studentId)?.name,
    startDate: r.startDate,
    endDate: r.endDate,
    hasStartDate: !!r.startDate,
    hasEndDate: !!r.endDate
  })));



  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);

  // Form state for adding/editing events
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    date: new Date(),
    endDate: new Date(),
    type: 'Event',
  });

  useEffect(() => {
    // Load WTRegistry data and Firebase events on component mount
    dispatch(loadStudents());
    dispatch(loadRegistrations());
    dispatch(loadLessons());
    dispatch(loadSeminars());
    dispatch(fetchFirebaseEvents());
  }, [dispatch]);

  useEffect(() => {
    // Regenerate WTRegistry events whenever WTRegistry data changes
    dispatch(generateCalendarEvents());
  }, [dispatch, students, registrations, lessons, seminars]);

  // Convert serializable events to Event objects and combine with WTRegistry events
  const allEvents = [
    ...firebaseEvents.map(serializableEvent => {
      const event = serializableToEvent(serializableEvent);
      return {
        id: `firebase-${event.id}`,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.endDate,
        type: event.type as CalendarEvent['type'],
        isFirebaseEvent: true,
        firebaseEvent: event,
        serializableEvent,
      };
    }),
    ...events.map(serializableEvent => {
      const event = serializableToEvent(serializableEvent);
      return {
        id: `wtregistry-${event.id}`,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.endDate,
        type: event.type as CalendarEvent['type'],
        isFirebaseEvent: false,
        serializableEvent,
      };
    })
  ];





  const handleDayPress = (day: DateData) => {
    dispatch(setSelectedDate(day.dateString));
    // Clear any selected events when date changes
    dispatch(setSelectedEvent(null));
    dispatch(setSelectedFirebaseEvent(null));
  };

  const handleEventPress = (event: any) => {
    if (event.isFirebaseEvent) {
      dispatch(setSelectedFirebaseEvent(event.serializableEvent));
    } else {
      dispatch(setSelectedEvent(event.serializableEvent));
    }
    dispatch(setShowEventModal(true));
  };

  const handleAddEvent = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date(selectedDate),
      endDate: new Date(selectedDate),
      type: 'Event',
    });
    setShowAddDialog(true);
  };

  const handleEditEvent = (event: Event) => {
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date,
      endDate: event.endDate || event.date,
      type: event.type,
    });
    setShowEditDialog(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Event title is required');
      return;
    }

    try {
      await dispatch(addFirebaseEvent(formData)).unwrap();
      setShowAddDialog(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add event');
    }
  };

  const handleUpdateEvent = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Event title is required');
      return;
    }

    if (!selectedFirebaseEvent) return;

    try {
      await dispatch(updateFirebaseEvent({
        eventId: selectedFirebaseEvent.id,
        eventData: formData
      })).unwrap();
      setShowEditDialog(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedFirebaseEvent) return;

    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteFirebaseEvent(selectedFirebaseEvent.id)).unwrap();
              dispatch(setShowEventModal(false));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
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
  const markedDates = allEvents.reduce((marks: any, event) => {
    const dateKey = event.date.toISOString().split('T')[0];
    
    if (!marks[dateKey]) {
      marks[dateKey] = { dots: [], colors: [] };
    }
    
    let color = '#FFD700'; // yellow for other events (default)
    
    // Handle Firebase events (string types) and WTRegistry events (union types)
    if (typeof event.type === 'string') {
      // Firebase events and WTRegistry events (now both use string types)
      if (event.type.includes('Registration Start')) {
        color = '#4CAF50'; // green for registration start
      } else if (event.type.includes('Registration End')) {
        color = '#F44336'; // red for registration end
      } else if (event.type.includes('lesson')) {
        color = '#2196F3'; // blue for lessons
      } else {
        color = '#FFD700'; // yellow for other events
      }
    } else {
      // Legacy WTRegistry events (union types) - fallback
      switch (event.type) {
        case 'registration_start':
          color = '#4CAF50'; // green for registration start
          break;
        case 'registration_end':
          color = '#F44336'; // red for registration end
          break;
        case 'lesson':
          color = '#2196F3'; // blue for lessons
          break;
        case 'seminar':
          color = '#FFD700'; // yellow for seminars
          break;
        default:
          color = '#FFD700'; // yellow for other events
      }
    }
    
    // Add color to the array for this date
    marks[dateKey].colors.push(color);
    
    if (dateKey === selectedDate) {
      marks[dateKey].selected = true;
      marks[dateKey].selectedColor = theme.colors.primaryContainer;
    }
    
    return marks;
  }, {});

  // Process the colors to show only one dot based on priority
  Object.keys(markedDates).forEach(dateKey => {
    const colors = markedDates[dateKey].colors || [];
    let priorityColor = '#FFD700'; // default yellow

    // Priority: red > green > yellow > blue
    if (colors.includes('#F44336')) {
      priorityColor = '#F44336'; // red
    } else if (colors.includes('#4CAF50')) {
      priorityColor = '#4CAF50'; // green
    } else if (colors.includes('#FFD700')) {
      priorityColor = '#FFD700'; // yellow
    } else if (colors.includes('#2196F3')) {
      priorityColor = '#2196F3'; // blue
    }

    // Set only one dot with the highest priority color
    markedDates[dateKey].dots = [{ color: priorityColor }];
    
    // Remove the temporary colors array
    delete markedDates[dateKey].colors;
  });

  // Add selected date mark if no events
  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: theme.colors.primaryContainer,
    };
  }

  const selectedDateEvents = allEvents.filter(event => 
    event.date.toISOString().split('T')[0] === selectedDate
  );

  const getEventTypeColor = (type: string) => {
    if (type === 'Registration Start') {
      return '#4CAF50'; // green background
    } else if (type === 'Registration End') {
      return '#F44336'; // red background
    } else if (type === 'lesson') {
      return '#2196F3'; // blue background
    } else if (type === 'seminar') {
      return '#FFF3E0';
    } else {
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
            iconColor="white"
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
                mode="elevated"
                onPress={() => handleEventPress(event)}
              >
                <Card.Content>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventIcon}>
                      {getEventTypeIcon(event.type)}
                    </Text>
                    <View style={styles.eventInfo}>
                      <Text variant="titleSmall" style={[styles.eventTitle, { color: 'white' }]}>
                        {event.title}
                      </Text>
                      <Text variant="bodySmall" style={[styles.eventTime, { color: 'white' }]}>
                        {event.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {event.endDate && event.endDate.getTime() !== event.date.getTime() && 
                          ` - ${event.endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        }
                      </Text>
                      {event.description && (
                        <Text variant="bodySmall" style={[styles.eventDescription, { color: 'white' }]}>
                          {event.description}
                        </Text>
                      )}
                    </View>
                                <Chip
              mode="outlined"
              style={{
                backgroundColor: getEventTypeColor(event.type),
                borderColor: getEventTypeColor(event.type)
              }}
              textStyle={{
                color: 'white'
              }}
            >
              {event.type === 'lesson' ? 'Lesson' : event.type.replace('_', ' ')}
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
        <Dialog 
          visible={showEventModal} 
          onDismiss={() => dispatch(setShowEventModal(false))}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Event Details</Dialog.Title>
          <Dialog.Content>
            {selectedEvent && (
              <View>
                {(() => {
                  const event = serializableToEvent(selectedEvent);
                  return (
                    <>
                      <Text variant="titleMedium" style={styles.modalTitle}>
                        {event.title}
                      </Text>
                      <Text variant="bodyMedium" style={styles.modalDetail}>
                        📅 {event.date.toLocaleString()}
                      </Text>
                      {event.endDate && event.endDate.getTime() !== event.date.getTime() && (
                        <Text variant="bodyMedium" style={styles.modalDetail}>
                          ⏰ Until {event.endDate.toLocaleString()}
                        </Text>
                      )}
                      <Text variant="bodyMedium" style={styles.modalDetail}>
                        🏷️ {event.type.replace('_', ' ')}
                      </Text>
                      {event.description && (
                        <Text variant="bodyMedium" style={styles.modalDescription}>
                          {event.description}
                        </Text>
                      )}
                    </>
                  );
                })()}
              </View>
            )}
            {selectedFirebaseEvent && (
              <View>
                <Text variant="titleMedium" style={styles.modalTitle}>
                  {selectedFirebaseEvent.title}
                </Text>
                <Text variant="bodyMedium" style={styles.modalDetail}>
                  📅 {new Date(selectedFirebaseEvent.date).toLocaleString()}
                </Text>
                {selectedFirebaseEvent.endDate && selectedFirebaseEvent.endDate !== selectedFirebaseEvent.date && (
                  <Text variant="bodyMedium" style={styles.modalDetail}>
                    ⏰ Until {new Date(selectedFirebaseEvent.endDate).toLocaleString()}
                  </Text>
                )}
                <Text variant="bodyMedium" style={styles.modalDetail}>
                  🏷️ {selectedFirebaseEvent.type}
                </Text>
                {selectedFirebaseEvent.description && (
                  <Text variant="bodyMedium" style={styles.modalDescription}>
                    {selectedFirebaseEvent.description}
                  </Text>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {selectedFirebaseEvent && (
              <>
                <Button onPress={() => handleEditEvent(serializableToEvent(selectedFirebaseEvent))}>Edit</Button>
                <Button onPress={handleDeleteEvent} textColor={theme.colors.error}>Delete</Button>
              </>
            )}
            <Button onPress={() => {
              dispatch(setShowEventModal(false));
              dispatch(setSelectedEvent(null));
              dispatch(setSelectedFirebaseEvent(null));
            }}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add Event Modal */}
      <Portal>
        <Dialog 
          visible={showAddDialog} 
          onDismiss={() => setShowAddDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Add Event</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Type"
              value={formData.type}
              onChangeText={(text) => setFormData({ ...formData, type: text })}
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
                End: {formData.endDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Not set'}
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

      {/* Edit Event Modal */}
      <Portal>
        <Dialog 
          visible={showEditDialog} 
          onDismiss={() => setShowEditDialog(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Edit Event</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Type"
              value={formData.type}
              onChangeText={(text) => setFormData({ ...formData, type: text })}
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
                End: {formData.endDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Not set'}
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
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleUpdateEvent} mode="contained">
              Update Event
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
          value={showTimePicker === 'start' ? formData.date : (formData.endDate || formData.date)}
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
    marginBottom: 6,
    paddingVertical: 4,
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
    marginBottom: 1,
  },
  eventTime: {
    marginBottom: 2,
  },
  eventDescription: {
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
