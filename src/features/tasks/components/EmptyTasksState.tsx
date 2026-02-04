import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button } from '@shared/components/ui';
import { useColors, spacing, textStyles, radius } from '@shared/theme';

interface EmptyTasksStateProps {
  onCreateTask: () => void;
}

const EmptyTasksState: React.FC<EmptyTasksStateProps> = ({ onCreateTask }) => {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={[textStyles.h3, styles.title, { color: colors.foreground }]}>No Tasks Yet</Text>
      <Text style={[textStyles.body, styles.description, { color: colors.foregroundMuted }]}>
        Create your first task to get started with task management.
      </Text>
      <Button variant="primary" onPress={onCreateTask} style={styles.button}>
        Create Your First Task
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[4],
  },
});

export default EmptyTasksState;
