import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Checkbox, IconButton, useTheme } from 'react-native-paper';
import { Task } from '@features/tasks/types/Task';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  style?: any;
}

const TaskCard: React.FC<TaskCardProps> = React.memo(({ task, onToggleComplete, onEdit, style }) => {
  const theme = useTheme();

  // Check if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  // Format due date
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get card background color based on task state
  const getCardBackgroundColor = () => {
    if (isOverdue) {
      return theme.colors.errorContainer;
    }
    if (task.completed) {
      return theme.colors.surfaceVariant;
    }
    return theme.colors.surface;
  };

  // Get text color based on task state
  const getTextColor = () => {
    if (task.completed) {
      return theme.colors.onSurfaceVariant;
    }
    if (isOverdue) {
      return theme.colors.error;
    }
    return theme.colors.onSurface;
  };

  return (
    <Card style={[styles.card, { backgroundColor: getCardBackgroundColor() }, style]} elevation={2}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Checkbox
            status={task.completed ? 'checked' : 'unchecked'}
            onPress={() => onToggleComplete(task)}
            color={theme.colors.primary}
          />
        </View>

        <View style={styles.middleSection}>
          <Text
            variant="titleMedium"
            style={[
              styles.taskName,
              {
                color: getTextColor(),
                textDecorationLine: task.completed ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={2}
          >
            {task.name}
          </Text>

          {task.description && (
            <Text
              variant="bodyMedium"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          {task.dueDate && (
            <Text
              variant="bodySmall"
              style={[styles.dueDate, { color: isOverdue ? theme.colors.error : theme.colors.onSurfaceVariant }]}
            >
              Due: {formatDueDate(task.dueDate)}
            </Text>
          )}
        </View>

        <View style={styles.rightSection}>
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={() => onEdit(task)}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    // backgroundColor will be set dynamically
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  leftSection: {
    marginRight: 12,
  },
  middleSection: {
    flex: 1,
  },
  rightSection: {
    marginLeft: 8,
  },
  taskName: {
    fontWeight: '500',
    marginBottom: 4,
    // Color will be set dynamically
  },
  description: {
    marginBottom: 4,
    // Color will be set dynamically
  },
  dueDate: {
    // Color will be set dynamically
  },
});

export default TaskCard;
