import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Modal,
  Portal,
  Surface,
  Text,
  Button,
  TextInput,
  IconButton,
  Chip,
} from 'react-native-paper';

interface TableInsertionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onInsertTable: (rows: number, columns: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');

const TableInsertionModal: React.FC<TableInsertionModalProps> = ({
  visible,
  onDismiss,
  onInsertTable,
}) => {
  const [rows, setRows] = useState('3');
  const [columns, setColumns] = useState('3');

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
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.modalSurface}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Insert Table</Text>
            <IconButton
              icon="close"
              size={20}
              onPress={onDismiss}
            />
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Quick Sizes</Text>
            <View style={styles.chipContainer}>
              {quickSizes.map((size, index) => (
                <Chip
                  key={index}
                  onPress={() => {
                    setRows(size.rows.toString());
                    setColumns(size.columns.toString());
                  }}
                  style={styles.chip}
                >
                  {size.label}
                </Chip>
              ))}
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Custom Size</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Rows</Text>
                  <TextInput
                    value={rows}
                    onChangeText={setRows}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Columns</Text>
                  <TextInput
                    value={columns}
                    onChangeText={setColumns}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.tablePreview}>
                {Array.from({ length: Math.min(parseInt(rows) || 3, 4) }).map((_, rowIndex) => (
                  <View key={rowIndex} style={styles.previewRow}>
                    {Array.from({ length: Math.min(parseInt(columns) || 3, 6) }).map((_, colIndex) => (
                      <View key={colIndex} style={styles.previewCell}>
                        <Text style={styles.previewText}>
                          {rowIndex === 0 ? 'H' : 'C'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button onPress={onDismiss} style={styles.actionButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleInsert}
              style={styles.actionButton}
            >
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
  inputSection: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  input: {
    height: 40,
  },
  previewSection: {
    marginBottom: 20,
  },
  tablePreview: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
  },
  previewRow: {
    flexDirection: 'row',
  },
  previewCell: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#ddd',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  previewText: {
    fontSize: 12,
    color: '#666',
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

export default TableInsertionModal; 