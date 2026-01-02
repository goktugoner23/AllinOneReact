import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Text } from 'react-native';
import { Card, Portal, Dialog, Button as PaperButton, IconButton, Surface, SegmentedButtons } from 'react-native-paper';
import { AddFab } from '@shared/components';
import { Button } from '@shared/components/ui';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import { addLesson, updateLesson, deleteLesson, loadLessons } from '@features/wtregistry/store/wtRegistrySlice';
import { WTLesson } from '@features/wtregistry/types/WTRegistry';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppTheme, spacing, radius, textStyles } from '@shared/theme';

export function LessonsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useAppTheme();
  const { lessons, loading } = useSelector((state: RootState) => state.wtRegistry);

  const [showDialog, setShowDialog] = useState(false);
  const [editingLesson, setEditingLesson] = useState<WTLesson | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<'start' | 'end' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    dayOfWeek: 1, // Monday
    startTime: new Date(),
    endTime: new Date(),
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayButtons = dayNames.map((day, index) => ({ value: index.toString(), label: day.slice(0, 3) }));

  // Load lessons when component mounts
  useEffect(() => {
    console.log('🔍 Loading lessons from Firebase...');
    dispatch(loadLessons());
  }, [dispatch]);

  const sortedLessons = [...lessons].sort((a, b) => {
    if (a.dayOfWeek === b.dayOfWeek) {
      return a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute);
    }
    return a.dayOfWeek - b.dayOfWeek;
  });

  const handleOpenDialog = (lesson?: WTLesson) => {
    if (lesson) {
      setEditingLesson(lesson);
      const startTime = new Date();
      startTime.setHours(lesson.startHour, lesson.startMinute, 0, 0);
      const endTime = new Date();
      endTime.setHours(lesson.endHour, lesson.endMinute, 0, 0);

      setFormData({
        dayOfWeek: lesson.dayOfWeek,
        startTime,
        endTime,
      });
    } else {
      setEditingLesson(null);
      const now = new Date();
      const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

      setFormData({
        dayOfWeek: 1, // Monday
        startTime: now,
        endTime,
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingLesson(null);
    setShowTimePicker(null);
  };

  const handleSave = async () => {
    if (formData.startTime >= formData.endTime) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    try {
      const lessonData = {
        dayOfWeek: formData.dayOfWeek,
        startHour: formData.startTime.getHours(),
        startMinute: formData.startTime.getMinutes(),
        endHour: formData.endTime.getHours(),
        endMinute: formData.endTime.getMinutes(),
      };

      if (editingLesson) {
        await dispatch(
          updateLesson({
            ...editingLesson,
            ...lessonData,
          }),
        ).unwrap();
      } else {
        await dispatch(addLesson(lessonData)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      Alert.alert('Error', 'Failed to save lesson');
    }
  };

  const handleDelete = (lesson: WTLesson) => {
    Alert.alert('Delete Lesson', `Are you sure you want to delete the ${dayNames[lesson.dayOfWeek]} lesson?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteLesson(lesson.id)).unwrap();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete lesson');
          }
        },
      },
    ]);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime && showTimePicker) {
      const newTime = new Date(selectedTime);

      if (showTimePicker === 'start') {
        // Ensure end time is after start time
        const endTime = new Date(formData.endTime);
        if (newTime >= endTime) {
          // Set end time to 1 hour after new start time
          endTime.setTime(newTime.getTime() + 60 * 60 * 1000);
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

  const renderLessonCard = ({ item: lesson }: { item: WTLesson }) => (
    <Card
      style={{
        marginHorizontal: spacing[4],
        marginBottom: spacing[3],
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      mode="outlined"
    >
      <Card.Content style={{ padding: spacing[4] }}>
        <View style={styles.lessonHeader}>
          <View style={styles.lessonInfo}>
            <Text style={[textStyles.h4, { color: colors.foreground, marginBottom: spacing[1] }]}>
              {dayNames[lesson.dayOfWeek]}
            </Text>
            <Text
              style={[textStyles.bodyLarge, { color: colors.primary, fontWeight: '600', marginBottom: spacing[1] }]}
            >
              {formatTime(lesson.startHour, lesson.startMinute)} - {formatTime(lesson.endHour, lesson.endMinute)}
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>
              Duration: {getDuration(lesson.startHour, lesson.startMinute, lesson.endHour, lesson.endMinute)}
            </Text>
          </View>
          <View style={styles.lessonActions}>
            <IconButton icon="pencil" size={20} iconColor={colors.primary} onPress={() => handleOpenDialog(lesson)} />
            <IconButton icon="delete" size={20} iconColor={colors.destructive} onPress={() => handleDelete(lesson)} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

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
        <Text style={[textStyles.h4, { color: colors.foreground, marginBottom: spacing[1] }]}>
          Weekly Lesson Schedule
        </Text>
        <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]}>
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} scheduled
        </Text>
      </Surface>

      <FlatList
        data={sortedLessons}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLessonCard}
        contentContainerStyle={{ paddingTop: spacing[3], paddingBottom: spacing[20] }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
              No lessons scheduled yet
            </Text>
            <Text style={[textStyles.bodySmall, { color: colors.foregroundSubtle }]}>
              Tap the + button to add your first lesson
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
            {editingLesson ? 'Edit Lesson' : 'Add Lesson'}
          </Dialog.Title>
          <Dialog.Content>
            <Text
              style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2], marginTop: spacing[4] }]}
            >
              Day of Week
            </Text>
            <SegmentedButtons
              value={formData.dayOfWeek.toString()}
              onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
              buttons={dayButtons}
              style={{ marginBottom: spacing[4] }}
            />

            <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>Start Time</Text>
            <PaperButton
              mode="outlined"
              onPress={() => setShowTimePicker('start')}
              style={{ marginBottom: spacing[4], alignSelf: 'flex-start' }}
              icon="clock-outline"
            >
              {formatTime(formData.startTime.getHours(), formData.startTime.getMinutes())}
            </PaperButton>

            <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>End Time</Text>
            <PaperButton
              mode="outlined"
              onPress={() => setShowTimePicker('end')}
              style={{ marginBottom: spacing[4], alignSelf: 'flex-start' }}
              icon="clock-outline"
            >
              {formatTime(formData.endTime.getHours(), formData.endTime.getMinutes())}
            </PaperButton>

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
            <Button variant="primary" onPress={handleSave} disabled={formData.startTime >= formData.endTime}>
              {editingLesson ? 'Update' : 'Add'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  lessonInfo: {
    flex: 1,
    marginRight: 8,
  },
  lessonActions: {
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
  durationContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
});
