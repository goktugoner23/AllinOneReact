import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Text } from 'react-native';
import { Card, Portal, Dialog, TextInput, Button as PaperButton, IconButton, Surface, Chip } from 'react-native-paper';
import { AddFab } from '@shared/components';
import { Button } from '@shared/components/ui';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import { addSeminar, deleteSeminar, updateSeminar, loadSeminars } from '@features/wtregistry/store/wtRegistrySlice';
import { WTSeminar } from '@features/wtregistry/types/WTRegistry';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppTheme, spacing, radius, textStyles } from '@shared/theme';

export function SeminarsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useAppTheme();
  const { seminars, loading } = useSelector((state: RootState) => state.wtRegistry);

  const [showDialog, setShowDialog] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);
  const [editingSeminar, setEditingSeminar] = useState<WTSeminar | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: new Date(),
    startTime: new Date(),
    endTime: new Date(),
    description: '',
    location: '',
  });

  // Load seminars when component mounts
  useEffect(() => {
    console.log('🔍 Loading seminars from Firebase...');
    dispatch(loadSeminars());
  }, [dispatch]);

  const sortedSeminars = [...seminars].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? new Date(a.date) : a.date;
    const dateB = typeof b.date === 'string' ? new Date(b.date) : b.date;
    return dateB.getTime() - dateA.getTime();
  });

  const handleOpenDialog = (seminar?: WTSeminar) => {
    if (seminar) {
      setEditingSeminar(seminar);
      const startTime = new Date();
      startTime.setHours(seminar.startHour, seminar.startMinute, 0, 0);
      const endTime = new Date();
      endTime.setHours(seminar.endHour, seminar.endMinute, 0, 0);

      setFormData({
        name: seminar.name,
        date: typeof seminar.date === 'string' ? new Date(seminar.date) : seminar.date,
        startTime,
        endTime,
        description: seminar.description || '',
        location: seminar.location || '',
      });
    } else {
      setEditingSeminar(null);
      const now = new Date();
      // Set default end time to 4 hours later (like Kotlin app)
      const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);

      setFormData({
        name: '',
        date: now,
        startTime: now,
        endTime,
        description: '',
        location: '',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingSeminar(null);
    setShowDatePicker(false);
    setShowTimePicker(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Seminar name is required');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      const seminarData = {
        name: formData.name.trim(),
        date: formData.date,
        startHour: formData.startTime.getHours(),
        startMinute: formData.startTime.getMinutes(),
        endHour: formData.endTime.getHours(),
        endMinute: formData.endTime.getMinutes(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
      };

      if (editingSeminar) {
        await dispatch(
          updateSeminar({
            ...editingSeminar,
            ...seminarData,
          }),
        ).unwrap();
      } else {
        await dispatch(addSeminar(seminarData)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      Alert.alert('Error', 'Failed to save seminar');
    }
  };

  const handleDelete = (seminar: WTSeminar) => {
    Alert.alert('Delete Seminar', `Are you sure you want to delete "${seminar.name}"?`, [
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
    ]);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Update both date and times to maintain consistency
      const newDate = new Date(selectedDate);
      const currentStartTime = formData.startTime;
      const currentEndTime = formData.endTime;

      newDate.setHours(currentStartTime.getHours(), currentStartTime.getMinutes(), 0, 0);
      const newEndTime = new Date(newDate);
      newEndTime.setHours(currentEndTime.getHours(), currentEndTime.getMinutes(), 0, 0);

      setFormData({
        ...formData,
        date: newDate,
        startTime: newDate,
        endTime: newEndTime,
      });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime && showTimePicker) {
      const newTime = new Date(selectedTime);

      if (showTimePicker === 'start') {
        // Ensure end time is after start time
        const endTime = new Date(formData.endTime);
        if (newTime >= endTime) {
          // Set end time to 4 hours after new start time
          endTime.setTime(newTime.getTime() + 4 * 60 * 60 * 1000);
          setFormData({
            ...formData,
            startTime: newTime,
            endTime,
          });
        } else {
          setFormData({
            ...formData,
            startTime: newTime,
          });
        }
      } else {
        // Ensure end time is after start time
        if (newTime > formData.startTime) {
          setFormData({
            ...formData,
            endTime: newTime,
          });
        } else {
          Alert.alert('Error', 'End time must be after start time');
        }
      }
    }
    setShowTimePicker(null);
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const isUpcoming = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.getTime() > new Date().getTime();
  };

  const getDuration = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const renderSeminarCard = ({ item: seminar }: { item: WTSeminar }) => {
    const upcoming = isUpcoming(seminar.date);
    return (
      <Card
        style={{
          marginHorizontal: spacing[4],
          marginBottom: spacing[3],
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          borderLeftWidth: 4,
          borderLeftColor: upcoming ? colors.primary : colors.foregroundSubtle,
        }}
        mode="elevated"
      >
        <Card.Content style={{ padding: spacing[4] }}>
          <View style={styles.seminarHeader}>
            <View style={styles.seminarInfo}>
              <View style={styles.titleRow}>
                <Text style={[textStyles.h4, { color: colors.foreground, flex: 1, marginRight: spacing[2] }]}>
                  {seminar.name}
                </Text>
                <Chip
                  mode="outlined"
                  style={{
                    alignSelf: 'flex-start',
                    backgroundColor: upcoming ? colors.primaryMuted : colors.muted,
                  }}
                  textStyle={[
                    textStyles.labelSmall,
                    {
                      color: upcoming ? colors.primary : colors.foregroundMuted,
                    },
                  ]}
                >
                  {upcoming ? 'Upcoming' : 'Past'}
                </Chip>
              </View>

              <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '600', marginTop: spacing[2] }]}>
                {(typeof seminar.date === 'string' ? new Date(seminar.date) : seminar.date).toLocaleDateString()}
              </Text>
              <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: spacing[1] }]}>
                {formatTime(seminar.startHour, seminar.startMinute)} - {formatTime(seminar.endHour, seminar.endMinute)}
              </Text>

              <Text
                style={[
                  textStyles.caption,
                  { color: colors.foregroundSubtle, fontStyle: 'italic', marginTop: spacing[1] },
                ]}
              >
                Duration: {getDuration(seminar.startHour, seminar.startMinute, seminar.endHour, seminar.endMinute)}
              </Text>

              {seminar.location && (
                <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: spacing[2] }]}>
                  Location: {seminar.location}
                </Text>
              )}

              {seminar.description && (
                <Text
                  style={[
                    textStyles.caption,
                    { color: colors.foregroundSubtle, fontStyle: 'italic', marginTop: spacing[2] },
                  ]}
                >
                  {seminar.description}
                </Text>
              )}
            </View>
            <View style={styles.seminarActions}>
              <IconButton
                icon="pencil"
                size={20}
                iconColor={colors.primary}
                onPress={() => handleOpenDialog(seminar)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor={colors.destructive}
                onPress={() => handleDelete(seminar)}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Surface
        style={{
          padding: spacing[4],
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
        elevation={0}
      >
        <Text style={[textStyles.h4, { color: colors.foreground, marginBottom: spacing[1] }]}>Wing Tzun Seminars</Text>
        <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>
          {seminars.length} seminar{seminars.length !== 1 ? 's' : ''} total
        </Text>
      </Surface>

      <FlatList
        data={sortedSeminars}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSeminarCard}
        contentContainerStyle={{ paddingTop: spacing[3], paddingBottom: spacing[20] }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
              No seminars scheduled yet
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.foregroundSubtle }]}>
              Tap the + button to add your first seminar
            </Text>
          </View>
        }
      />

      <AddFab style={styles.fab} onPress={() => handleOpenDialog()} />

      <Portal>
        <Dialog
          visible={showDialog}
          onDismiss={handleCloseDialog}
          style={{ backgroundColor: colors.surface, borderRadius: radius.xl }}
        >
          <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>
            {editingSeminar ? 'Edit Seminar' : 'Add Seminar'}
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Seminar Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              style={{ marginBottom: spacing[4] }}
              mode="outlined"
              autoFocus
            />

            <PaperButton
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={{ marginBottom: spacing[4], alignSelf: 'flex-start' }}
              icon="calendar"
            >
              Date: {formData.date.toLocaleDateString()}
            </PaperButton>

            <View style={styles.timeContainer}>
              <PaperButton
                mode="outlined"
                onPress={() => setShowTimePicker('start')}
                style={{ flex: 0.48 }}
                icon="clock-outline"
              >
                Start: {formatTime(formData.startTime.getHours(), formData.startTime.getMinutes())}
              </PaperButton>
              <PaperButton
                mode="outlined"
                onPress={() => setShowTimePicker('end')}
                style={{ flex: 0.48 }}
                icon="clock-outline"
              >
                End: {formatTime(formData.endTime.getHours(), formData.endTime.getMinutes())}
              </PaperButton>
            </View>

            <TextInput
              label="Location"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              style={{ marginBottom: spacing[4] }}
              mode="outlined"
              left={<TextInput.Icon icon="map-marker" />}
            />

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              style={{ marginBottom: spacing[4] }}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.durationContainer}>
              <Text style={[textStyles.caption, { color: colors.foregroundSubtle, fontStyle: 'italic' }]}>
                Duration:{' '}
                {getDuration(
                  formData.startTime.getHours(),
                  formData.startTime.getMinutes(),
                  formData.endTime.getHours(),
                  formData.endTime.getMinutes(),
                )}
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions style={{ gap: spacing[2], padding: spacing[4] }}>
            <Button variant="ghost" onPress={handleCloseDialog}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleSave} disabled={!formData.name.trim()}>
              {editingSeminar ? 'Update' : 'Add'} Seminar
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  durationContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
});
