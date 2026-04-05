import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl, Modal, Linking } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { AddFab } from '@shared/components';
import { Avatar, Button, EmptyState, Dialog } from '@shared/components/ui';
import { FullscreenImage } from '@shared/components/ui/FullscreenImage';
import { useAppTheme, spacing, textStyles } from '@shared/theme';
import { useResolvedUri } from '@shared/hooks/useResolvedUri';
import {
  fetchStudents,
  addStudent,
  updateStudent,
  deleteStudent,
  uploadFileToStorage,
  deleteFileFromStorage,
} from '@features/wtregistry/services/wtRegistry';
import { WTStudent } from '@features/wtregistry/types/WTRegistry';
import { launchImageLibrary } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AddStudentDialog } from '@features/wtregistry/components/AddStudentDialog';
import { EditStudentDialog } from '@features/wtregistry/components/EditStudentDialog';

// Small helpers that resolve an R2 key (or legacy URL) to a displayable URI
// via the useResolvedUri hook. Extracted so hooks aren't called inside .map().
const StudentPhotoAvatar: React.FC<{ photoUri?: string; name: string; size?: 'lg' | 'xl' }> = ({
  photoUri,
  name,
  size = 'lg',
}) => {
  const resolved = useResolvedUri(photoUri);
  return <Avatar source={resolved ? { uri: resolved } : undefined} name={name} size={size} />;
};

const StudentPhotoFullscreen: React.FC<{ photoUri?: string; onClose: () => void }> = ({
  photoUri,
  onClose,
}) => {
  const resolved = useResolvedUri(photoUri);
  return <FullscreenImage uri={resolved || ''} onClose={onClose} />;
};

