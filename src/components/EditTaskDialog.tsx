import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Dialog, 
  Portal, 
  TextInput, 
  Button, 
  Text, 
  Chip, 
  IconButton,
  Menu,
  Divider
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task, TaskGroup, TASK_GROUP_COLORS } from '../types/Task';

interface EditTaskDialogProps {
  visible: boolean;
  task: Task | null;
  taskGroups: TaskGroup[];
  onDismiss: () => void;
  onConfirm: (taskData: { name: string; description?: string; dueDate?: Date; groupId?: string }) => void;
  onDelete: () => void;
  onCreateGroup?: (groupData: { title: string; description?: string; color: string }) => void;
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  visible,
  task,
  taskGroups,
  onDismiss,
  onConfirm,
  onDelete,
  onCreateGroup,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedGroupColor, setSelectedGroupColor] = useState<string>('#7C3AED');

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setName(task.name);
      setDescription(task.description || '');
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setSelectedGroupId(task.groupId);
    }
  }, [task]);

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
  };

  const handleDismiss = () => {
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
    setSelectedGroupColor('#7C3AED');
    setShowCreateGroupDialog(false);
  };

  const handleGroupSelect = (groupId: string | undefined) => {
    setSelectedGroupId(groupId);
    setShowGroupMenu(false);
  };

  const handleMenuPress = () => {
    setShowGroupMenu(true);
  };

  if (!task) return null;

  return (
    <Portal>
      <Dialog 
        visible={visible} 
        onDismiss={handleDismiss} 
        style={[styles.dialog, { backgroundColor: 'white' }]}
      >
        <Dialog.Title style={{ color: '#000000' }}>Edit Task</Dialog.Title>
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
                  style={[styles.sectionTitle, { color: '#000000' }]}
                >
                  Group (Optional)
                </Text>
                <Menu
                  visible={showGroupMenu}
                  onDismiss={() => setShowGroupMenu(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={handleMenuPress}
                      style={styles.groupButton}
                      textColor="#000000"
                      buttonColor="#f5f5f5"
                    >
                      {getSelectedGroup() ? getSelectedGroup()?.title : 'Select Group'}
                    </Button>
                  }
                >
                  <Menu.Item
                    onPress={() => handleGroupSelect(undefined)}
                    title="No Group"
                    leadingIcon="close"
                  />
                  {taskGroups.map((group) => (
                    <Menu.Item
                      key={group.id}
                      onPress={() => handleGroupSelect(group.id)}
                      title={group.title}
                      leadingIcon="folder"
                      titleStyle={{ color: group.color }}
                    />
                  ))}
                  <Divider />
                  <Menu.Item
                    onPress={() => {
                      setShowGroupMenu(false);
                      setShowCreateGroupDialog(true);
                    }}
                    title="Create New Group"
                    leadingIcon="plus"
                  />
                </Menu>
              </View>
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button 
            onPress={onDelete}
            textColor="#FF3B30"
          >
            Delete
          </Button>
          <Button onPress={handleDismiss} textColor="#666666">Cancel</Button>
          <Button onPress={handleConfirm} disabled={!name.trim()} textColor="#007AFF">
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Create Group Dialog */}
      <Dialog 
        visible={showCreateGroupDialog} 
        onDismiss={() => setShowCreateGroupDialog(false)}
        style={[styles.dialog, { backgroundColor: 'white' }]}
      >
        <Dialog.Title style={{ color: '#000000' }}>Create New Group</Dialog.Title>
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
                style={[styles.sectionTitle, { color: '#000000' }]}
              >
                Color
              </Text>
              <View style={styles.colorContainer}>
                {TASK_GROUP_COLORS.map((colorOption) => (
                  <Chip
                    key={colorOption.value}
                    selected={selectedGroupColor === colorOption.value}
                    onPress={() => setSelectedGroupColor(colorOption.value)}
                    style={[
                      styles.colorChip,
                      { backgroundColor: selectedGroupColor === colorOption.value ? colorOption.value + '20' : undefined }
                    ]}
                    textStyle={{ color: colorOption.value }}
                  >
                    {colorOption.label}
                  </Chip>
                ))}
              </View>
            </View>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setShowCreateGroupDialog(false)} textColor="#666666">
            Cancel
          </Button>
          <Button onPress={handleCreateGroup} disabled={!newGroupTitle.trim()} textColor="#007AFF">
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
  },
  groupButton: {
    marginTop: 8,
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
});

export default EditTaskDialog;
