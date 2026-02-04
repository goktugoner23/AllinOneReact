import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dialog, Input, Button, Chip } from '@shared/components/ui';
import { TaskGroup, TASK_GROUP_COLORS } from '@features/tasks/types/Task';
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
    <>
      <Dialog visible={visible} onClose={handleDismiss} title="Add Task">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Input label="Task Name" value={name} onChangeText={setName} placeholder="Enter task name" />

            <Input
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              multiline
              numberOfLines={3}
            />

            <View style={styles.dateInputContainer}>
              <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[1.5] }]}>
                Due Date (Optional)
              </Text>
              <View style={styles.dateInputRow}>
                {dueDate && (
                  <TouchableOpacity onPress={clearDueDate} style={styles.clearDateButton}>
                    <Ionicons name="close-circle" size={20} color={colors.foregroundMuted} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.dateInput, { backgroundColor: colors.muted, borderColor: colors.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[textStyles.body, { color: dueDate ? colors.foreground : colors.foregroundSubtle }]}>
                    {dueDate ? formatDate(dueDate) : 'Select due date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.foregroundMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.groupSection}>
              <Text style={[textStyles.label, { color: colors.foreground }]}>Group (Optional)</Text>

              <TouchableOpacity
                style={[styles.dropdownButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => setShowGroupDropdown(!showGroupDropdown)}
              >
                <Text style={[textStyles.body, { color: colors.foreground }]}>
                  {getSelectedGroup() ? getSelectedGroup()?.title : 'Select Group'}
                </Text>
                <Text style={[textStyles.body, { color: colors.foregroundMuted }]}>
                  {showGroupDropdown ? '\u25B2' : '\u25BC'}
                </Text>
              </TouchableOpacity>

              {showGroupDropdown && (
                <View style={[styles.dropdownList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                    onPress={() => handleGroupSelect(undefined)}
                  >
                    <Text style={[textStyles.body, { color: colors.foreground }]}>No Group</Text>
                  </TouchableOpacity>

                  {taskGroups.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleGroupSelect(group.id)}
                    >
                      <Text style={[textStyles.body, { color: group.color }]}>{group.title}</Text>
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
                    <Text style={[textStyles.label, { color: colors.primary }]}>Create New Group</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              <Button variant="ghost" onPress={handleDismiss}>
                Cancel
              </Button>
              <Button variant="primary" onPress={handleConfirm} disabled={!name.trim()}>
                Add Task
              </Button>
            </View>
          </View>
        </ScrollView>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog visible={showCreateGroupDialog} onClose={() => setShowCreateGroupDialog(false)} title="Create New Group">
        <View style={styles.form}>
          <Input
            label="Group Title"
            value={newGroupTitle}
            onChangeText={setNewGroupTitle}
            placeholder="Enter group title"
          />
          <Input
            label="Description (Optional)"
            value={newGroupDescription}
            onChangeText={setNewGroupDescription}
            placeholder="Enter description"
            multiline
            numberOfLines={2}
          />
          <View style={styles.colorSection}>
            <Text style={[textStyles.label, { color: colors.foreground }]}>Color</Text>
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
                >
                  <Text style={[textStyles.bodySmall, { color: colorOption.value }]}>{colorOption.label}</Text>
                </Chip>
              ))}
            </View>
          </View>
          <View style={styles.actions}>
            <Button variant="ghost" onPress={() => setShowCreateGroupDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onPress={handleCreateGroup} disabled={!newGroupTitle.trim()}>
              Create Group
            </Button>
          </View>
        </View>
      </Dialog>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker value={dueDate || new Date()} mode="date" display="default" onChange={handleDateChange} />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker value={dueDate || new Date()} mode="time" display="default" onChange={handleTimeChange} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: spacing[4],
  },
  dateInputContainer: {
    marginBottom: spacing[2],
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearDateButton: {
    marginRight: spacing[2],
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[3],
    marginTop: spacing[4],
  },
});

export default AddTaskDialog;
