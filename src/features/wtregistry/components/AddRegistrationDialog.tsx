import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dialog, Input, Button, Switch } from '@shared/components/ui';
import { useAppTheme, spacing, radius, textStyles } from '@shared/theme';
import { WTStudent, WTRegistration } from '@features/wtregistry/types/WTRegistry';
import { pickDocument, isValidReceiptFile } from '@shared/utils/documentPicker';

interface AddRegistrationDialogProps {
  visible: boolean;
  students: WTStudent[];
  onDismiss: () => void;
  onSave: (registration: Omit<WTRegistration, 'id'>) => void;
}

export const AddRegistrationDialog: React.FC<AddRegistrationDialogProps> = ({
  visible,
  students,
  onDismiss,
  onSave,
}) => {
  const { colors } = useAppTheme();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const handlePickAttachment = async () => {
    try {
      const result = await pickDocument();

      if (result && result.uri) {
        const fileName = result.name || result.uri.split('/').pop() || '';

        if (isValidReceiptFile(fileName)) {
          setAttachmentUri(result.uri);
        } else {
          Alert.alert('Invalid File Type', 'Please select only PDF or image files (JPG, PNG, BMP, WEBP).');
        }
      }
    } catch (error) {
      console.error('DocumentPicker Error: ', error);
      Alert.alert('Error', 'Failed to pick attachment');
    }
  };

  const handleSave = () => {
    if (!studentId || !amount.trim()) {
      Alert.alert('Error', 'Student and amount are required');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    onSave({
      studentId,
      amount: amountValue,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      notes: notes.trim() || undefined,
      attachmentUri: attachmentUri || undefined,
      isPaid,
      paymentDate: new Date(),
    });

    // Reset form
    setStudentId(null);
    setAmount('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setAttachmentUri(null);
    setIsPaid(false);
  };

  return (
    <>
      <Dialog visible={visible} onClose={onDismiss} title="Add Registration">
        <ScrollView style={{ maxHeight: 400 }}>
          {/* Student Selection */}
          <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>Student *</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing[3],
              marginBottom: spacing[4],
              backgroundColor: colors.surface,
            }}
            onPress={() => setShowStudentPicker(true)}
          >
            <Text style={[textStyles.body, { color: studentId ? colors.foreground : colors.foregroundSubtle }]}>
              {studentId ? students.find((s) => s.id === studentId)?.name || 'Unknown Student' : 'Select Student'}
            </Text>
          </TouchableOpacity>

          {/* Amount Field */}
          <Input
            label="Amount"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          {/* Start Date */}
          <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>Start Date</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing[3],
              marginBottom: spacing[4],
              backgroundColor: colors.surface,
            }}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={[textStyles.body, { color: startDate ? colors.foreground : colors.foregroundSubtle }]}>
              {startDate || 'Select Start Date'}
            </Text>
          </TouchableOpacity>

          {/* End Date */}
          <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>End Date</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.lg,
              padding: spacing[3],
              marginBottom: spacing[4],
              backgroundColor: colors.surface,
            }}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={[textStyles.body, { color: endDate ? colors.foreground : colors.foregroundSubtle }]}>
              {endDate || 'Select End Date'}
            </Text>
          </TouchableOpacity>

          {/* Notes */}
          <Input
            label="Notes"
            placeholder="Enter notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />

          {/* Payment Status */}
          <Switch value={isPaid} onChange={setIsPaid} label="Paid" />

          {/* File Attachment - only show if paid */}
          {isPaid && (
            <View style={styles.attachmentSection}>
              <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[2] }]}>Receipt</Text>
              <TouchableOpacity
                onPress={handlePickAttachment}
                style={[styles.attachmentButton, { borderColor: colors.primary }]}
              >
                <Ionicons name="document" size={24} color={colors.primary} />
                <Text style={[textStyles.body, { color: colors.primary, marginLeft: spacing[2] }]}>
                  {attachmentUri ? 'Change Receipt' : 'Add Receipt'}
                </Text>
              </TouchableOpacity>
              {attachmentUri && (
                <TouchableOpacity onPress={() => setAttachmentUri(null)} style={{ marginLeft: spacing[2] }}>
                  <Ionicons name="close-circle" size={24} color={colors.destructive} />
                </TouchableOpacity>
              )}
              {attachmentUri && (
                <Text
                  style={[
                    textStyles.caption,
                    { color: colors.foregroundMuted, marginTop: spacing[1], fontStyle: 'italic' },
                  ]}
                >
                  {attachmentUri.split('/').pop()}
                </Text>
              )}
            </View>
          )}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[4], justifyContent: 'flex-end' }}>
          <Button variant="ghost" onPress={onDismiss}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave}>
            Save
          </Button>
        </View>
      </Dialog>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}

      {/* Student Picker */}
      <Dialog visible={showStudentPicker} onClose={() => setShowStudentPicker(false)} title="Select Student">
        <ScrollView style={{ maxHeight: 300 }}>
          {students.map((student) => {
            const isSelected = studentId === student.id;
            return (
              <TouchableOpacity
                key={student.id}
                style={{
                  padding: spacing[4],
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: isSelected ? colors.primaryMuted : 'transparent',
                  borderRadius: isSelected ? radius.md : 0,
                }}
                onPress={() => {
                  setStudentId(student.id);
                  setShowStudentPicker(false);
                }}
              >
                <Text
                  style={[
                    textStyles.body,
                    {
                      fontWeight: isSelected ? '600' : '400',
                      color: isSelected ? colors.primary : colors.foreground,
                    },
                  ]}
                >
                  {student.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={{ marginTop: spacing[4], alignItems: 'flex-end' }}>
          <Button variant="ghost" onPress={() => setShowStudentPicker(false)}>
            Cancel
          </Button>
        </View>
      </Dialog>
    </>
  );
};

const styles = StyleSheet.create({
  attachmentSection: {
    marginBottom: 16,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
});
