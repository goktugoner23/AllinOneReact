import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, Pressable } from 'react-native';
import { Dialog, Input, Button } from '@shared/components/ui';
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
    <Dialog visible={visible} onClose={handleDismiss} title="Add Task Group">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Input label="Group Title" value={title} onChangeText={setTitle} placeholder="Enter group title" />
          <Input
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            multiline
            numberOfLines={2}
          />
          <View style={styles.colorSection}>
            <Text style={[textStyles.label, { color: colors.foreground }]}>Color</Text>
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
                    <Text style={[textStyles.caption, { color: colors.foreground }]}>{colorOption.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.actions}>
            <Button variant="ghost" onPress={handleDismiss}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleConfirm} disabled={!title.trim()}>
              Add Group
            </Button>
          </View>
        </View>
      </ScrollView>
    </Dialog>
  );
};

// Derive static background styles from the canonical TASK_GROUP_COLORS list
// in Task.ts so the palette lives in one place. Using StyleSheet.create keeps
// these as stable references (cheaper than inline objects on every render).
const colorStyles = StyleSheet.create(
  Object.fromEntries(
    TASK_GROUP_COLORS.map((c) => [c.value, { backgroundColor: c.value }]),
  ) as Record<string, { backgroundColor: string }>,
);

const getColorStyle = (colorValue: string) => {
  return colorStyles[colorValue] ?? { backgroundColor: colorValue };
};

const styles = StyleSheet.create({
  form: {
    gap: spacing[4],
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[3],
    marginTop: spacing[4],
  },
});

export default AddTaskGroupDialog;
