import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Modal, Portal, Surface, Text, Button, TextInput, IconButton, Chip } from 'react-native-paper';
import { useAppTheme } from '@shared/theme';

interface TableInsertionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onInsertTable: (rows: number, columns: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const TableInsertionModal: React.FC<TableInsertionModalProps> = ({ visible, onDismiss, onInsertTable }) => {
  const [rows, setRows] = useState('3');
  const [columns, setColumns] = useState('3');
  const { colors, spacing, radius, textStyles } = useAppTheme();

  const handleInsert = () => {
    const rowCount = parseInt(rows) || 3;
    const columnCount = parseInt(columns) || 3;
    onInsertTable(rowCount, columnCount);
    onDismiss();
  };

  const quickSizes = [
    { rows: 2, columns: 2, label: '2x2' },
    { rows: 3, columns: 3, label: '3x3' },
    { rows: 4, columns: 4, label: '4x4' },
    { rows: 3, columns: 5, label: '3x5' },
    { rows: 5, columns: 3, label: '5x3' },
  ];

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Surface style={[styles.modalSurface, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, padding: spacing[4] }]}>
            <Text style={[textStyles.h4, { color: colors.foreground }]}>Insert Table</Text>
            <IconButton icon="close" size={20} onPress={onDismiss} />
          </View>

          <View style={[styles.modalContent, { padding: spacing[4] }]}>
            <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[3] }]}>Quick Sizes</Text>
            <View style={[styles.chipContainer, { gap: spacing[2], marginBottom: spacing[5] }]}>
              {quickSizes.map((size, index) => (
                <Chip
                  key={index}
                  onPress={() => {
                    setRows(size.rows.toString());
                    setColumns(size.columns.toString());
                  }}
                >
                  {size.label}
                </Chip>
              ))}
            </View>

            <View style={[styles.inputSection, { marginBottom: spacing[5] }]}>
              <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[3] }]}>
                Custom Size
              </Text>
              <View style={[styles.inputRow, { gap: spacing[4] }]}>
                <View style={styles.inputContainer}>
                  <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
                    Rows
                  </Text>
                  <TextInput
                    value={rows}
                    onChangeText={setRows}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
                    Columns
                  </Text>
                  <TextInput
                    value={columns}
                    onChangeText={setColumns}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                    outlineColor={colors.border}
                    activeOutlineColor={colors.primary}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.previewSection, { marginBottom: spacing[5] }]}>
              <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[3] }]}>Preview</Text>
              <View style={[styles.tablePreview, { borderColor: colors.border, borderRadius: radius.sm }]}>
                {Array.from({ length: Math.min(parseInt(rows) || 3, 4) }).map((_, rowIndex) => (
                  <View key={rowIndex} style={styles.previewRow}>
                    {Array.from({ length: Math.min(parseInt(columns) || 3, 6) }).map((_, colIndex) => (
                      <View
                        key={colIndex}
                        style={[styles.previewCell, { borderColor: colors.border, backgroundColor: colors.muted }]}
                      >
                        <Text style={[textStyles.caption, { color: colors.foregroundMuted }]}>
                          {rowIndex === 0 ? 'H' : 'C'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={[styles.modalActions, { borderTopColor: colors.border, padding: spacing[4], gap: spacing[3] }]}>
            <Button onPress={onDismiss} style={styles.actionButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleInsert} style={styles.actionButton}>
              Insert Table
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
    width: screenWidth * 0.9,
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  modalContent: {},
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  inputSection: {},
  inputRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    height: 40,
  },
  previewSection: {},
  tablePreview: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewCell: {
    flex: 1,
    borderWidth: 0.5,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
  },
  actionButton: {
    minWidth: 80,
  },
});

export default TableInsertionModal;
