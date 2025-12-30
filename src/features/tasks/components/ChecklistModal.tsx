import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Text as RNText } from 'react-native';
import { Modal, Portal, Surface, Text, Button, TextInput, IconButton, Chip } from 'react-native-paper';
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
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Surface style={[styles.modalSurface, shadow.lg, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <RNText style={[textStyles.h4, { color: colors.foreground }]}>Create Checklist</RNText>
            <IconButton icon="close" size={20} onPress={onDismiss} iconColor={colors.foregroundMuted} />
          </View>

          <ScrollView style={styles.modalContent}>
            <RNText style={[textStyles.label, styles.sectionTitle, { color: colors.foreground }]}>
              Quick Templates
            </RNText>
            <View style={styles.chipContainer}>
              {quickTemplates.map((template, index) => (
                <Chip
                  key={index}
                  onPress={() => setItems([...template.items, ''])}
                  style={[styles.chip, { backgroundColor: colors.muted }]}
                  textStyle={{ color: colors.foreground }}
                >
                  {template.name}
                </Chip>
              ))}
            </View>

            <View style={styles.itemsSection}>
              <View style={styles.sectionHeader}>
                <RNText style={[textStyles.label, { color: colors.foreground }]}>Checklist Items</RNText>
                <IconButton icon="plus" size={20} onPress={addItem} iconColor={colors.primary} />
              </View>

              {items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <TextInput
                    value={item}
                    onChangeText={(text) => updateItem(index, text)}
                    placeholder={`Item ${index + 1}`}
                    mode="outlined"
                    style={styles.itemInput}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                    textColor={colors.foreground}
                    right={
                      items.length > 1 ? <TextInput.Icon icon="delete" onPress={() => removeItem(index)} /> : undefined
                    }
                  />
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.modalActions, { borderTopColor: colors.border }]}>
            <Button onPress={onDismiss} style={styles.actionButton} textColor={colors.foregroundMuted}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleInsert}
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              labelStyle={{ color: colors.primaryForeground }}
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
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  modalSurface: {
    borderRadius: radius.xl,
    width: screenWidth * 0.9,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
  },
  modalContent: {
    padding: spacing[4],
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
    height: 44,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing[4],
    borderTopWidth: 1,
    gap: spacing[3],
  },
  actionButton: {
    minWidth: 80,
    borderRadius: radius.md,
  },
});

export default ChecklistModal;
