import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Checkbox, IconButton } from 'react-native-paper';
import { Task } from '../types/Task';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  style?: any;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggleComplete, onEdit, style }) => {
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
      return '#FFEBEE'; // Light red for overdue
    }
    if (task.completed) {
      return '#F5F5F5'; // Light gray for completed
    }
    return '#ffffff'; // White for normal
  };

  // Get text color based on task state
  const getTextColor = () => {
    if (task.completed) {
      return '#666666'; // Gray for completed
    }
    if (isOverdue) {
      return '#FF3B30'; // Red for overdue
    }
    return '#000000'; // Black for normal
  };

  return (
    <Card
      style={[
        styles.card,
        { backgroundColor: getCardBackgroundColor() },
        style
      ]}
      elevation={2}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Checkbox
            status={task.completed ? 'checked' : 'unchecked'}
            onPress={() => onToggleComplete(task)}
            color="#007AFF"
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
              }
            ]}
            numberOfLines={2}
          >
            {task.name}
          </Text>

          {task.description && (
            <Text
              variant="bodyMedium"
              style={[styles.description, { color: '#666666' }]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          )}

          {task.dueDate && (
            <Text
              variant="bodySmall"
              style={[
                styles.dueDate,
                { color: isOverdue ? '#FF3B30' : '#666666' }
              ]}
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
            iconColor="#666666"
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
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
  },
  description: {
    marginBottom: 4,
  },
  dueDate: {
    fontWeight: '400',
  },
});

export default TaskCard;
