import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Alert, ScrollView, ActivityIndicator, Text } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import { generateCalendarEvents } from '@features/calendar/store/calendarSlice';
import { loadStudents, loadRegistrations, loadLessons, loadSeminars } from '@features/wtregistry/store/wtRegistrySlice';
import { CalendarEvent } from '@features/wtregistry/types/WTRegistry';
import { Event, EventFormData, serializableToEvent } from '@features/calendar/types/Event';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCalendarEvents, useAddCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from '@shared/hooks';
import { Card, CardContent, Button, Input, Chip, EmptyState, Dialog, IconButton } from '@shared/components/ui';
import { useColors, spacing, radius, textStyles } from '@shared/theme';

export function CalendarScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const colors = useColors();

  // TanStack Query for remote events
  const { data: remoteEvents = [], isLoading: isLoadingEvents } = useCalendarEvents();
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
  const [selectedRemoteEvent, setSelectedRemoteEvent] = useState<Event | null>(null);

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

  // Combine remote events (already Event objects) with WTRegistry events
  const allEvents = [
    ...remoteEvents.map((event) => ({
      id: `remote-${event.id}`,
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.endDate,
      type: event.type as CalendarEvent['type'],
      isRemoteEvent: true,
      remoteEvent: event as Event | undefined,
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
        isRemoteEvent: false,
        remoteEvent: undefined as Event | undefined,
      };
    }),
  ];

  const handleDayPress = (day: DateData) => {
    setSelectedDateState(day.dateString);
    // Clear any selected events when date changes
    setSelectedEvent(null);
    setSelectedRemoteEvent(null);
  };

  const handleEventPress = (event: (typeof allEvents)[0]) => {
    if (event.isRemoteEvent && event.remoteEvent) {
      setSelectedRemoteEvent(event.remoteEvent);
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
      setSelectedRemoteEvent(null);
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

    if (!selectedRemoteEvent) return;

    try {
      await updateEventMutation.mutateAsync({
        eventId: selectedRemoteEvent.id,
        eventData: formData,
      });
      setShowEditDialog(false);
      setShowEventModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedRemoteEvent) return;

    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEventMutation.mutateAsync(selectedRemoteEvent.id);
            setShowEventModal(false);
            setSelectedRemoteEvent(null);
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

      let color = colors.warning; // default — seminars / misc

      // Handle remote events and WTRegistry events (both use string types)
      if (typeof event.type === 'string') {
        if (event.type.includes('Registration Start')) {
          color = colors.success;
        } else if (event.type.includes('Registration End')) {
          color = colors.destructive;
        } else if (event.type.includes('lesson')) {
          color = colors.info;
        } else {
          color = colors.warning;
        }
      } else {
        // Legacy WTRegistry events (union types) - fallback
        switch (event.type) {
          case 'registration_start':
            color = colors.success;
            break;
          case 'registration_end':
            color = colors.destructive;
            break;
          case 'lesson':
            color = colors.info;
            break;
          case 'seminar':
            color = colors.warning;
            break;
          default:
            color = colors.warning;
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

  // Process the colors to show only one dot based on priority.
  // Priority: destructive > success > warning > info
  Object.keys(markedDates).forEach((dateKey) => {
    const dotColors = markedDates[dateKey].colors || [];
    let priorityColor = colors.warning;

    if (dotColors.includes(colors.destructive)) {
      priorityColor = colors.destructive;
    } else if (dotColors.includes(colors.success)) {
      priorityColor = colors.success;
    } else if (dotColors.includes(colors.warning)) {
      priorityColor = colors.warning;
    } else if (dotColors.includes(colors.info)) {
      priorityColor = colors.info;
    }

    markedDates[dateKey].dots = [{ color: priorityColor }];
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

  const EVENT_TYPE_CONFIG: Record<string, { color: string; chip: 'success' | 'error' | 'primary' | 'warning' | 'default'; label: string }> = {
    'Registration Start': { color: colors.success, chip: 'success', label: 'Start' },
    'registration_start': { color: colors.success, chip: 'success', label: 'Start' },
    'Registration End': { color: colors.destructive, chip: 'error', label: 'End' },
    'registration_end': { color: colors.destructive, chip: 'error', label: 'End' },
    'lesson': { color: colors.info, chip: 'primary', label: 'Lesson' },
    'seminar': { color: colors.warning, chip: 'warning', label: 'Seminar' },
  };
  const DEFAULT_EVENT_CONFIG = { color: colors.primary, chip: 'default' as const, label: '' };

  const getEventConfig = (type: string) => EVENT_TYPE_CONFIG[type] || DEFAULT_EVENT_CONFIG;

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
          <Text style={[textStyles.h4, { color: colors.foreground }]}>
            Events for {new Date(selectedDate).toLocaleDateString()}
          </Text>
          <IconButton icon="add" size="sm" variant="filled" onPress={handleAddEvent} />
        </View>

        <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
          {isLoadingEvents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: spacing[2] }]}>
                Loading events...
              </Text>
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
                variant="outlined"
                padding="sm"
                style={styles.eventCard}
                onPress={() => handleEventPress(event)}
              >
                <CardContent style={styles.eventContent}>
                  <View style={styles.eventRow}>
                    {/* Left indicator bar */}
                    <View style={[styles.eventIndicator, { backgroundColor: getEventConfig(event.type).color }]} />

                    {/* Event content */}
                    <View style={styles.eventInfo}>
                      {/* Header with title and chip */}
                      <View style={styles.eventHeaderRow}>
                        <Text style={[textStyles.label, { color: colors.foreground, flex: 1 }]} numberOfLines={2}>
                          {event.title}
                        </Text>
                        <Chip color={getEventConfig(event.type).chip} size="sm" variant="filled">
                          {getEventConfig(event.type).label || event.type.replace('_', ' ')}
                        </Chip>
                      </View>

                      {/* Time info */}
                      <Text style={[textStyles.caption, { color: colors.foregroundMuted, marginTop: spacing[1] }]}>
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

                      {/* Description */}
                      {event.description && (
                        <Text
                          style={[textStyles.bodySmall, { color: colors.foregroundSubtle, marginTop: spacing[1] }]}
                          numberOfLines={2}
                        >
                          {event.description}
                        </Text>
                      )}
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </ScrollView>
      </Card>

      {/* Event Details Modal */}
      <Dialog visible={showEventModal} onClose={() => setShowEventModal(false)} title="Event Details">
        {(() => {
          const event = selectedRemoteEvent || selectedEvent;
          if (!event) return null;
          return (
            <View>
              <Text style={[textStyles.h4, { color: colors.foreground, marginBottom: spacing[3] }]}>
                {event.title}
              </Text>
              <Text style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                Date: {event.date.toLocaleString()}
              </Text>
              {event.endDate && event.endDate.getTime() !== event.date.getTime() && (
                <Text style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                  Until {event.endDate.toLocaleString()}
                </Text>
              )}
              <Text style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                Type: {event.type.replace('_', ' ')}
              </Text>
              {event.description && (
                <Text
                  style={[
                    textStyles.bodySmall,
                    { color: colors.foregroundSubtle, marginTop: spacing[2], fontStyle: 'italic' },
                  ]}
                >
                  {event.description}
                </Text>
              )}
            </View>
          );
        })()}
        <View style={styles.dialogActions}>
          {selectedRemoteEvent && (
            <>
              <Button variant="ghost" onPress={() => handleEditEvent(selectedRemoteEvent)}>
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
              setSelectedRemoteEvent(null);
            }}
          >
            Close
          </Button>
        </View>
      </Dialog>

      {/* Add/Edit Event Modal */}
      {(showAddDialog || showEditDialog) && (
        <Dialog
          visible={true}
          onClose={() => { setShowAddDialog(false); setShowEditDialog(false); }}
          title={showEditDialog ? 'Edit Event' : 'Add Event'}
        >
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

          <View style={styles.dialogActions}>
            <Button variant="ghost" onPress={() => { setShowAddDialog(false); setShowEditDialog(false); }}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onPress={showEditDialog ? handleUpdateEvent : handleSaveEvent}
              loading={showEditDialog ? updateEventMutation.isPending : addEventMutation.isPending}
            >
              {showEditDialog ? 'Update Event' : 'Add Event'}
            </Button>
          </View>
        </Dialog>
      )}

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
  eventRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  eventIndicator: {
    width: 4,
    borderRadius: radius.full,
    marginRight: spacing[3],
  },
  eventInfo: {
    flex: 1,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },
});
