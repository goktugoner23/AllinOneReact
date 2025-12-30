import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text as RNText } from 'react-native';
import { Dialog, Portal, TextInput, Button, Text, Chip } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task, TaskGroup, TASK_GROUP_COLORS } from '@features/tasks/types/Task';
import { useColors, spacing, textStyles, radius } from '@shared/theme';

interface AddTaskDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => void;
  taskGroups: TaskGroup[];
  onCreateGroup?: (groupData: { title: string; description?: string; color: string }) => void;
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({ visible, onDismiss, onConfirm, taskGroups, onCreateGroup }) => {
  const colors = useColors();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedGroupColor, setSelectedGroupColor] = useState<string>(TASK_GROUP_COLORS[0].value);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleConfirm = () => {
    if (!name.trim()) return;

    onConfirm({
      name: name.trim(),
      description: description.trim() || undefined,
      dueDate,
      groupId: selectedGroupId,
    });

    // Reset form
    setName('');
    setDescription('');
    setDueDate(undefined);
    setSelectedGroupId(undefined);
  };

  const handleDismiss = () => {
    // Reset form
    setName('');
    setDescription('');
    setDueDate(undefined);
    setSelectedGroupId(undefined);
    onDismiss();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime && dueDate) {
      const newDateTime = new Date(dueDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setDueDate(newDateTime);
    }
  };

  const clearDueDate = () => {
    setDueDate(undefined);
  };

  const getSelectedGroup = () => {
    if (!selectedGroupId) return null;
    return taskGroups.find((group) => group.id === selectedGroupId);
  };

  const handleCreateGroup = () => {
    if (!newGroupTitle.trim()) return;

    onCreateGroup?.({
      title: newGroupTitle.trim(),
      description: newGroupDescription.trim() || undefined,
      color: selectedGroupColor,
    });

    // Reset form
    setNewGroupTitle('');
    setNewGroupDescription('');
    setSelectedGroupColor(TASK_GROUP_COLORS[0].value);
    setShowCreateGroupDialog(false);
  };

  const handleGroupSelect = (groupId: string | undefined) => {
    setSelectedGroupId(groupId);
    setShowGroupDropdown(false);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss} style={[styles.dialog, { backgroundColor: colors.surface }]}>
        <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Add Task</Dialog.Title>
        <Dialog.Content>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <TextInput
                label="Task Name"
                value={name}
                onChangeText={setName}
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
                numberOfLines={3}
                style={styles.input}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                textColor={colors.foreground}
              />

              <TextInput
                label="Due Date (Optional)"
                value={dueDate ? formatDate(dueDate) : ''}
                mode="outlined"
                style={styles.input}
                right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                left={dueDate ? <TextInput.Icon icon="close" onPress={clearDueDate} /> : undefined}
                editable={false}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                textColor={colors.foreground}
              />

              <View style={styles.groupSection}>
                <RNText style={[textStyles.label, { color: colors.foreground }]}>Group (Optional)</RNText>

                <TouchableOpacity
                  style={[styles.dropdownButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={() => setShowGroupDropdown(!showGroupDropdown)}
                >
                  <RNText style={[textStyles.body, { color: colors.foreground }]}>
                    {getSelectedGroup() ? getSelectedGroup()?.title : 'Select Group'}
                  </RNText>
                  <RNText style={[textStyles.body, { color: colors.foregroundMuted }]}>
                    {showGroupDropdown ? '▲' : '▼'}
                  </RNText>
                </TouchableOpacity>

                {showGroupDropdown && (
                  <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleGroupSelect(undefined)}
                    >
                      <RNText style={[textStyles.body, { color: colors.foreground }]}>No Group</RNText>
                    </TouchableOpacity>

                    {taskGroups.map((group) => (
                      <TouchableOpacity
                        key={group.id}
                        style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                        onPress={() => handleGroupSelect(group.id)}
                      >
                        <RNText style={[textStyles.body, { color: group.color }]}>{group.title}</RNText>
                      </TouchableOpacity>
                    ))}

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setShowGroupDropdown(false);
                        setShowCreateGroupDialog(true);
                      }}
                    >
                      <RNText style={[textStyles.label, { color: colors.primary }]}>Create New Group</RNText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss} textColor={colors.foregroundMuted}>
            Cancel
          </Button>
          <Button onPress={handleConfirm} disabled={!name.trim()} textColor={colors.primary}>
            Add Task
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog
        visible={showCreateGroupDialog}
        onDismiss={() => setShowCreateGroupDialog(false)}
        style={[styles.dialog, { backgroundColor: colors.surface }]}
      >
        <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Create New Group</Dialog.Title>
        <Dialog.Content>
          <View style={styles.form}>
            <TextInput
              label="Group Title"
              value={newGroupTitle}
              onChangeText={setNewGroupTitle}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.foreground}
            />
            <TextInput
              label="Description (Optional)"
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
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
              <View style={styles.colorContainer}>
                {TASK_GROUP_COLORS.map((colorOption) => (
                  <Chip
                    key={colorOption.value}
                    selected={selectedGroupColor === colorOption.value}
                    onPress={() => setSelectedGroupColor(colorOption.value)}
                    style={[
                      styles.colorChip,
                      {
                        backgroundColor: selectedGroupColor === colorOption.value ? colors.primaryMuted : colors.muted,
                      },
                    ]}
                    textStyle={[textStyles.bodySmall, { color: colorOption.value }]}
                  >
                    {colorOption.label}
                  </Chip>
                ))}
              </View>
            </View>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowCreateGroupDialog(false)} textColor={colors.foregroundMuted}>
            Cancel
          </Button>
          <Button onPress={handleCreateGroup} disabled={!newGroupTitle.trim()} textColor={colors.primary}>
            Create Group
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker value={dueDate || new Date()} mode="date" display="default" onChange={handleDateChange} />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker value={dueDate || new Date()} mode="time" display="default" onChange={handleTimeChange} />
      )}
    </Portal>
  );
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
  groupSection: {
    marginTop: spacing[2],
    gap: spacing[2],
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing[2],
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: radius.md,
    marginTop: spacing[1],
    maxHeight: 200,
  },
  dropdownItem: {
    padding: spacing[3],
    borderBottomWidth: 1,
  },
  divider: {
    height: 1,
  },
  colorSection: {
    marginTop: spacing[2],
    gap: spacing[3],
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  colorChip: {
    marginBottom: spacing[1],
  },
});

export default AddTaskDialog;
