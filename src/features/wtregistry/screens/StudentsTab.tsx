import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Linking, Image, ScrollView, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { AddFab } from '@shared/components';
import {
  Card,
  CardContent,
  Dialog,
  Input,
  Button,
  Switch,
  Chip,
  IconButton,
  Searchbar,
  Divider,
} from '@shared/components/ui';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import { addStudent, updateStudent, deleteStudent } from '@features/wtregistry/store/wtRegistrySlice';
import { WTStudent } from '../types/WTRegistry';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAppTheme, spacing, radius, textStyles } from '@shared/theme';

export function StudentsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useAppTheme();
  const { students, loading } = useSelector((state: RootState) => state.wtRegistry);

  const [showDialog, setShowDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<WTStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // New states for detailed modal and photo options
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<WTStudent | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showFullscreenPhoto, setShowFullscreenPhoto] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    instagram: '',
    isActive: true,
    notes: '',
    photoUri: '',
  });

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.instagram?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesActiveFilter = showActiveOnly ? student.isActive : true;

    return matchesSearch && matchesActiveFilter;
  });

  const handleOpenDialog = (student?: WTStudent) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        phoneNumber: student.phoneNumber || '',
        email: student.email || '',
        instagram: student.instagram || '',
        isActive: student.isActive,
        notes: student.notes || '',
        photoUri: student.photoUri || '',
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        phoneNumber: '',
        email: '',
        instagram: '',
        isActive: true,
        notes: '',
        photoUri: '',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingStudent(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Student name is required');
      return;
    }

    try {
      if (editingStudent) {
        await dispatch(
          updateStudent({
            ...editingStudent,
            ...formData,
          }),
        ).unwrap();
      } else {
        await dispatch(addStudent(formData)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      Alert.alert('Error', 'Failed to save student');
    }
  };

  const handleDelete = (student: WTStudent) => {
    Alert.alert('Delete Student', `Are you sure you want to delete ${student.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await dispatch(deleteStudent(student.id)).unwrap();
          } catch (error) {
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

  const handleInstagram = (instagram: string) => {
    Linking.openURL(`https://www.instagram.com/${instagram}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  // Photo handling
  const handlePhotoOptions = () => {
    setShowPhotoOptions(true);
  };

  const handleViewPhoto = () => {
    setShowPhotoOptions(false);
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

      if (result.assets && result.assets[0]) {
        setFormData({ ...formData, photoUri: result.assets[0].uri || '' });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemovePhoto = () => {
    setShowPhotoOptions(false);
    setFormData({ ...formData, photoUri: '' });
  };

  const handleDownloadFromInstagram = async () => {
    setShowPhotoOptions(false);

    if (!formData.instagram?.trim()) {
      Alert.alert('Error', 'Please enter an Instagram handle first');
      return;
    }

    try {
      Alert.alert('Downloading...', 'Fetching profile picture from Instagram');

      const { instagramApiService } = await import('@features/instagram/services/InstagramApiService');
      const response = await instagramApiService.getProfilePicture(formData.instagram.trim());

      if (response.success && response.data?.imageUrl) {
        setFormData({ ...formData, photoUri: response.data.imageUrl });
        Alert.alert('Success', 'Instagram profile picture downloaded successfully!');
      } else {
        Alert.alert('Error', 'Instagram profile not found or not accessible');
      }
    } catch (error) {
      console.error('Error downloading Instagram profile picture:', error);
      Alert.alert('Error', 'Failed to download Instagram profile picture. Please check the username and try again.');
    }
  };

  const renderStudentCard = ({ item: student }: { item: WTStudent }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedStudent(student);
        setShowDetailModal(true);
      }}
      onLongPress={() => {
        setSelectedStudent(student);
        // Show edit/delete options
        Alert.alert('Student Options', `What would you like to do with ${student.name}?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => handleOpenDialog(student) },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(student) },
        ]);
      }}
      activeOpacity={0.7}
    >
      <Card style={styles.studentCard} variant="outlined">
        <CardContent style={styles.cardContent}>
          <View style={styles.studentHeader}>
            <View style={styles.studentPhotoContainer}>
              {student.photoUri ? (
                <Image source={{ uri: student.photoUri }} style={styles.studentPhoto} />
              ) : (
                <View style={styles.defaultPhoto}>
                  <Ionicons name="person" size={24} color="#666" />
                </View>
              )}
            </View>
            <View style={styles.studentInfo}>
              <Text style={[textStyles.bodyLarge, styles.studentName, { color: colors.foreground }]}>
                {student.name}
              </Text>
              <Chip
                variant="filled"
                color={student.isActive ? 'success' : 'error'}
                size="sm"
                style={styles.statusChip}
              >
                {student.isActive ? 'Active' : 'Inactive'}
              </Chip>
            </View>
          </View>

          {student.phoneNumber && (
            <Text style={[textStyles.bodySmall, styles.contactInfo, { color: colors.foregroundMuted }]}>
              📞 {student.phoneNumber}
            </Text>
          )}
          {student.email && (
            <Text style={[textStyles.bodySmall, styles.contactInfo, { color: colors.foregroundMuted }]}>
              ✉️ {student.email}
            </Text>
          )}
          {student.instagram && (
            <Text style={[textStyles.bodySmall, styles.contactInfo, { color: colors.foregroundMuted }]}>
              📱 @{student.instagram}
            </Text>
          )}
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Searchbar
          placeholder="Search students..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <Switch value={showActiveOnly} onChange={setShowActiveOnly} label="Show active only" />
      </View>

      <FlashList<WTStudent>
        data={filteredStudents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStudentCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={110}
      />

      <AddFab style={styles.fab} onPress={() => handleOpenDialog()} />

      {/* Detailed Student Modal */}
      <Dialog visible={showDetailModal} onClose={() => setShowDetailModal(false)}>
        {selectedStudent && (
          <View style={styles.detailContent}>
            {/* Photo */}
            <TouchableOpacity
              onPress={() => {
                if (selectedStudent.photoUri) {
                  setShowFullscreenPhoto(true);
                }
              }}
              style={styles.detailPhotoContainer}
            >
              {selectedStudent.photoUri ? (
                <Image source={{ uri: selectedStudent.photoUri }} style={styles.detailPhoto} />
              ) : (
                <View style={styles.detailDefaultPhoto}>
                  <Ionicons name="person" size={60} color="#666" />
                </View>
              )}
            </TouchableOpacity>

            {/* Name */}
            <Text style={[textStyles.h3, styles.detailName, { color: colors.foreground }]}>
              {selectedStudent.name}
            </Text>

            {/* Contact Info */}
            <View style={styles.detailInfo}>
              {selectedStudent.phoneNumber && (
                <Text style={[textStyles.body, styles.detailText, { color: colors.foregroundMuted }]}>
                  Phone: {selectedStudent.phoneNumber}
                </Text>
              )}
              {selectedStudent.email && (
                <Text style={[textStyles.body, styles.detailText, { color: colors.foregroundMuted }]}>
                  Email: {selectedStudent.email}
                </Text>
              )}
              {selectedStudent.instagram && (
                <Text style={[textStyles.body, styles.detailText, { color: colors.foregroundMuted }]}>
                  Instagram: @{selectedStudent.instagram}
                </Text>
              )}
              <Text style={[textStyles.body, styles.detailText, { color: colors.foregroundMuted }]}>
                Status: {selectedStudent.isActive ? 'Active' : 'Passive'}
              </Text>
              <Text style={[textStyles.body, styles.detailText, { color: colors.foregroundMuted }]}>
                Registration: Registered
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {selectedStudent.phoneNumber && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleCall(selectedStudent.phoneNumber!)}
                >
                  <Ionicons name="call" size={24} color="white" />
                </TouchableOpacity>
              )}
              {selectedStudent.phoneNumber && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#25D366' }]}
                  onPress={() => handleWhatsApp(selectedStudent.phoneNumber!)}
                >
                  <Ionicons name="logo-whatsapp" size={24} color="white" />
                </TouchableOpacity>
              )}

              {selectedStudent.instagram && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#E4405F' }]}
                  onPress={() => handleInstagram(selectedStudent.instagram!)}
                >
                  <Ionicons name="logo-instagram" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Dialog>

      {/* Edit/Add Student Dialog */}
      <Dialog
        visible={showDialog}
        onClose={handleCloseDialog}
        title={editingStudent ? 'Edit Student' : 'Add Student'}
      >
        <ScrollView style={{ maxHeight: 400 }}>
          {/* Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              onLongPress={handlePhotoOptions}
              onPress={() => {
                if (formData.photoUri) {
                  setShowFullscreenPhoto(true);
                }
              }}
              style={styles.editPhotoContainer}
            >
              {formData.photoUri ? (
                <Image source={{ uri: formData.photoUri }} style={styles.editPhoto} />
              ) : (
                <View style={styles.editDefaultPhoto}>
                  <Ionicons name="person" size={40} color="#666" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={[textStyles.bodySmall, styles.photoHint, { color: colors.foregroundMuted }]}>
              Long press for photo options
            </Text>
          </View>

          <Input
            label="Name *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
          <Input
            label="Phone Number"
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
            keyboardType="phone-pad"
          />
          <Input
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Instagram"
            value={formData.instagram}
            onChangeText={(text) => setFormData({ ...formData, instagram: text })}
            autoCapitalize="none"
          />
          <Input
            label="Notes"
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={4}
          />
          <Switch
            value={formData.isActive}
            onChange={(value) => setFormData({ ...formData, isActive: value })}
            label="Active"
          />
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[4], justifyContent: 'flex-end' }}>
          <Button variant="ghost" onPress={handleCloseDialog}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave}>
            {editingStudent ? 'Save' : 'Add'}
          </Button>
        </View>
      </Dialog>

      {/* Photo Options Dialog */}
      <Dialog
        visible={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        title="Photo Options"
        description="What would you like to do with this photo?"
      >
        <View style={{ flexDirection: 'column', gap: spacing[2], marginTop: spacing[4] }}>
          <Button variant="outline" fullWidth onPress={handleViewPhoto}>
            View Photo
          </Button>
          <Button variant="outline" fullWidth onPress={handleChangePhoto}>
            Change Photo
          </Button>
          <Button variant="destructive" fullWidth onPress={handleRemovePhoto}>
            Remove Photo
          </Button>
          {formData.instagram?.trim() && (
            <Button variant="secondary" fullWidth onPress={handleDownloadFromInstagram}>
              Download from Instagram
            </Button>
          )}
        </View>
      </Dialog>

      {/* Fullscreen Photo Modal */}
      <Dialog visible={showFullscreenPhoto} onClose={() => setShowFullscreenPhoto(false)}>
        <View style={styles.fullscreenContent}>
          {selectedStudent?.photoUri && (
            <Image source={{ uri: selectedStudent.photoUri }} style={styles.fullscreenPhoto} resizeMode="contain" />
          )}
          {formData.photoUri && (
            <Image source={{ uri: formData.photoUri }} style={styles.fullscreenPhoto} resizeMode="contain" />
          )}
        </View>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    marginBottom: 8,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  studentCard: {
    marginBottom: 8,
  },
  cardContent: {
    padding: 12,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentPhotoContainer: {
    marginRight: 12,
  },
  studentPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  contactInfo: {
    marginBottom: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  // Detail modal styles
  detailContent: {
    alignItems: 'center',
  },
  detailPhotoContainer: {
    marginBottom: 16,
  },
  detailPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  detailDefaultPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailName: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailInfo: {
    width: '100%',
    marginBottom: 20,
  },
  detailText: {
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Edit modal photo styles
  photoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  editPhotoContainer: {
    marginBottom: 8,
  },
  editPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editDefaultPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    fontStyle: 'italic',
  },
  // Fullscreen photo styles
  fullscreenContent: {
    padding: 0,
    backgroundColor: 'black',
  },
  fullscreenPhoto: {
    width: '100%',
    height: 400,
  },
});
