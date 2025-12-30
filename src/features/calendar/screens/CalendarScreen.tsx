import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Alert, ScrollView, ActivityIndicator, Text as RNText } from 'react-native';
import { Text, Portal, Dialog, IconButton as PaperIconButton } from 'react-native-paper';
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
import { useColors, spacing, radius, textStyles } from '@shared/theme';

export function CalendarScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const colors = useColors();

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
        marks[dateKey].selectedColor = colors.primaryMuted;
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
      selectedColor: colors.primaryMuted,
    };
  }

  const selectedDateEvents = allEvents.filter((event) => event.date.toISOString().split('T')[0] === selectedDate);

  const getEventTypeColor = (type: string) => {
    if (type === 'Registration Start') {
      return colors.success;
    } else if (type === 'Registration End') {
      return colors.destructive;
    } else if (type === 'lesson') {
      return colors.info;
    } else if (type === 'seminar') {
      return colors.warning;
    } else {
      return colors.primary;
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

  // Memoize calendar theme to prevent unnecessary re-renders
  const calendarTheme = useMemo(
    () => ({
      backgroundColor: colors.background,
      calendarBackground: colors.background,
      textSectionTitleColor: colors.foreground,
      selectedDayBackgroundColor: colors.primary,
      selectedDayTextColor: colors.primaryForeground,
      todayTextColor: colors.primary,
      dayTextColor: colors.foreground,
      textDisabledColor: colors.foregroundSubtle,
      dotColor: colors.primary,
      selectedDotColor: colors.primaryForeground,
      arrowColor: colors.primary,
      monthTextColor: colors.foreground,
      indicatorColor: colors.primary,
    }),
    [colors],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Calendar
        current={selectedDate}
        onDayPress={handleDayPress}
        markingType="multi-dot"
        markedDates={markedDates}
        theme={calendarTheme}
      />

      <Card variant="elevated" padding="md" style={styles.eventsContainer}>
        <View style={styles.eventsHeader}>
          <RNText style={[textStyles.h4, { color: colors.foreground }]}>
            Events for {new Date(selectedDate).toLocaleDateString()}
          </RNText>
          <PaperIconButton
            icon="plus"
            size={20}
            onPress={handleAddEvent}
            mode="contained"
            containerColor={colors.primary}
            iconColor={colors.primaryForeground}
          />
        </View>

        <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
          {isLoadingEvents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <RNText style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: spacing[2] }]}>
                Loading events...
              </RNText>
            </View>
          ) : selectedDateEvents.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No events for this date"
              description="Tap + to add an event"
              style={styles.emptyState}
            />
          ) : (
            selectedDateEvents.map((event) => {
              const eventBgColor = getEventTypeColor(event.type);
              return (
                <Card
                  key={event.id}
                  variant="filled"
                  padding="sm"
                  style={{ ...styles.eventCard, backgroundColor: eventBgColor }}
                  onPress={() => handleEventPress(event)}
                >
                  <CardContent style={styles.eventContent}>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventIconContainer}>
                        <RNText style={styles.eventIcon}>{getEventTypeIcon(event.type)}</RNText>
                      </View>
                      <View style={styles.eventInfo}>
                        <RNText style={[textStyles.label, styles.eventTitle]}>{event.title}</RNText>
                        <RNText style={[textStyles.caption, styles.eventTime]}>
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
                        </RNText>
                        {event.description && (
                          <RNText style={[textStyles.caption, styles.eventDescription]}>{event.description}</RNText>
                        )}
                      </View>
                      <Chip color={getChipColor(event.type)} size="sm" variant="filled">
                        {event.type === 'lesson' ? 'Lesson' : event.type.replace('_', ' ')}
                      </Chip>
                    </View>
                  </CardContent>
                </Card>
              );
            })
          )}
        </ScrollView>
      </Card>

      {/* Event Details Modal */}
      <Portal>
        <Dialog
          visible={showEventModal}
          onDismiss={() => setShowEventModal(false)}
          style={{ backgroundColor: colors.surface }}
        >
          <Dialog.Title style={{ color: colors.foreground }}>Event Details</Dialog.Title>
          <Dialog.Content>
            {selectedEvent && (
              <View>
                <RNText style={[textStyles.h4, { color: colors.foreground, marginBottom: spacing[3] }]}>
                  {selectedEvent.title}
                </RNText>
                <RNText style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                  Date: {selectedEvent.date.toLocaleString()}
                </RNText>
                {selectedEvent.endDate && selectedEvent.endDate.getTime() !== selectedEvent.date.getTime() && (
                  <RNText style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                    Until {selectedEvent.endDate.toLocaleString()}
                  </RNText>
                )}
                <RNText style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                  Type: {selectedEvent.type.replace('_', ' ')}
                </RNText>
                {selectedEvent.description && (
                  <RNText
                    style={[
                      textStyles.bodySmall,
                      { color: colors.foregroundSubtle, marginTop: spacing[2], fontStyle: 'italic' },
                    ]}
                  >
                    {selectedEvent.description}
                  </RNText>
                )}
              </View>
            )}
            {selectedFirebaseEvent && (
              <View>
                <RNText style={[textStyles.h4, { color: colors.foreground, marginBottom: spacing[3] }]}>
                  {selectedFirebaseEvent.title}
                </RNText>
                <RNText style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                  Date: {selectedFirebaseEvent.date.toLocaleString()}
                </RNText>
                {selectedFirebaseEvent.endDate &&
                  selectedFirebaseEvent.endDate.getTime() !== selectedFirebaseEvent.date.getTime() && (
                    <RNText style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                      Until {selectedFirebaseEvent.endDate.toLocaleString()}
                    </RNText>
                  )}
                <RNText style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                  Type: {selectedFirebaseEvent.type}
                </RNText>
                {selectedFirebaseEvent.description && (
                  <RNText
                    style={[
                      textStyles.bodySmall,
                      { color: colors.foregroundSubtle, marginTop: spacing[2], fontStyle: 'italic' },
                    ]}
                  >
                    {selectedFirebaseEvent.description}
                  </RNText>
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
          style={{ backgroundColor: colors.surface }}
        >
          <Dialog.Title style={{ color: colors.foreground }}>Add Event</Dialog.Title>
          <Dialog.Content>
            <View style={styles.formGroup}>
              <Input
                label="Title *"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter event title"
              />
            </View>

            <View style={styles.formGroup}>
              <Input
                label="Type"
                value={formData.type}
                onChangeText={(text) => setFormData({ ...formData, type: text })}
                placeholder="Event type"
              />
            </View>

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

            <View style={styles.formGroup}>
              <Input
                label="Description"
                value={formData.description || ''}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
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
          style={{ backgroundColor: colors.surface }}
        >
          <Dialog.Title style={{ color: colors.foreground }}>Edit Event</Dialog.Title>
          <Dialog.Content>
            <View style={styles.formGroup}>
              <Input
                label="Title *"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter event title"
              />
            </View>

            <View style={styles.formGroup}>
              <Input
                label="Type"
                value={formData.type}
                onChangeText={(text) => setFormData({ ...formData, type: text })}
                placeholder="Event type"
              />
            </View>

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

            <View style={styles.formGroup}>
              <Input
                label="Description"
                value={formData.description || ''}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
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
    marginTop: spacing[2],
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  eventsList: {
    flex: 1,
  },
  emptyState: {
    paddingVertical: spacing[8],
  },
  eventCard: {
    marginBottom: spacing[2],
  },
  eventContent: {
    paddingVertical: spacing[1],
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  eventIconContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  eventIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  eventInfo: {
    flex: 1,
    marginRight: spacing[2],
  },
  eventTitle: {
    color: '#FFFFFF',
    marginBottom: spacing[0.5],
  },
  eventTime: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing[1],
  },
  eventDescription: {
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing[1],
  },
  formGroup: {
    marginBottom: spacing[4],
  },
  dateButton: {
    marginBottom: spacing[4],
    alignSelf: 'flex-start',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  timeButton: {
    flex: 1,
  },
  dialogActions: {
    gap: spacing[2],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
});