export const StudentsTab: React.FC = () => {
  const { colors } = useAppTheme();
  const [students, setStudents] = useState<WTStudent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<WTStudent | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showFullscreenPhoto, setShowFullscreenPhoto] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const loadStudents = async () => {
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', `Failed to load students: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const handleAddStudent = async (studentData: Omit<WTStudent, 'id'>) => {
    try {
      await addStudent(studentData);
      setShowAddDialog(false);
      loadStudents();
    } catch (error) {
      console.error('Error adding student:', error);
      Alert.alert('Error', 'Failed to add student');
    }
  };

  const handleUpdateStudent = async (student: WTStudent) => {
    try {
      await updateStudent(student);
      setShowEditDialog(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      Alert.alert('Error', 'Failed to update student');
    }
  };

  const handleDeleteStudent = async (student: WTStudent) => {
    Alert.alert('Delete Student', `Are you sure you want to delete ${student.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteStudent(student.id);
            loadStudents();
          } catch (error) {
            console.error('Error deleting student:', error);
            Alert.alert('Error', 'Failed to delete student');
          }
        },
      },
    ]);
  };

  // Contact action handlers
  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}`);
  };


  // Photo handling
  const handlePhotoOptions = () => {
    setShowPhotoOptions(true);
  };

  const handleViewPhoto = () => {
    setShowPhotoOptions(false);
    setShowFullscreenPhoto(true);
  };

  const handleDetailViewPhoto = () => {
    setShowDetailModal(false);
    setShowFullscreenPhoto(true);
  };

  const handleChangePhoto = async () => {
    setShowPhotoOptions(false);
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
        quality: 0.8,
      });

      const asset = result.assets?.[0];
      if (!asset || !asset.uri || !selectedStudent) return;

      // Upload the picker file to R2 first so we persist a real key — not a
      // dead `file://` URI — then delete the previous photo if any.
      const ext = (asset.fileName?.split('.').pop() || asset.uri.split('.').pop() || 'jpg').toLowerCase();
      const fileName = `${selectedStudent.id}.${ext}`;
      const uploadedKey = await uploadFileToStorage(asset.uri, 'students', fileName);
      if (!uploadedKey) {
        Alert.alert('Error', 'Failed to upload photo');
        return;
      }

      const previousPhoto = selectedStudent.photoUri;
      const updatedStudent = { ...selectedStudent, photoUri: uploadedKey };
      try {
        await updateStudent(updatedStudent);
        if (previousPhoto) {
          await deleteFileFromStorage(previousPhoto);
        }
        setSelectedStudent(updatedStudent);
        loadStudents();
      } catch (err) {
        console.error('Error saving updated photo:', err);
        Alert.alert('Error', 'Failed to save photo');
        // Clean up the orphaned upload so R2 doesn't accumulate garbage.
        await deleteFileFromStorage(uploadedKey);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemovePhoto = async () => {
    setShowPhotoOptions(false);
    if (!selectedStudent) return;
    const previousPhoto = selectedStudent.photoUri;
    const updatedStudent = { ...selectedStudent, photoUri: undefined };
    try {
      await updateStudent(updatedStudent);
      if (previousPhoto) {
        await deleteFileFromStorage(previousPhoto);
      }
      setSelectedStudent(updatedStudent);
      loadStudents();
    } catch (err) {
      console.error('Error removing photo:', err);
      Alert.alert('Error', 'Failed to remove photo');
    }
  };

  const renderStudent = ({ item, index }: { item: WTStudent; index: number }) => {
    const isFirst = index === 0;
    const isLast = index === students.length - 1;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          setSelectedStudent(item);
          setShowDetailModal(true);
        }}
        onLongPress={() => {
          setSelectedStudent(item);
          setShowOptionsModal(true);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginHorizontal: 16,
          backgroundColor: colors.card,
          borderTopLeftRadius: isFirst ? 12 : 0,
          borderTopRightRadius: isFirst ? 12 : 0,
          borderBottomLeftRadius: isLast ? 12 : 0,
          borderBottomRightRadius: isLast ? 12 : 0,
          borderBottomWidth: !isLast ? StyleSheet.hairlineWidth : 0,
          borderBottomColor: colors.border,
        }}
      >
        {/* Avatar */}
        <TouchableOpacity
          onPress={() => {
            if (item.photoUri) {
              setSelectedStudent(item);
              setShowFullscreenPhoto(true);
            }
          }}
          activeOpacity={item.photoUri ? 0.7 : 1}
          style={{ marginRight: 14 }}
        >
          <StudentPhotoAvatar photoUri={item.photoUri} name={item.name} size="lg" />
        </TouchableOpacity>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>{item.name}</Text>
          {item.phoneNumber && (
            <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 2 }}>{item.phoneNumber}</Text>
          )}
        </View>

        {/* Status Indicator */}
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: item.isActive ? colors.success : colors.destructive,
            marginLeft: 12,
          }}
        />

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlashList
        data={students}
        renderItem={({ item, index }) => renderStudent({ item, index })}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingTop: spacing[4], paddingBottom: spacing[20] }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No students yet"
            description="Add your first student to get started"
            actionLabel="Add Student"
            onAction={() => setShowAddDialog(true)}
          />
        }
        estimatedItemSize={72}
      />

      <AddFab style={styles.fab} onPress={() => setShowAddDialog(true)} />

      {/* Add Student Dialog */}
      <AddStudentDialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)} onSave={handleAddStudent} />

      {/* Edit Student Dialog */}
      {selectedStudent && (
        <EditStudentDialog
          visible={showEditDialog}
          student={selectedStudent}
          onDismiss={() => {
            setShowEditDialog(false);
            setSelectedStudent(null);
          }}
          onSave={handleUpdateStudent}
        />
      )}

      {/* Detailed Student Modal */}
      <Dialog visible={showDetailModal} onClose={() => setShowDetailModal(false)}>
        {selectedStudent && (
          <View style={{ alignItems: 'center' }}>
            {/* Photo */}
            <TouchableOpacity
              onPress={() => {
                if (selectedStudent.photoUri) {
                  setShowFullscreenPhoto(true);
                }
              }}
              style={{ marginBottom: spacing[4] }}
            >
              <StudentPhotoAvatar
                photoUri={selectedStudent.photoUri}
                name={selectedStudent.name}
                size="xl"
              />
            </TouchableOpacity>

            {/* Name */}
            <Text
              style={[textStyles.h3, { color: colors.foreground, marginBottom: spacing[4], textAlign: 'center' }]}
            >
              {selectedStudent.name}
            </Text>

            {/* Contact Info */}
            <View style={{ width: '100%', marginBottom: spacing[5] }}>
              {selectedStudent.phoneNumber && (
                <Text style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                  Phone: {selectedStudent.phoneNumber}
                </Text>
              )}
              <Text style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                Status: {selectedStudent.isActive ? 'Active' : 'Passive'}
              </Text>
              <Text style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                Registration: Registered
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
              {selectedStudent.phoneNumber && (
                <TouchableOpacity
                  onPress={() => handleCall(selectedStudent.phoneNumber!)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.success,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={26} color={colors.successForeground} />
                </TouchableOpacity>
              )}
              {selectedStudent.phoneNumber && (
                <TouchableOpacity
                  onPress={() => handleWhatsApp(selectedStudent.phoneNumber!)}
                  style={{
                    // WhatsApp brand color — intentionally hardcoded (not themed).
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#25D366',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  {/* White foreground on the WhatsApp brand green, matches brand guidelines. */}
                  <Ionicons name="logo-whatsapp" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Dialog>

      {/* Photo Options Dialog */}
      <Dialog visible={showPhotoOptions} onClose={() => setShowPhotoOptions(false)} title="Photo Options">
        <View style={{ alignItems: 'center', paddingVertical: spacing[4] }}>
          <TouchableOpacity
            style={[styles.photoOptionButton, { borderBottomColor: colors.border }]}
            onPress={handleViewPhoto}
          >
            <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '500' }]}>View Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoOptionButton, { borderBottomColor: colors.border }]}
            onPress={handleChangePhoto}
          >
            <Text style={[textStyles.body, { color: colors.foreground, fontWeight: '500' }]}>Change Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.photoOptionButton, { borderBottomColor: colors.border }]}
            onPress={handleRemovePhoto}
          >
            <Text style={[textStyles.body, { color: colors.destructive, fontWeight: '500' }]}>Remove Photo</Text>
          </TouchableOpacity>
        </View>
      </Dialog>

      {/* Fullscreen Photo Modal */}
      <Modal
        visible={showFullscreenPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullscreenPhoto(false)}
      >
        <StudentPhotoFullscreen
          photoUri={selectedStudent?.photoUri}
          onClose={() => setShowFullscreenPhoto(false)}
        />
      </Modal>

      {/* Student Options Modal */}
      <Dialog
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        title="Student Options"
        description={`What would you like to do with ${selectedStudent?.name}?`}
      >
        <View style={{ flexDirection: 'column', alignItems: 'stretch', gap: spacing[2], marginTop: spacing[4] }}>
          <Button
            variant="outline"
            fullWidth
            onPress={() => {
              setShowOptionsModal(false);
              setShowEditDialog(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            fullWidth
            onPress={() => {
              setShowOptionsModal(false);
              if (selectedStudent) {
                handleDeleteStudent(selectedStudent);
              }
            }}
          >
            Delete
          </Button>
          <Button variant="ghost" fullWidth onPress={() => setShowOptionsModal(false)}>
            Cancel
          </Button>
        </View>
      </Dialog>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    zIndex: 999,
  },
  photoOptionButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
});
