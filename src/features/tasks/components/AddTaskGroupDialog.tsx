import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Dialog, Portal, TextInput, Button, Text, Chip, useTheme } from 'react-native-paper';
import { TASK_GROUP_COLORS } from '@features/tasks/types/Task';

interface AddTaskGroupDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (groupData: { title: string; description?: string; color: string }) => void;
}

const AddTaskGroupDialog: React.FC<AddTaskGroupDialogProps> = ({ visible, onDismiss, onConfirm }) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(TASK_GROUP_COLORS[0].value);

  const handleConfirm = () => {
    if (!title.trim()) return;

    onConfirm({
      title: title.trim(),
      description: description.trim() || undefined,
      color: selectedColor,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSelectedColor(TASK_GROUP_COLORS[0].value);
  };

  const handleDismiss = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setSelectedColor(TASK_GROUP_COLORS[0].value);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={handleDismiss}
        style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      >
        <Dialog.Title style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>Add Task Group</Dialog.Title>
        <Dialog.Content>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <TextInput
                label="Group Title"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.input}
              />
              <TextInput
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.input}
              />
              <View style={styles.colorSection}>
                <Text variant="bodyMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  Color
                </Text>
                <View style={styles.colorGrid}>
                  {TASK_GROUP_COLORS.map((colorOption) => {
                    const isSelected = selectedColor === colorOption.value;

                    return (
                      <View
                        key={colorOption.value}
                        style={[styles.colorOption, isSelected && styles.selectedColorOption]}
                      >
                        <View
                          style={[styles.colorCircle, getColorStyle(colorOption.value)]}
                          onTouchEnd={() => setSelectedColor(colorOption.value)}
                        />
                        <Text variant="bodySmall" style={[styles.colorLabel, { color: theme.colors.onSurface }]}>
                          {colorOption.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss} textColor={theme.colors.onSurfaceVariant}>
            Cancel
          </Button>
          <Button onPress={handleConfirm} disabled={!title.trim()} textColor={theme.colors.primary}>
            Add Group
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// Define static color styles
const colorStyles = StyleSheet.create({
  purple: { backgroundColor: '#7C3AED' },
  green: { backgroundColor: '#4CAF50' },
  red: { backgroundColor: '#F44336' },
  orange: { backgroundColor: '#FF9800' },
  blue: { backgroundColor: '#2196F3' },
  deepPurple: { backgroundColor: '#9C27B0' },
  blueGrey: { backgroundColor: '#607D8B' },
  brown: { backgroundColor: '#795548' },
});

const getColorStyle = (colorValue: string) => {
  switch (colorValue) {
    case '#7C3AED':
      return colorStyles.purple;
    case '#4CAF50':
      return colorStyles.green;
    case '#F44336':
      return colorStyles.red;
    case '#FF9800':
      return colorStyles.orange;
    case '#2196F3':
      return colorStyles.blue;
    case '#9C27B0':
      return colorStyles.deepPurple;
    case '#607D8B':
      return colorStyles.blueGrey;
    case '#795548':
      return colorStyles.brown;
    default:
      return { backgroundColor: colorValue };
  }
};

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  dialogTitle: {
    // Color will be set dynamically
  },
  form: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  colorSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '500',
    marginBottom: 12,
    // Color will be set dynamically
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedColorOption: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  colorLabel: {
    fontSize: 12,
    textAlign: 'center',
    // Color will be set dynamically
  },
});

export default AddTaskGroupDialog;
