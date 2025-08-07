import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

interface EmptyTasksStateProps {
  onCreateTask: () => void;
}

const EmptyTasksState: React.FC<EmptyTasksStateProps> = ({ onCreateTask }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text
          style={[
            styles.icon,
            { color: '#666666' }
          ]}
        >
          📝
        </Text>
      </View>

      <Text
        variant="headlineSmall"
        style={[
          styles.title,
          { color: '#666666' }
        ]}
      >
        No tasks yet
      </Text>

      <Text
        variant="bodyMedium"
        style={[
          styles.subtitle,
          { color: '#666666' }
        ]}
      >
        Create your first task to get started
      </Text>

      <Button
        mode="contained"
        onPress={onCreateTask}
        style={styles.button}
        buttonColor="#007AFF"
        textColor="#ffffff"
        icon="plus"
      >
        Create Task
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    borderRadius: 8,
  },
});

export default EmptyTasksState;
