import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Text, Pressable } from 'react-native';
import { Dialog, Input, Button, Chip, IconButton } from '@shared/components/ui';
import { useColors, spacing, textStyles, radius, shadow } from '@shared/theme';

interface ChecklistModalProps {
  visible: boolean;
  onDismiss: () => void;
  onInsertChecklist: (items: string[]) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const ChecklistModal: React.FC<ChecklistModalProps> = ({ visible, onDismiss, onInsertChecklist }) => {
  const colors = useColors();
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
    <Dialog visible={visible} onClose={onDismiss} title="Create Checklist">
      <ScrollView style={styles.modalContent}>
        <Text style={[textStyles.label, styles.sectionTitle, { color: colors.foreground }]}>Quick Templates</Text>
        <View style={styles.chipContainer}>
          {quickTemplates.map((template, index) => (
            <Chip
              key={index}
              onPress={() => setItems([...template.items, ''])}
              style={[styles.chip, { backgroundColor: colors.muted }]}
            >
              {template.name}
            </Chip>
          ))}
        </View>

        <View style={styles.itemsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[textStyles.label, { color: colors.foreground }]}>Checklist Items</Text>
            <IconButton icon="add-outline" size="sm" variant="ghost" onPress={addItem} color={colors.primary} />
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Input
                value={item}
                onChangeText={(text) => updateItem(index, text)}
                placeholder={`Item ${index + 1}`}
                containerStyle={styles.itemInput}
                rightIcon={
                  items.length > 1 ? (
                    <Pressable onPress={() => removeItem(index)}>
                      <IconButton icon="trash-outline" size="sm" variant="ghost" color={colors.destructive} />
                    </Pressable>
                  ) : undefined
                }
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
        <Button variant="ghost" onPress={onDismiss} style={styles.actionButton}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onPress={handleInsert}
          style={styles.actionButton}
          disabled={items.filter((item) => item.trim() !== '').length === 0}
        >
          Insert Checklist
        </Button>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    paddingVertical: spacing[2],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  chip: {
    marginBottom: spacing[1],
  },
  itemsSection: {
    marginBottom: spacing[5],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  itemRow: {
    marginBottom: spacing[2],
  },
  itemInput: {
    marginBottom: 0,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    gap: spacing[3],
  },
  actionButton: {
    minWidth: 80,
    borderRadius: radius.md,
  },
});

export default ChecklistModal;
