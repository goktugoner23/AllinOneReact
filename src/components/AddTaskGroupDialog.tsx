import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Dialog, 
  Portal, 
  TextInput, 
  Button, 
  Text, 
  Chip
} from 'react-native-paper';
import { TASK_GROUP_COLORS } from '../types/Task';

interface AddTaskGroupDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (groupData: { title: string; description?: string; color: string }) => void;
}

const AddTaskGroupDialog: React.FC<AddTaskGroupDialogProps> = ({
  visible,
  onDismiss,
  onConfirm,
}) => {
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
        style={[styles.dialog, { backgroundColor: 'white' }]}
      >
        <Dialog.Title style={{ color: '#000000' }}>Add Task Group</Dialog.Title>
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
                <Text
                  variant="bodyMedium"
                  style={[styles.sectionTitle, { color: '#000000' }]}
                >
                  Color
                </Text>
                <View style={styles.colorGrid}>
                  {TASK_GROUP_COLORS.map((colorOption) => (
                    <View
                      key={colorOption.value}
                      style={[
                        styles.colorOption,
                        {
                          backgroundColor: colorOption.value,
                          borderColor: selectedColor === colorOption.value 
                            ? '#007AFF' 
                            : 'transparent',
                          borderWidth: selectedColor === colorOption.value ? 3 : 1,
                        }
                      ]}
                    >
                      <View
                        style={[
                          styles.colorCircle,
                          { backgroundColor: colorOption.value }
                        ]}
                        onTouchEnd={() => setSelectedColor(colorOption.value)}
                      />
                      <Text
                        variant="bodySmall"
                        style={[styles.colorLabel, { color: '#000000' }]}
                      >
                        {colorOption.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleDismiss} textColor="#666666">Cancel</Button>
          <Button onPress={handleConfirm} disabled={!title.trim()} textColor="#007AFF">
            Add Group
          </Button>
        </Dialog.Actions>
      </Dialog>
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
  colorSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '500',
    marginBottom: 12,
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
  },
});

export default AddTaskGroupDialog;
