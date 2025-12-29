import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';

interface EmptyTasksStateProps {
  onCreateTask: () => void;
}

const EmptyTasksState: React.FC<EmptyTasksStateProps> = ({ onCreateTask }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>
        No Tasks Yet
      </Text>
      <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
        Create your first task to get started with task management.
      </Text>
      <Button
        mode="contained"
        onPress={onCreateTask}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        textColor={theme.colors.onPrimary}
      >
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
    paddingHorizontal: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    // Color will be set dynamically
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    // Color will be set dynamically
  },
  button: {
    // backgroundColor will be set dynamically
  },
});

export default EmptyTasksState;
