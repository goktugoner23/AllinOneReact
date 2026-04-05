import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Alert, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { Dialog, Input, Button, Switch } from '@shared/components/ui';
import { FullscreenImage } from '@shared/components/ui/FullscreenImage';
import { useAppTheme, spacing, textStyles } from '@shared/theme';
import { useResolvedUri } from '@shared/hooks/useResolvedUri';
import { WTStudent } from '@features/wtregistry/types/WTRegistry';

interface EditStudentDialogProps {
  visible: boolean;
  student: WTStudent;
  onDismiss: () => void;
  onSave: (student: WTStudent) => void;
}

export const EditStudentDialog: React.FC<EditStudentDialogProps> = ({ visible, student, onDismiss, onSave }) => {
  const { colors } = useAppTheme();
  const [name, setName] = useState(student.name);
  const [phoneNumber, setPhoneNumber] = useState(student.phoneNumber || '');
  const [email, setEmail] = useState(student.email || '');
  const [notes, setNotes] = useState(student.notes || '');
  const [photoUri, setPhotoUri] = useState<string | null>(student.photoUri || null);
  // Resolve R2 keys to signed URLs for display; passes through local file://
  // URIs (freshly picked) since getDisplayUrl will fail and fall through.
  const displayPhotoUri = useResolvedUri(photoUri);
  const [isActive, setIsActive] = useState(student.isActive);
  const [showEditPhotoOptions, setShowEditPhotoOptions] = useState(false);
  const [showEditFullscreenPhoto, setShowEditFullscreenPhoto] = useState(false);

  // Reset form when student changes
  useEffect(() => {
    setName(student.name);
    setPhoneNumber(student.phoneNumber || '');
    setEmail(student.email || '');
    setNotes(student.notes || '');
    setPhotoUri(student.photoUri || null);
    setIsActive(student.isActive);
  }, [student]);

  const handleEditPhotoOptions = () => {
    setShowEditPhotoOptions(true);
  };

  const handleEditViewPhoto = () => {
    setShowEditPhotoOptions(false);
    setShowEditFullscreenPhoto(true);
  };

  const handleEditChangePhoto = async () => {
    setShowEditPhotoOptions(false);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
        quality: 0.8,
      });

      if (result.assets && result.assets[0]) {
        setPhotoUri(result.assets[0].uri || null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleEditRemovePhoto = () => {
    setShowEditPhotoOptions(false);
    setPhotoUri(null);
  };


  const handleSave = () => {
    if (!name.trim() || !phoneNumber.trim()) {
      Alert.alert('Error', 'Name and phone number are required');
      return;
    }

    onSave({
      ...student,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      photoUri: photoUri || undefined,
      isActive,
    });
  };

  return (
    <>
      <Dialog visible={visible} onClose={onDismiss} title="Edit Student">
        <ScrollView style={{ maxHeight: 400 }}>
          {/* Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              onPress={() => {
                if (photoUri) {
                  setShowEditFullscreenPhoto(true);
                }
              }}
              onLongPress={handleEditPhotoOptions}
              style={styles.photoButton}
            >
              {photoUri ? (
                <Image source={{ uri: displayPhotoUri || photoUri }} style={styles.photoPreview} />
              ) : (
                <View style={[styles.photoPlaceholder, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <Ionicons name="camera" size={32} color={colors.foregroundMuted} />
                  <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: spacing[2] }]}>
                    Add Photo
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Text
              style={[
                textStyles.caption,
                { color: colors.foregroundSubtle, fontStyle: 'italic', marginTop: spacing[1] },
              ]}
            >
              {photoUri ? 'Tap to view, long press for options' : 'Tap to add photo'}
            </Text>
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
            label="Notes"
            placeholder="Enter notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />

          {/* Active Status */}
          <Switch value={isActive} onChange={setIsActive} label="Active" />
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

      {/* Edit Photo Options Dialog */}
      <Dialog visible={showEditPhotoOptions} onClose={() => setShowEditPhotoOptions(false)} title="Photo Options">
        <View style={{ alignItems: 'center', paddingVertical: spacing[4], gap: spacing[2] }}>
          <Button variant="outline" fullWidth onPress={handleEditViewPhoto}>
            View Photo
          </Button>
          <Button variant="outline" fullWidth onPress={handleEditChangePhoto}>
            Change Photo
          </Button>
          <Button variant="destructive" fullWidth onPress={handleEditRemovePhoto}>
            Remove Photo
          </Button>
        </View>
      </Dialog>

      {/* Edit Fullscreen Photo Modal */}
      <Modal
        visible={showEditFullscreenPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditFullscreenPhoto(false)}
      >
        <FullscreenImage uri={displayPhotoUri || photoUri || ''} onClose={() => setShowEditFullscreenPhoto(false)} />
      </Modal>
    </>
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
