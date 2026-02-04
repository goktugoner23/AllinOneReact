import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { IconButton } from '@shared/components/ui';
import { TaskGroup } from '@features/tasks/types/Task';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';

interface TaskGroupHeaderProps {
  group: TaskGroup;
  taskCount: number;
  completedCount: number;
  onLongPress: (group: TaskGroup) => void;
}

const TaskGroupHeader: React.FC<TaskGroupHeaderProps> = ({ group, taskCount, completedCount, onLongPress }) => {
  const colors = useColors();

  const completionPercentage = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  const getGroupColor = () => {
    return group.color || colors.primary;
  };

  return (
    <Pressable
      style={[styles.card, shadow.sm, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onLongPress={() => onLongPress(group)}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={[styles.colorIndicator, { backgroundColor: getGroupColor() }]} />
        </View>

        <View style={styles.middleSection}>
          <Text style={[textStyles.label, { color: colors.foreground }]} numberOfLines={1}>
            {group.title}
          </Text>

          {group.description && (
            <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted }]} numberOfLines={1}>
              {group.description}
            </Text>
          )}

          <Text style={[textStyles.caption, { color: colors.foregroundSubtle }]}>
            {completedCount} of {taskCount} tasks completed ({completionPercentage}%)
          </Text>
        </View>

        <View style={styles.rightSection}>
          <IconButton
            icon="ellipsis-vertical"
            size="sm"
            variant="ghost"
            onPress={() => onLongPress(group)}
            color={colors.foregroundMuted}
          />
        </View>
      </View>
    </Pressable>
  );
};

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
    padding: spacing[3],
  },
  leftSection: {
    marginRight: spacing[3],
  },
  middleSection: {
    flex: 1,
    gap: spacing[0.5],
  },
  rightSection: {
    marginLeft: spacing[2],
  },
  colorIndicator: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
  },
});

export default TaskGroupHeader;
