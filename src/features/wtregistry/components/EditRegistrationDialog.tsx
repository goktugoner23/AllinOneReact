import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dialog, Input, Button, Switch } from '@shared/components/ui';
import { useAppTheme, spacing, radius, textStyles } from '@shared/theme';
import { WTStudent, WTRegistration } from '@features/wtregistry/types/WTRegistry';
import { updateRegistrationPaymentStatus } from '@features/wtregistry/services/wtRegistry';
import { pickDocument, isValidReceiptFile } from '@shared/utils/documentPicker';

// Helper to convert string | Date to Date
const toDateValue = (date: string | Date): Date => {
  if (typeof date === 'string') return new Date(date);
  return date;
};

interface EditRegistrationDialogProps {
  visible: boolean;
  registration: WTRegistration;
  students: WTStudent[];
  onDismiss: () => void;
  onSave: (registration: WTRegistration) => void;
}

export const EditRegistrationDialog: React.FC<EditRegistrationDialogProps> = ({
  visible,
  registration,
  students,
  onDismiss,
  onSave,
}) => {
  const { colors } = useAppTheme();
  const [studentId, setStudentId] = useState(registration.studentId);
  const [amount, setAmount] = useState(registration.amount.toString());
  const [startDate, setStartDate] = useState(
    registration.startDate ? toDateValue(registration.startDate).toISOString().split('T')[0] : '',
  );
  const [endDate, setEndDate] = useState(
    registration.endDate ? toDateValue(registration.endDate).toISOString().split('T')[0] : '',
  );
  const [notes, setNotes] = useState(registration.notes || '');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(registration.attachmentUri || null);
  const [isPaid, setIsPaid] = useState(registration.isPaid);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

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

  const handleSave = async () => {
    if (!studentId || !amount.trim()) {
      Alert.alert('Error', 'Student and amount are required');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      // Check if payment status changed
      const paymentStatusChanged = registration.isPaid !== isPaid;

      if (paymentStatusChanged) {
        await updateRegistrationPaymentStatus(
          {
            ...registration,
            studentId,
            amount: amountValue,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            notes: notes.trim() || undefined,
            attachmentUri: attachmentUri || undefined,
            isPaid,
          },
          isPaid,
          registration.isPaid,
        );
        onDismiss();
      } else {
        onSave({
          ...registration,
          studentId,
          amount: amountValue,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          notes: notes.trim() || undefined,
          attachmentUri: attachmentUri || undefined,
          isPaid,
        });
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      Alert.alert('Error', 'Failed to save registration');
    }
  };

  return (
    <>
      <Dialog visible={visible} onClose={onDismiss} title="Edit Registration">
        <ScrollView style={{ maxHeight: 400 }}>
          {/* Student Display (Read-only) */}
          <Input
            label="Student"
            value={students.find((s) => s.id === studentId)?.name || 'Unknown Student'}
            editable={false}
            variant="filled"
          />

          <Input
            label="Amount"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

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
