import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text as RNText, Pressable } from 'react-native';
import { Dialog, Portal, TextInput, Button, Text } from 'react-native-paper';
import { TASK_GROUP_COLORS } from '@features/tasks/types/Task';
import { useColors, spacing, textStyles, radius } from '@shared/theme';

interface AddTaskGroupDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (groupData: { title: string; description?: string; color: string }) => void;
}

const AddTaskGroupDialog: React.FC<AddTaskGroupDialogProps> = ({ visible, onDismiss, onConfirm }) => {
  const colors = useColors();
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
      <Dialog visible={visible} onDismiss={handleDismiss} style={[styles.dialog, { backgroundColor: colors.surface }]}>
        <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Add Task Group</Dialog.Title>
        <Dialog.Content>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <TextInput
                label="Group Title"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                textColor={colors.foreground}
              />
              <TextInput
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                textColor={colors.foreground}
              />
              <View style={styles.colorSection}>
                <RNText style={[textStyles.label, { color: colors.foreground }]}>Color</RNText>
                <View style={styles.colorGrid}>
                  {TASK_GROUP_COLORS.map((colorOption) => {
                    const isSelected = selectedColor === colorOption.value;

                    return (
                      <Pressable
                        key={colorOption.value}
                        style={[
                          styles.colorOption,
                          { borderColor: isSelected ? colors.primary : 'transparent' },
                          isSelected && styles.selectedColorOption,
                        ]}
                        onPress={() => setSelectedColor(colorOption.value)}
                      >
                        <View style={[styles.colorCircle, getColorStyle(colorOption.value)]} />
                        <RNText style={[textStyles.caption, { color: colors.foreground }]}>{colorOption.label}</RNText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss} textColor={colors.foregroundMuted}>
            Cancel
          </Button>
          <Button onPress={handleConfirm} disabled={!title.trim()} textColor={colors.primary}>
            Add Group
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

// Define static color styles
const colorStyles = StyleSheet.create({
  darkBlue: { backgroundColor: '#1E40AF' },
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
    case '#1E40AF':
      return colorStyles.darkBlue;
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
    borderRadius: radius.xl,
  },
  form: {
    gap: spacing[4],
  },
  input: {
    marginBottom: spacing[2],
  },
  colorSection: {
    marginTop: spacing[2],
    gap: spacing[3],
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  colorOption: {
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: radius.md,
    minWidth: 60,
    borderWidth: 2,
  },
  selectedColorOption: {
    borderWidth: 2,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    marginBottom: spacing[1],
  },
});

export default AddTaskGroupDialog;
