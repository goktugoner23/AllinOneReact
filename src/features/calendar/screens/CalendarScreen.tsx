import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Text, Portal, Dialog, useTheme, Surface, IconButton as PaperIconButton } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import { generateCalendarEvents } from '@features/calendar/store/calendarSlice';
import { loadStudents, loadRegistrations, loadLessons, loadSeminars } from '@features/wtregistry/store/wtRegistrySlice';
import { CalendarEvent } from '@features/wtregistry/types/WTRegistry';
import { Event, EventFormData, serializableToEvent } from '@features/calendar/types/Event';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCalendarEvents, useAddCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from '@shared/hooks';
import { Card, CardContent, Button, Input, Chip, EmptyState } from '@shared/components/ui';

export function CalendarScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();

  // TanStack Query for Firebase events
  const { data: firebaseEvents = [], isLoading: isLoadingEvents } = useCalendarEvents();
  const addEventMutation = useAddCalendarEvent();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();

  // Redux state for WTRegistry events (different domain)
  const { events: wtRegistrySerializableEvents } = useSelector((state: RootState) => state.calendar);
  const { students, registrations, lessons, seminars } = useSelector((state: RootState) => state.wtRegistry);

  // Local UI state
  const [selectedDate, setSelectedDateState] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedFirebaseEvent, setSelectedFirebaseEvent] = useState<Event | null>(null);

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
    // Load WTRegistry data on component mount
    dispatch(loadStudents());
    dispatch(loadRegistrations());
    dispatch(loadLessons());
    dispatch(loadSeminars());
  }, [dispatch]);

  useEffect(() => {
    // Regenerate WTRegistry events whenever WTRegistry data changes
    dispatch(generateCalendarEvents());
  }, [dispatch, students, registrations, lessons, seminars]);

  // Convert Firebase events (already Event objects) and WTRegistry events
  const allEvents = [
    ...firebaseEvents.map((event) => ({
      id: `firebase-${event.id}`,
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.endDate,
      type: event.type as CalendarEvent['type'],
      isFirebaseEvent: true,
      firebaseEvent: event as Event | undefined,
    })),
    ...wtRegistrySerializableEvents.map((serializableEvent) => {
      const event = serializableToEvent(serializableEvent);
      return {
        id: `wtregistry-${event.id}`,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.endDate,
        type: event.type as CalendarEvent['type'],
        isFirebaseEvent: false,
        firebaseEvent: undefined as Event | undefined,
      };
    }),
  ];

  const handleDayPress = (day: DateData) => {
    setSelectedDateState(day.dateString);
    // Clear any selected events when date changes
    setSelectedEvent(null);
    setSelectedFirebaseEvent(null);
  };

  const handleEventPress = (event: (typeof allEvents)[0]) => {
    if (event.isFirebaseEvent && event.firebaseEvent) {
      setSelectedFirebaseEvent(event.firebaseEvent);
      setSelectedEvent(null);
    } else {
      setSelectedEvent({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        endDate: event.endDate,
        type: event.type,
      });
      setSelectedFirebaseEvent(null);
    }
    setShowEventModal(true);
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
      await addEventMutation.mutateAsync(formData);
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
      await updateEventMutation.mutateAsync({
        eventId: selectedFirebaseEvent.id,
        eventData: formData,
      });
      setShowEditDialog(false);
      setShowEventModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedFirebaseEvent) return;

    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEventMutation.mutateAsync(selectedFirebaseEvent.id);
            setShowEventModal(false);
            setSelectedFirebaseEvent(null);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete event');
          }
        },
      },
    ]);
  };

  const handleDateChange = (_event: unknown, newDate?: Date) => {
    setShowDatePicker(false);
    if (newDate) {
      setFormData({ ...formData, date: newDate, endDate: newDate });
    }
  };

  const handleTimeChange = (_event: unknown, selectedTime?: Date) => {
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
  const markedDates = allEvents.reduce(
    (
      marks: Record<
        string,
        { dots?: { color: string }[]; colors?: string[]; selected?: boolean; selectedColor?: string }
      >,
      event,
    ) => {
      const dateKey = event.date.toISOString().split('T')[0];

      if (!marks[dateKey]) {
        marks[dateKey] = { dots: [], colors: [] };
      }

      let color = '#FFD700'; // yellow for other events (default)

      // Handle Firebase events and WTRegistry events (both use string types)
      if (typeof event.type === 'string') {
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
      marks[dateKey].colors?.push(color);

      if (dateKey === selectedDate) {
        marks[dateKey].selected = true;
        marks[dateKey].selectedColor = theme.colors.primaryContainer;
      }

      return marks;
    },
    {},
  );

  // Process the colors to show only one dot based on priority
  Object.keys(markedDates).forEach((dateKey) => {
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

  const selectedDateEvents = allEvents.filter((event) => event.date.toISOString().split('T')[0] === selectedDate);

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

  const getChipColor = (type: string): 'success' | 'error' | 'primary' | 'warning' | 'default' => {
    if (type === 'Registration Start' || type === 'registration_start') {
      return 'success';
    } else if (type === 'Registration End' || type === 'registration_end') {
      return 'error';
    } else if (type === 'lesson') {
      return 'primary';
    } else if (type === 'seminar') {
      return 'warning';
    }
    return 'default';
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'registration_start':
        return 'O';
      case 'registration_end':
        return 'X';
      case 'lesson':
        return 'L';
      case 'seminar':
        return 'S';
      default:
        return 'E';
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
          <Text variant="titleMedium">Events for {new Date(selectedDate).toLocaleDateString()}</Text>
          <PaperIconButton
            icon="plus"
            size={20}
            onPress={handleAddEvent}
            mode="contained"
            containerColor={theme.colors.primaryContainer}
            iconColor="white"
          />
        </View>

        <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
          {isLoadingEvents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : selectedDateEvents.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No events for this date"
              description="Tap + to add an event"
              style={styles.emptyState}
            />
          ) : (
            selectedDateEvents.map((event) => (
              <Card
                key={event.id}
                variant="elevated"
                padding="sm"
                style={{ ...styles.eventCard, backgroundColor: getEventTypeColor(event.type) }}
                onPress={() => handleEventPress(event)}
              >
                <CardContent style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventIcon}>{getEventTypeIcon(event.type)}</Text>
                    <View style={styles.eventInfo}>
                      <Text style={[styles.eventTitle, { color: 'white' }]}>{event.title}</Text>
                      <Text style={[styles.eventTime, { color: 'white' }]}>
                        {event.date.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {event.endDate &&
                          event.endDate.getTime() !== event.date.getTime() &&
                          ` - ${event.endDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                      </Text>
                      {event.description && (
                        <Text style={[styles.eventDescription, { color: 'white' }]}>{event.description}</Text>
                      )}
                    </View>
                    <Chip color={getChipColor(event.type)} size="sm" variant="filled">
                      {event.type === 'lesson' ? 'Lesson' : event.type.replace('_', ' ')}
                    </Chip>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </ScrollView>
      </Surface>

      {/* Event Details Modal */}
      <Portal>
        <Dialog
          visible={showEventModal}
          onDismiss={() => setShowEventModal(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Event Details</Dialog.Title>
          <Dialog.Content>
            {selectedEvent && (
              <View>
                <Text variant="titleMedium" style={styles.modalTitle}>
                  {selectedEvent.title}
                </Text>
                <Text variant="bodyMedium" style={styles.modalDetail}>
                  Date: {selectedEvent.date.toLocaleString()}
                </Text>
                {selectedEvent.endDate && selectedEvent.endDate.getTime() !== selectedEvent.date.getTime() && (
                  <Text variant="bodyMedium" style={styles.modalDetail}>
                    Until {selectedEvent.endDate.toLocaleString()}
                  </Text>
                )}
                <Text variant="bodyMedium" style={styles.modalDetail}>
                  Type: {selectedEvent.type.replace('_', ' ')}
                </Text>
                {selectedEvent.description && (
                  <Text variant="bodyMedium" style={styles.modalDescription}>
                    {selectedEvent.description}
                  </Text>
                )}
              </View>
            )}
            {selectedFirebaseEvent && (
              <View>
                <Text variant="titleMedium" style={styles.modalTitle}>
                  {selectedFirebaseEvent.title}
                </Text>
                <Text variant="bodyMedium" style={styles.modalDetail}>
                  Date: {selectedFirebaseEvent.date.toLocaleString()}
                </Text>
                {selectedFirebaseEvent.endDate &&
                  selectedFirebaseEvent.endDate.getTime() !== selectedFirebaseEvent.date.getTime() && (
                    <Text variant="bodyMedium" style={styles.modalDetail}>
                      Until {selectedFirebaseEvent.endDate.toLocaleString()}
                    </Text>
                  )}
                <Text variant="bodyMedium" style={styles.modalDetail}>
                  Type: {selectedFirebaseEvent.type}
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
                <Button variant="ghost" onPress={() => handleEditEvent(selectedFirebaseEvent)}>
                  Edit
                </Button>
                <Button variant="destructive" onPress={handleDeleteEvent} loading={deleteEventMutation.isPending}>
                  Delete
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onPress={() => {
                setShowEventModal(false);
                setSelectedEvent(null);
                setSelectedFirebaseEvent(null);
              }}
            >
              Close
            </Button>
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
            <Input
              label="Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter event title"
            />

            <Input
              label="Type"
              value={formData.type}
              onChangeText={(text) => setFormData({ ...formData, type: text })}
              placeholder="Event type"
            />

            <Button variant="outline" onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
              Date: {formData.date.toLocaleDateString()}
            </Button>

            <View style={styles.timeContainer}>
              <Button variant="outline" onPress={() => setShowTimePicker('start')} style={styles.timeButton}>
                Start: {formData.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Button>
              <Button variant="outline" onPress={() => setShowTimePicker('end')} style={styles.timeButton}>
                End: {formData.endDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Not set'}
              </Button>
            </View>

            <Input
              label="Description"
              value={formData.description || ''}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter description"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="ghost" onPress={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSaveEvent} loading={addEventMutation.isPending}>
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
            <Input
              label="Title *"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholder="Enter event title"
            />

            <Input
              label="Type"
              value={formData.type}
              onChangeText={(text) => setFormData({ ...formData, type: text })}
              placeholder="Event type"
            />

            <Button variant="outline" onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
              Date: {formData.date.toLocaleDateString()}
            </Button>

            <View style={styles.timeContainer}>
              <Button variant="outline" onPress={() => setShowTimePicker('start')} style={styles.timeButton}>
                Start: {formData.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Button>
              <Button variant="outline" onPress={() => setShowTimePicker('end')} style={styles.timeButton}>
                End: {formData.endDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Not set'}
              </Button>
            </View>

            <Input
              label="Description"
              value={formData.description || ''}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter description"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button variant="ghost" onPress={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleUpdateEvent} loading={updateEventMutation.isPending}>
              Update Event
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {showDatePicker && (
        <DateTimePicker value={formData.date} mode="date" display="default" onChange={handleDateChange} />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={showTimePicker === 'start' ? formData.date : formData.endDate || formData.date}
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
  emptyState: {
    paddingVertical: 32,
  },
  eventCard: {
    marginBottom: 6,
  },
  eventContent: {
    paddingVertical: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 2,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
  },
  eventInfo: {
    flex: 1,
    marginRight: 8,
  },
  eventTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 1,
  },
  eventTime: {
    fontSize: 12,
    marginBottom: 2,
  },
  eventDescription: {
    fontStyle: 'italic',
    fontSize: 12,
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
  dateButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  timeButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
});
