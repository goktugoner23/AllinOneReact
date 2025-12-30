import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Card, Text, Checkbox, IconButton } from 'react-native-paper';
import { Task } from '@features/tasks/types/Task';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  style?: ViewStyle;
}

const TaskCard: React.FC<TaskCardProps> = React.memo(({ task, onToggleComplete, onEdit, style }) => {
  const colors = useColors();

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
      return colors.destructiveMuted;
    }
    if (task.completed) {
      return colors.muted;
    }
    return colors.card;
  };

  // Get text color based on task state
  const getTextColor = () => {
    if (task.completed) {
      return colors.foregroundMuted;
    }
    if (isOverdue) {
      return colors.destructive;
    }
    return colors.foreground;
  };

  return (
    <View
      style={[styles.card, shadow.sm, { backgroundColor: getCardBackgroundColor(), borderColor: colors.border }, style]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Checkbox
            status={task.completed ? 'checked' : 'unchecked'}
            onPress={() => onToggleComplete(task)}
            color={colors.primary}
            uncheckedColor={colors.foregroundMuted}
          />
        </View>

        <View style={styles.middleSection}>
          <Text
            style={[
              textStyles.body,
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
            <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]} numberOfLines={2}>
              {task.description}
            </Text>
          )}

          {task.dueDate && (
            <Text
              style={[
                textStyles.caption,
                styles.dueDate,
                { color: isOverdue ? colors.destructive : colors.foregroundSubtle },
              ]}
            >
              Due: {formatDueDate(task.dueDate)}
            </Text>
          )}
        </View>

        <View style={styles.rightSection}>
          <IconButton icon="dots-vertical" size={20} onPress={() => onEdit(task)} iconColor={colors.foregroundMuted} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[1],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  leftSection: {
    marginRight: spacing[3],
  },
  middleSection: {
    flex: 1,
    gap: spacing[1],
  },
  rightSection: {
    marginLeft: spacing[2],
  },
  taskName: {
    fontWeight: '500',
  },
  dueDate: {
    marginTop: spacing[1],
  },
});

export default TaskCard;
