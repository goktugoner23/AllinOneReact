import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, IconButton, useTheme } from 'react-native-paper';
import { TaskGroup } from '@features/tasks/types/Task';

interface TaskGroupHeaderProps {
  group: TaskGroup;
  taskCount: number;
  completedCount: number;
  onLongPress: (group: TaskGroup) => void;
}

const TaskGroupHeader: React.FC<TaskGroupHeaderProps> = ({ group, taskCount, completedCount, onLongPress }) => {
  const theme = useTheme();

  const completionPercentage = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  const getGroupColor = () => {
    return group.color || theme.colors.primary;
  };

  return (
    <Card
      style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}
      elevation={1}
      onLongPress={() => onLongPress(group)}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.colorIndicator, { backgroundColor: getGroupColor() }]} />
        </View>

        <View style={styles.middleSection}>
          <Text variant="titleMedium" style={[styles.groupTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {group.title}
          </Text>

          {group.description && (
            <Text
              variant="bodySmall"
              style={[styles.groupDescription, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {group.description}
            </Text>
          )}

          <Text variant="bodySmall" style={[styles.taskCount, { color: theme.colors.onSurfaceVariant }]}>
            {completedCount} of {taskCount} tasks completed ({completionPercentage}%)
          </Text>
        </View>

        <View style={styles.rightSection}>
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={() => onLongPress(group)}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    // backgroundColor will be set dynamically
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    // backgroundColor will be set dynamically
  },
  groupTitle: {
    fontWeight: '600',
    marginBottom: 2,
    // Color will be set dynamically
  },
  groupDescription: {
    marginBottom: 2,
    // Color will be set dynamically
  },
  taskCount: {
    // Color will be set dynamically
  },
});

export default TaskGroupHeader;
