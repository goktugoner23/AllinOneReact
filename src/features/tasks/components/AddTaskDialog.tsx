import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { 
  Dialog, 
  Portal, 
  TextInput, 
  Button, 
  Text, 
  Chip,
  useTheme
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task, TaskGroup, TASK_GROUP_COLORS } from '@features/tasks/types/Task';

interface AddTaskDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => void;
  taskGroups: TaskGroup[];
  onCreateGroup?: (groupData: { title: string; description?: string; color: string }) => void;
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
  visible,
  onDismiss,
  onConfirm,
  taskGroups,
  onCreateGroup,
}) => {
  const theme = useTheme();
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
    return taskGroups.find(group => group.id === selectedGroupId);
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
      <Dialog 
        visible={visible} 
        onDismiss={handleDismiss} 
        style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      >
        <Dialog.Title style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>Add Task</Dialog.Title>
        <Dialog.Content>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <TextInput
                label="Task Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
              />

              <TextInput
                label="Description (Optional)"
                value={description}
                onChangeText={setDescription}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />

              <TextInput
                label="Due Date (Optional)"
                value={dueDate ? formatDate(dueDate) : ''}
                mode="outlined"
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon="calendar"
                    onPress={() => setShowDatePicker(true)}
                  />
                }
                left={
                  dueDate ? (
                    <TextInput.Icon
                      icon="close"
                      onPress={clearDueDate}
                    />
                  ) : undefined
                }
                editable={false}
              />

              <View style={styles.groupSection}>
                <Text
                  variant="bodyMedium"
                  style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
                >
                  Group (Optional)
                </Text>
                
                <TouchableOpacity
                  style={[styles.dropdownButton, { backgroundColor: theme.colors.surfaceVariant }]}
                  onPress={() => setShowGroupDropdown(!showGroupDropdown)}
                >
                  <Text style={[styles.dropdownButtonText, { color: theme.colors.onSurface }]}>
                    {getSelectedGroup() ? getSelectedGroup()?.title : 'Select Group'}
                  </Text>
                  <Text style={[styles.dropdownButtonText, { color: theme.colors.onSurface }]}>
                    {showGroupDropdown ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showGroupDropdown && (
                  <View style={[styles.dropdownList, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => handleGroupSelect(undefined)}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.colors.onSurface }]}>No Group</Text>
                    </TouchableOpacity>
                    
                    {taskGroups.map((group) => (
                      <TouchableOpacity
                        key={group.id}
                        style={styles.dropdownItem}
                        onPress={() => handleGroupSelect(group.id)}
                      >
                        <Text style={[styles.dropdownItemText, { color: group.color }]}>{group.title}</Text>
                      </TouchableOpacity>
                    ))}
                    
                    <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                    
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setShowGroupDropdown(false);
                        setShowCreateGroupDialog(true);
                      }}
                    >
                      <Text style={[styles.createGroupText, { color: theme.colors.primary }]}>Create New Group</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss} textColor={theme.colors.onSurfaceVariant}>Cancel</Button>
          <Button onPress={handleConfirm} disabled={!name.trim()} textColor={theme.colors.primary}>
            Add Task
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog 
        visible={showCreateGroupDialog} 
        onDismiss={() => setShowCreateGroupDialog(false)}
        style={[styles.dialog, { backgroundColor: theme.colors.surface }]}
      >
        <Dialog.Title style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>Create New Group</Dialog.Title>
        <Dialog.Content>
          <View style={styles.form}>
            <TextInput
              label="Group Title"
              value={newGroupTitle}
              onChangeText={setNewGroupTitle}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Description (Optional)"
              value={newGroupDescription}
              onChangeText={setNewGroupDescription}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
            />
            <View style={styles.colorSection}>
              <Text
                variant="bodyMedium"
                style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
              >
                Color
              </Text>
              <View style={styles.colorContainer}>
                {TASK_GROUP_COLORS.map((colorOption) => (
                  <Chip
                    key={colorOption.value}
                    selected={selectedGroupColor === colorOption.value}
                    onPress={() => setSelectedGroupColor(colorOption.value)}
                    style={styles.colorChip}
                    textStyle={[styles.colorChipText, { color: colorOption.value }]}
                  >
                    {colorOption.label}
                  </Chip>
                ))}
              </View>
            </View>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowCreateGroupDialog(false)} textColor={theme.colors.onSurfaceVariant}>
            Cancel
          </Button>
          <Button onPress={handleCreateGroup} disabled={!newGroupTitle.trim()} textColor={theme.colors.primary}>
            Create Group
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </Portal>
  );
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
  groupSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '500',
    marginBottom: 8,
    // Color will be set dynamically
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 8,
    // backgroundColor will be set dynamically
  },
  dropdownButtonText: {
    // Color will be set dynamically
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 4,
    maxHeight: 200,
    // backgroundColor and borderColor will be set dynamically
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    // Color will be set dynamically
  },
  createGroupText: {
    // Color will be set dynamically
  },
  divider: {
    height: 1,
    // backgroundColor will be set dynamically
  },
  colorSection: {
    marginTop: 8,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorChip: {
    marginBottom: 4,
  },
  colorChipText: {
    // This will be overridden by inline style for dynamic colors
  },
});

export default AddTaskDialog;
