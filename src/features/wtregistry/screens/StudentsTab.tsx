import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Linking, Image, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { PurpleFab } from '@shared/components';
import {
  Card,
  Text,
  Portal,
  Dialog,
  TextInput,
  Button,
  Switch,
  Chip,
  IconButton,
  Searchbar,
  useTheme,
  Surface,
  Menu,
  Divider,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@shared/store/rootStore';
import { addStudent, updateStudent, deleteStudent } from '@features/wtregistry/store/wtRegistrySlice';
import { WTStudent } from '../types/WTRegistry';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';

export function StudentsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
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

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        await dispatch(updateStudent({
          ...editingStudent,
          ...formData,
        })).unwrap();
      } else {
        await dispatch(addStudent(formData)).unwrap();
      }
      handleCloseDialog();
    } catch (error) {
      Alert.alert('Error', 'Failed to save student');
    }
  };

  const handleDelete = (student: WTStudent) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}?`,
      [
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
      ]
    );
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

  const renderStudentCard = ({ item: student }: { item: WTStudent }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedStudent(student);
        setShowDetailModal(true);
      }}
      onLongPress={() => {
        setSelectedStudent(student);
        // Show edit/delete options
        Alert.alert(
          'Student Options',
          `What would you like to do with ${student.name}?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Edit', onPress: () => handleOpenDialog(student) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDelete(student) },
          ]
        );
      }}
      activeOpacity={0.7}
    >
      <Card style={[styles.studentCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
        <Card.Content style={styles.cardContent}>
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
              <Text variant="titleMedium" style={styles.studentName}>
                {student.name}
              </Text>
              <Chip
                mode="outlined"
                style={[
                  styles.statusChip,
                  { backgroundColor: student.isActive ? theme.colors.primaryContainer : theme.colors.errorContainer }
                ]}
                textStyle={{ color: student.isActive ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer }}
              >
                {student.isActive ? 'Active' : 'Inactive'}
              </Chip>
            </View>
          </View>
          
          {student.phoneNumber && (
            <Text variant="bodySmall" style={styles.contactInfo}>
              📞 {student.phoneNumber}
            </Text>
          )}
          {student.email && (
            <Text variant="bodySmall" style={styles.contactInfo}>
              ✉️ {student.email}
            </Text>
          )}
          {student.instagram && (
            <Text variant="bodySmall" style={styles.contactInfo}>
              📱 @{student.instagram}
            </Text>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={2}>
        <Searchbar
          placeholder="Search students..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterContainer}>
          <Text variant="bodyMedium">Show active only</Text>
          <Switch
            value={showActiveOnly}
            onValueChange={setShowActiveOnly}
          />
        </View>
      </Surface>

      <FlashList<WTStudent>
        data={filteredStudents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStudentCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={110}
      />

      <PurpleFab style={styles.fab} onPress={() => handleOpenDialog()} />

      {/* Detailed Student Modal */}
      <Portal>
        <Dialog visible={showDetailModal} onDismiss={() => setShowDetailModal(false)}>
          <Dialog.Content>
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
                <Text variant="headlineSmall" style={styles.detailName}>
                  {selectedStudent.name}
                </Text>

                {/* Contact Info */}
                <View style={styles.detailInfo}>
                  {selectedStudent.phoneNumber && (
                    <Text variant="bodyMedium" style={styles.detailText}>
                      Phone: {selectedStudent.phoneNumber}
                    </Text>
                  )}
                  {selectedStudent.email && (
                    <Text variant="bodyMedium" style={styles.detailText}>
                      Email: {selectedStudent.email}
                    </Text>
                  )}
                  {selectedStudent.instagram && (
                    <Text variant="bodyMedium" style={styles.detailText}>
                      Instagram: @{selectedStudent.instagram}
                    </Text>
                  )}
                  <Text variant="bodyMedium" style={styles.detailText}>
                    Status: {selectedStudent.isActive ? 'Active' : 'Passive'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.detailText}>
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
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Edit/Add Student Dialog */}
      <Portal>
        <Dialog visible={showDialog} onDismiss={handleCloseDialog} style={{ maxHeight: '80%' }}>
          <Dialog.Title>{editingStudent ? 'Edit Student' : 'Add Student'}</Dialog.Title>
          <Dialog.Content>
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
                <Text variant="bodySmall" style={styles.photoHint}>
                  Long press for photo options
                </Text>
              </View>

              <TextInput
                label="Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Phone Number"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
              />
              <TextInput
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                label="Instagram"
                value={formData.instagram}
                onChangeText={(text) => setFormData({ ...formData, instagram: text })}
                style={styles.input}
                mode="outlined"
                autoCapitalize="none"
              />
              <TextInput
                label="Notes"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                style={[styles.input, styles.notesInput]}
                mode="outlined"
                multiline
                numberOfLines={4}
                scrollEnabled={true}
              />
              <View style={styles.switchContainer}>
                <Text variant="bodyMedium">Active</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                />
              </View>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDialog}>Cancel</Button>
            <Button onPress={handleSave} mode="contained">
              {editingStudent ? 'Save' : 'Add'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Photo Options Dialog */}
      <Portal>
        <Dialog visible={showPhotoOptions} onDismiss={() => setShowPhotoOptions(false)}>
          <Dialog.Title>Photo Options</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">What would you like to do with this photo?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleViewPhoto}>View Photo</Button>
            <Button onPress={handleChangePhoto}>Change Photo</Button>
            <Button onPress={handleRemovePhoto} textColor="red">Remove Photo</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Fullscreen Photo Modal */}
      <Portal>
        <Dialog 
          visible={showFullscreenPhoto} 
          onDismiss={() => setShowFullscreenPhoto(false)}
          style={styles.fullscreenDialog}
        >
          <Dialog.Content style={styles.fullscreenContent}>
            {selectedStudent?.photoUri && (
              <Image 
                source={{ uri: selectedStudent.photoUri }} 
                style={styles.fullscreenPhoto}
                resizeMode="contain"
              />
            )}
            {formData.photoUri && (
              <Image 
                source={{ uri: formData.photoUri }} 
                style={styles.fullscreenPhoto}
                resizeMode="contain"
              />
            )}
          </Dialog.Content>
        </Dialog>
      </Portal>
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
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
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
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
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
    color: '#666',
    fontStyle: 'italic',
  },
  // Fullscreen photo styles
  fullscreenDialog: {
    margin: 0,
    padding: 0,
  },
  fullscreenContent: {
    padding: 0,
    backgroundColor: 'black',
  },
  fullscreenPhoto: {
    width: '100%',
    height: 400,
  },
  notesInput: {
    minHeight: 100, // Ensure a minimum height for multiline text input
  },
}); 