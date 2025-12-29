import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Modal, Portal, Surface, Text, Button, TextInput, IconButton, Chip, List } from 'react-native-paper';

interface ChecklistModalProps {
  visible: boolean;
  onDismiss: () => void;
  onInsertChecklist: (items: string[]) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const ChecklistModal: React.FC<ChecklistModalProps> = ({ visible, onDismiss, onInsertChecklist }) => {
  const [items, setItems] = useState<string[]>(['', '', '']);

  const addItem = () => {
    setItems([...items, '']);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const updateItem = (index: number, text: string) => {
    const newItems = [...items];
    newItems[index] = text;
    setItems(newItems);
  };

  const handleInsert = () => {
    const validItems = items.filter((item) => item.trim() !== '');
    if (validItems.length > 0) {
      onInsertChecklist(validItems);
      onDismiss();
    }
  };

  const quickTemplates = [
    {
      name: 'Shopping List',
      items: ['Milk', 'Bread', 'Eggs', 'Butter'],
    },
    {
      name: 'Todo',
      items: ['Task 1', 'Task 2', 'Task 3'],
    },
    {
      name: 'Meeting Agenda',
      items: ['Introduction', 'Discussion', 'Action Items', 'Next Steps'],
    },
    {
      name: 'Daily Goals',
      items: ['Exercise', 'Read', 'Work', 'Family Time'],
    },
  ];

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Surface style={styles.modalSurface}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Checklist</Text>
            <IconButton icon="close" size={20} onPress={onDismiss} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Quick Templates</Text>
            <View style={styles.chipContainer}>
              {quickTemplates.map((template, index) => (
                <Chip key={index} onPress={() => setItems([...template.items, ''])} style={styles.chip}>
                  {template.name}
                </Chip>
              ))}
            </View>

            <View style={styles.itemsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Checklist Items</Text>
                <IconButton icon="plus" size={20} onPress={addItem} />
              </View>

              {items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <TextInput
                    value={item}
                    onChangeText={(text) => updateItem(index, text)}
                    placeholder={`Item ${index + 1}`}
                    mode="outlined"
                    style={styles.itemInput}
                    right={
                      items.length > 1 ? <TextInput.Icon icon="delete" onPress={() => removeItem(index)} /> : undefined
                    }
                  />
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button onPress={onDismiss} style={styles.actionButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleInsert}
              style={styles.actionButton}
              disabled={items.filter((item) => item.trim() !== '').length === 0}
            >
              Insert Checklist
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSurface: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: screenWidth * 0.9,
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    marginBottom: 4,
  },
  itemsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemRow: {
    marginBottom: 8,
  },
  itemInput: {
    height: 40,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  actionButton: {
    minWidth: 80,
  },
});

export default ChecklistModal;
