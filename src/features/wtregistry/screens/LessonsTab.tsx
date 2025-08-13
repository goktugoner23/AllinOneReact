import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Card,
  Text,
  Portal,
  Dialog,
  Button,
  IconButton,
  useTheme,
  Surface,
  SegmentedButtons,
} from 'react-native-paper';
import { PurpleFab } from '@shared/components';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import { addLesson, updateLesson, deleteLesson, loadLessons } from '@features/wtregistry/store/wtRegistrySlice';
import { WTLesson } from '@features/wtregistry/types/WTRegistry';
import DateTimePicker from '@react-native-community/datetimepicker';

export function LessonsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
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
        await dispatch(updateLesson({
          ...editingLesson,
          ...lessonData,
        })).unwrap();
      } else {
        await dispatch(addLesson(lessonData)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      Alert.alert('Error', 'Failed to save lesson');
    }
  };

  const handleDelete = (lesson: WTLesson) => {
    Alert.alert(
      'Delete Lesson',
      `Are you sure you want to delete the ${dayNames[lesson.dayOfWeek]} lesson?`,
      [
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
      ]
    );
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
      <Card style={[styles.lessonCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
        <Card.Content>
          <View style={styles.lessonHeader}>
            <View style={styles.lessonInfo}>
              <Text variant="titleMedium" style={styles.dayName}>
                {dayNames[lesson.dayOfWeek]}
              </Text>
              <Text variant="bodyLarge" style={styles.timeRange}>
                {formatTime(lesson.startHour, lesson.startMinute)} - {formatTime(lesson.endHour, lesson.endMinute)}
              </Text>
              <Text variant="bodyMedium" style={styles.duration}>
                Duration: {getDuration(lesson.startHour, lesson.startMinute, lesson.endHour, lesson.endMinute)}
              </Text>
            </View>
            <View style={styles.lessonActions}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => handleOpenDialog(lesson)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor={theme.colors.error}
                onPress={() => handleDelete(lesson)}
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
          Weekly Lesson Schedule
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} scheduled
        </Text>
      </Surface>

      <FlatList
        data={sortedLessons}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLessonCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No lessons scheduled yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Tap the + button to add your first lesson
            </Text>
          </View>
        }
      />

      <PurpleFab style={styles.fab} onPress={() => handleOpenDialog()} />

      <Portal>
        <Dialog visible={showDialog} onDismiss={handleCloseDialog}>
          <Dialog.Title>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.fieldLabel}>
              Day of Week
            </Text>
            <SegmentedButtons
              value={formData.dayOfWeek.toString()}
              onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
              buttons={dayButtons}
              style={styles.daySelector}
            />

            <Text variant="bodyMedium" style={styles.fieldLabel}>
              Start Time
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker('start')}
              style={styles.timeButton}
              icon="clock-outline"
            >
              {formatTime(formData.startTime.getHours(), formData.startTime.getMinutes())}
            </Button>

            <Text variant="bodyMedium" style={styles.fieldLabel}>
              End Time
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowTimePicker('end')}
              style={styles.timeButton}
              icon="clock-outline"
            >
              {formatTime(formData.endTime.getHours(), formData.endTime.getMinutes())}
            </Button>

            <View style={styles.durationContainer}>
              <Text variant="bodySmall" style={styles.durationText}>
                Duration: {getDuration(
                  formData.startTime.getHours(), 
                  formData.startTime.getMinutes(),
                  formData.endTime.getHours(), 
                  formData.endTime.getMinutes()
                )}
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDialog}>Cancel</Button>
            <Button 
              onPress={handleSave} 
              mode="contained"
              disabled={formData.startTime >= formData.endTime}
            >
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
  lessonCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
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
  dayName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timeRange: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  duration: {
    color: '#666',
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
  fieldLabel: {
    marginBottom: 8,
    marginTop: 16,
    fontWeight: 'bold',
  },
  daySelector: {
    marginBottom: 16,
  },
  timeButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
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