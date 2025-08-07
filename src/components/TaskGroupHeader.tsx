import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { TaskGroup } from '../types/Task';

interface TaskGroupHeaderProps {
  group: TaskGroup;
  taskCount: number;
  completedCount: number;
  onLongPress: (group: TaskGroup) => void;
}

const TaskGroupHeader: React.FC<TaskGroupHeaderProps> = ({ 
  group, 
  taskCount, 
  completedCount, 
  onLongPress 
}) => {
  // Calculate progress percentage
  const progress = taskCount > 0 ? completedCount / taskCount : 0;

  // Parse group color
  const getGroupColor = () => {
    try {
      return group.color;
    } catch {
      return '#007AFF';
    }
  };

  const groupColor = getGroupColor();

  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(group)}
      activeOpacity={0.7}
    >
      <Card
        style={[
          styles.card,
          { backgroundColor: '#f5f5f5' }
        ]}
        elevation={1}
      >
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View
              style={[
                styles.colorIndicator,
                { backgroundColor: groupColor }
              ]}
            />
          </View>

          <View style={styles.middleSection}>
            <Text
              variant="titleMedium"
              style={[
                styles.groupTitle,
                { color: '#000000' }
              ]}
              numberOfLines={1}
            >
              {group.title}
            </Text>

            {group.description && (
              <Text
                variant="bodySmall"
                style={[styles.description, { color: '#666666' }]}
                numberOfLines={1}
              >
                {group.description}
              </Text>
            )}

            <Text
              variant="bodySmall"
              style={[styles.progressText, { color: '#666666' }]}
            >
              {completedCount}/{taskCount} completed
            </Text>
          </View>

          <View style={styles.rightSection}>
            {taskCount > 0 && (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: '#e0e0e0' }
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: groupColor,
                        width: `${progress * 100}%`,
                      }
                    ]}
                  />
                </View>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.progressPercentage,
                    { color: groupColor }
                  ]}
                >
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
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
    alignItems: 'flex-end',
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  groupTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  description: {
    marginBottom: 4,
  },
  progressText: {
    fontWeight: '400',
  },
  progressContainer: {
    alignItems: 'center',
    minWidth: 60,
  },
  progressBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressPercentage: {
    fontWeight: '500',
    fontSize: 12,
  },
});

export default TaskGroupHeader;
