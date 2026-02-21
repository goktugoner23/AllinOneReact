import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { Dialog, Input, Button } from '@shared/components/ui';
import { useAppTheme, spacing, textStyles } from '@shared/theme';
import { WTStudent } from '@features/wtregistry/types/WTRegistry';

const getSafeUri = (result: ImagePickerResponse): string | null => {
  if (!result.didCancel && result.assets && result.assets.length > 0) {
    const uri = result.assets[0].uri;
    return uri ? uri : null;
  }
  return null;
};

interface AddStudentDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (student: Omit<WTStudent, 'id'>) => void;
}

export const AddStudentDialog: React.FC<AddStudentDialogProps> = ({ visible, onDismiss, onSave }) => {
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.8,
    });

    setPhotoUri(getSafeUri(result));
  };

  const handleSave = () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert('Error', 'Name and phone number are required');
      return;
    }

    onSave({
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim() || undefined,
      instagram: instagram.trim() || undefined,
      notes: notes.trim() || undefined,
      photoUri: photoUri || undefined,
      isActive,
    });

    // Reset form
    setName('');
    setPhoneNumber('');
    setEmail('');
    setInstagram('');
    setNotes('');
    setPhotoUri(null);
    setIsActive(true);
  };

  return (
    <Dialog visible={visible} onClose={onDismiss} title="Add Student">
      <ScrollView style={{ maxHeight: 400 }}>
        {/* Photo Section */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={[styles.photoPlaceholder, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Ionicons name="camera" size={32} color={colors.foregroundMuted} />
                <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: spacing[2] }]}>
                  Add Photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Input label="Name" placeholder="Enter student name" value={name} onChangeText={setName} />
        <Input
          label="Phone Number"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        <Input
          label="Email"
          placeholder="Enter email (optional)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Input
          label="Instagram"
          placeholder="Enter Instagram handle (optional)"
          value={instagram}
          onChangeText={setInstagram}
        />
        <Input
          label="Notes"
          placeholder="Enter notes (optional)"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[4], justifyContent: 'flex-end' }}>
        <Button variant="ghost" onPress={onDismiss}>
          Cancel
        </Button>
        <Button variant="primary" onPress={handleSave}>
          Add
        </Button>
      </View>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  photoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photoButton: {
    alignItems: 'center',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
});
