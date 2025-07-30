import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Image,
  Platform,
  Linking,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Card, Button, Chip, Divider, FAB, Portal, Dialog, useTheme, Switch } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { fetchStudents, addStudent, updateStudent, deleteStudent } from '../data/wtRegistry';
import { fetchRegistrations, addRegistration, updateRegistration, deleteRegistration } from '../data/wtRegistry';
import { fetchLessons, addLesson, updateLesson, deleteLesson } from '../data/wtRegistry';
import { fetchSeminars, addSeminar, updateSeminar, deleteSeminar } from '../data/wtRegistry';
import { WTStudent, WTRegistration, WTLesson, WTSeminar } from '../types/WTRegistry';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

// Zoomable Fullscreen Image Component
interface FullscreenImageProps {
  uri: string;
  onClose: () => void;
}

const FullscreenImage: React.FC<FullscreenImageProps> = ({ uri, onClose }) => {
  const [scale, setScale] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [isPinching, setIsPinching] = useState(false);

  // Removed complex pan responder - keeping it simple with just pinch to zoom

  const handleTouch = (evt: any) => {
    const touches = evt.nativeEvent.touches;
    
    if (touches.length === 2) {
      // Two finger pinch
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.pageX - touch1.pageX, 2) + 
        Math.pow(touch2.pageY - touch1.pageY, 2)
      );
      
      if (!isPinching) {
        // Start of pinch gesture
        setInitialDistance(distance);
        setIsPinching(true);
      } else if (initialDistance > 0) {
        // During pinch gesture - calculate scale based on distance change
        const scaleChange = distance / initialDistance;
        const newScale = Math.max(1, Math.min(3, scaleChange));
        setScale(newScale);
        setIsZoomed(newScale > 1);
        
        // No position reset needed since we removed panning
      }
    } else if (touches.length === 1) {
      // End of pinch gesture or single finger touch
      setIsPinching(false);
      setInitialDistance(0);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Close button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          zIndex: 1000,
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={onClose}
      >
        <Ionicons name="close" size={24} color="white" />
      </TouchableOpacity>
      <View
        onTouchMove={handleTouch}
        onTouchEnd={handleTouch}
        onTouchStart={(evt) => {
          evt.stopPropagation();
        }}
      >
        <View
          style={{
            transform: [
              { scale },
            ],
          }}
        >
                      <Image
              source={{ uri }}
              style={{
                width: Dimensions.get('window').width * 0.9,
                height: Dimensions.get('window').height * 0.8,
                resizeMode: 'contain',
              }}
            />
          </View>
      </View>
    </View>
  );
};

// Utility function to safely get URI from image picker result
const getSafeUri = (result: ImagePickerResponse): string | null => {
  if (!result.didCancel && result.assets && result.assets.length > 0) {
    const uri = result.assets[0].uri;
    return uri ? uri : null;
  }
  return null;
};

// Students Tab with Profile Photos
const StudentsTab: React.FC = () => {
  const theme = useTheme();
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
              await deleteStudent(student.id);
              loadStudents();
            } catch (error) {
              console.error('Error deleting student:', error);
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

      if (result.assets && result.assets[0]) {
        // Update the selected student's photo
        if (selectedStudent) {
          const updatedStudent = { ...selectedStudent, photoUri: result.assets[0].uri || '' };
          setSelectedStudent(updatedStudent);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemovePhoto = () => {
    setShowPhotoOptions(false);
    if (selectedStudent) {
      const updatedStudent = { ...selectedStudent, photoUri: '' };
      setSelectedStudent(updatedStudent);
    }
  };

  const renderStudent = ({ item }: { item: WTStudent }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedStudent(item);
        setShowDetailModal(true);
      }}
      onLongPress={() => {
        setSelectedStudent(item);
        setShowOptionsModal(true);
      }}
      activeOpacity={0.7}
    >
      <Card style={styles.card} mode="outlined">
        <Card.Content style={{ padding: 8 }}>
          <View style={styles.studentHeader}>
                            <View style={styles.studentPhotoContainer}>
                  {item.photoUri ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedStudent(item);
                        setShowFullscreenPhoto(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: item.photoUri }} style={styles.studentPhoto} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.defaultPhoto}>
                      <Ionicons name="person" size={24} color="#666" />
                    </View>
                  )}
                </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{item.name}</Text>
              {item.phoneNumber && (
                <Text style={styles.studentDetail}>{item.phoneNumber}</Text>
              )}
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: item.isActive ? '#4CAF50' : '#F44336' }]} />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No students yet</Text>
            <Text style={styles.emptySubtext}>Add your first student to get started</Text>
          </View>
        }
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddDialog(true)}
      />

      {/* Add Student Dialog */}
      <AddStudentDialog
        visible={showAddDialog}
        onDismiss={() => setShowAddDialog(false)}
        onSave={handleAddStudent}
      />

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
      <Portal>
        <Dialog 
          visible={showDetailModal} 
          onDismiss={() => setShowDetailModal(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Content>
            {selectedStudent && (
              <View style={{ alignItems: 'center' }}>
                {/* Photo */}
                <TouchableOpacity
                  onPress={() => {
                    if (selectedStudent.photoUri) {
                      setShowFullscreenPhoto(true);
                    }
                  }}
                  style={{ marginBottom: 16 }}
                >
                  {selectedStudent.photoUri ? (
                    <Image source={{ uri: selectedStudent.photoUri }} style={{ width: 100, height: 100, borderRadius: 50 }} />
                  ) : (
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="person" size={60} color="#666" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Name */}
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
                  {selectedStudent.name}
                </Text>

                {/* Contact Info */}
                <View style={{ width: '100%', marginBottom: 20 }}>
                  {selectedStudent.phoneNumber && (
                    <Text style={{ marginBottom: 8 }}>Phone: {selectedStudent.phoneNumber}</Text>
                  )}
                  {selectedStudent.instagram && (
                    <Text style={{ marginBottom: 8 }}>Instagram: @{selectedStudent.instagram}</Text>
                  )}
                  <Text style={{ marginBottom: 8 }}>
                    Status: {selectedStudent.isActive ? 'Active' : 'Passive'}
                  </Text>
                  <Text style={{ marginBottom: 8 }}>
                    Registration: Registered
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>
                  {selectedStudent.phoneNumber && (
                    <TouchableOpacity
                      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' }}
                      onPress={() => handleCall(selectedStudent.phoneNumber!)}
                    >
                      <Ionicons name="call" size={24} color="white" />
                    </TouchableOpacity>
                  )}
                  {selectedStudent.phoneNumber && (
                    <TouchableOpacity
                      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center' }}
                      onPress={() => handleWhatsApp(selectedStudent.phoneNumber!)}
                    >
                      <Ionicons name="logo-whatsapp" size={24} color="white" />
                    </TouchableOpacity>
                  )}
                  {selectedStudent.instagram && (
                    <TouchableOpacity
                      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E4405F', justifyContent: 'center', alignItems: 'center' }}
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

      {/* Photo Options Dialog */}
      <Portal>
        <Dialog 
          visible={showPhotoOptions} 
          onDismiss={() => setShowPhotoOptions(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Photo Options</Dialog.Title>
          <Dialog.Content>
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <TouchableOpacity 
                style={styles.photoOptionButton}
                onPress={handleViewPhoto}
              >
                <Text style={styles.photoOptionText}>View Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.photoOptionButton}
                onPress={handleChangePhoto}
              >
                <Text style={styles.photoOptionText}>Change Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.photoOptionButton}
                onPress={handleRemovePhoto}
              >
                <Text style={[styles.photoOptionText, { color: theme.colors.error }]}>Remove Photo</Text>
              </TouchableOpacity>
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Fullscreen Photo Modal */}
      <Modal
        visible={showFullscreenPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullscreenPhoto(false)}
      >
        <FullscreenImage uri={selectedStudent?.photoUri || ''} onClose={() => setShowFullscreenPhoto(false)} />
      </Modal>

      {/* Student Options Modal */}
      <Portal>
        <Dialog 
          visible={showOptionsModal} 
          onDismiss={() => setShowOptionsModal(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>Student Options</Dialog.Title>
          <Dialog.Content>
            <Text>What would you like to do with {selectedStudent?.name}?</Text>
          </Dialog.Content>
          <Dialog.Actions style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Button 
              onPress={() => {
                setShowOptionsModal(false);
                setShowEditDialog(true);
              }}
              style={{ marginBottom: 8 }}
            >
              Edit
            </Button>
            <Button 
              onPress={() => {
                setShowOptionsModal(false);
                if (selectedStudent) {
                  handleDeleteStudent(selectedStudent);
                }
              }}
              textColor="red"
              style={{ marginBottom: 8 }}
            >
              Delete
            </Button>
            <Button 
              onPress={() => setShowOptionsModal(false)}
              textColor="red"
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

// Register Tab with File Attachments
const RegisterTab: React.FC = () => {
  const [registrations, setRegistrations] = useState<WTRegistration[]>([]);
  const [students, setStudents] = useState<WTStudent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<WTRegistration | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const loadData = async () => {
    try {
      const [regData, studentsData] = await Promise.all([
        fetchRegistrations(),
        fetchStudents()
      ]);
      setRegistrations(regData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddRegistration = async (registrationData: Omit<WTRegistration, 'id'>) => {
    try {
      await addRegistration(registrationData);
      setShowAddDialog(false);
      loadData();
    } catch (error) {
      console.error('Error adding registration:', error);
      Alert.alert('Error', 'Failed to add registration');
    }
  };

  const handleUpdateRegistration = async (registration: WTRegistration) => {
    try {
      await updateRegistration(registration);
      setShowEditDialog(false);
      setSelectedRegistration(null);
      loadData();
    } catch (error) {
      console.error('Error updating registration:', error);
      Alert.alert('Error', 'Failed to update registration');
    }
  };

  const handleDeleteRegistration = async (registration: WTRegistration) => {
    Alert.alert(
      'Delete Registration',
      'Are you sure you want to delete this registration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRegistration(registration.id);
              loadData();
            } catch (error) {
              console.error('Error deleting registration:', error);
              Alert.alert('Error', 'Failed to delete registration');
            }
          },
        },
      ]
    );
  };

  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const renderRegistration = ({ item }: { item: WTRegistration }) => (
    <Card style={styles.card} mode="outlined">
              <Card.Content>
        <View style={styles.registrationHeader}>
          <View style={styles.registrationInfo}>
            <Text style={styles.registrationAmount}>${item.amount.toFixed(2)}</Text>
            <Text style={styles.registrationDate}>
              {new Date(item.paymentDate).toLocaleDateString()}
            </Text>
            <Text style={styles.registrationPeriod}>
              {item.startDate && item.endDate && 
                `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}`
              }
            </Text>
            <Text style={styles.studentName}>{getStudentName(item.studentId)}</Text>
          </View>
          <View style={styles.registrationStatus}>
            <Chip 
              mode="outlined" 
              compact 
              style={[styles.statusChip, { backgroundColor: item.isPaid ? '#4CAF50' : '#FF9800' }]}
            >
              {item.isPaid ? 'Paid' : 'Unpaid'}
            </Chip>
            {item.attachmentUri && (
              <TouchableOpacity style={styles.attachmentIcon}>
                <Ionicons name="document" size={24} color="#2196F3" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {item.notes && (
          <Text style={styles.registrationNotes}>{item.notes}</Text>
        )}
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => {
          setSelectedRegistration(item);
          setShowEditDialog(true);
        }}>Edit</Button>
        <Button onPress={() => handleDeleteRegistration(item)}>Delete</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={registrations}
        renderItem={renderRegistration}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No registrations yet</Text>
            <Text style={styles.emptySubtext}>Add your first registration to get started</Text>
          </View>
        }
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddDialog(true)}
      />

      {/* Add Registration Dialog */}
      <AddRegistrationDialog
        visible={showAddDialog}
        students={students}
        onDismiss={() => setShowAddDialog(false)}
        onSave={handleAddRegistration}
      />

      {/* Edit Registration Dialog */}
      {selectedRegistration && (
        <EditRegistrationDialog
          visible={showEditDialog}
          registration={selectedRegistration}
          students={students}
          onDismiss={() => {
            setShowEditDialog(false);
            setSelectedRegistration(null);
          }}
          onSave={handleUpdateRegistration}
        />
      )}
    </View>
  );
};

// Lessons Tab
const LessonsTab: React.FC = () => {
  const [lessons, setLessons] = useState<WTLesson[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const loadLessons = async () => {
    try {
      const data = await fetchLessons();
      setLessons(data);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  useEffect(() => {
    loadLessons();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLessons();
    setRefreshing(false);
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  const renderLesson = ({ item }: { item: WTLesson }) => (
    <Card style={styles.card} mode="outlined">
              <Card.Content>
        <Text style={styles.lessonDay}>{getDayName(item.dayOfWeek)}</Text>
                <Text style={styles.lessonTime}>
          {formatTime(item.startHour, item.startMinute)} - {formatTime(item.endHour, item.endMinute)}
                </Text>
              </Card.Content>
            </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={lessons}
        renderItem={renderLesson}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No lessons scheduled</Text>
            <Text style={styles.emptySubtext}>Add lesson schedules to get started</Text>
          </View>
        }
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddDialog(true)}
      />
    </View>
  );
};

// Seminars Tab
const SeminarsTab: React.FC = () => {
  const [seminars, setSeminars] = useState<WTSeminar[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const loadSeminars = async () => {
    try {
      const data = await fetchSeminars();
      setSeminars(data);
    } catch (error) {
      console.error('Error loading seminars:', error);
    }
  };

  useEffect(() => {
    loadSeminars();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSeminars();
    setRefreshing(false);
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const renderSeminar = ({ item }: { item: WTSeminar }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <Text style={styles.seminarName}>{item.name}</Text>
        <Text style={styles.seminarDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
        <Text style={styles.seminarTime}>
          {formatTime(item.startHour, item.startMinute)} - {formatTime(item.endHour, item.endMinute)}
        </Text>
        {item.description && (
          <Text style={styles.seminarDescription}>{item.description}</Text>
        )}
        {item.location && (
          <Text style={styles.seminarLocation}>{item.location}</Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={seminars}
        renderItem={renderSeminar}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No seminars scheduled</Text>
            <Text style={styles.emptySubtext}>Add seminar events to get started</Text>
          </View>
        }
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddDialog(true)}
      />
    </View>
  );
};

// Dialog Components
interface AddStudentDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (student: Omit<WTStudent, 'id'>) => void;
}

const AddStudentDialog: React.FC<AddStudentDialogProps> = ({ visible, onDismiss, onSave }) => {
  const theme = useTheme();
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
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: theme.colors.surface }}>
        <Dialog.Title>Add Student</Dialog.Title>
        <Dialog.Content>
          <ScrollView>
            {/* Photo Section */}
            <View style={styles.photoSection}>
              <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={32} color="#666" />
                    <Text style={styles.photoText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name *"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Instagram"
              placeholderTextColor="#999"
              value={instagram}
              onChangeText={setInstagram}
            />
            <TextInput
              style={styles.input}
              placeholder="Notes"
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSave}>Add</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

interface EditStudentDialogProps {
  visible: boolean;
  student: WTStudent;
  onDismiss: () => void;
  onSave: (student: WTStudent) => void;
}

const EditStudentDialog: React.FC<EditStudentDialogProps> = ({ visible, student, onDismiss, onSave }) => {
  const theme = useTheme();
  const [name, setName] = useState(student.name);
  const [phoneNumber, setPhoneNumber] = useState(student.phoneNumber || '');
  const [email, setEmail] = useState(student.email || '');
  const [instagram, setInstagram] = useState(student.instagram || '');
  const [notes, setNotes] = useState(student.notes || '');
  const [photoUri, setPhotoUri] = useState<string | null>(student.photoUri || null);
  const [isActive, setIsActive] = useState(student.isActive);
  const [showEditPhotoOptions, setShowEditPhotoOptions] = useState(false);
  const [showEditFullscreenPhoto, setShowEditFullscreenPhoto] = useState(false);

  // Reset form when student changes
  useEffect(() => {
    setName(student.name);
    setPhoneNumber(student.phoneNumber || '');
    setEmail(student.email || '');
    setInstagram(student.instagram || '');
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
      instagram: instagram.trim() || undefined,
      notes: notes.trim() || undefined,
      photoUri: photoUri || undefined,
      isActive,
    });
  };

      return (
      <Portal>
        <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: theme.colors.surface }}>
        <Dialog.Title>Edit Student</Dialog.Title>
        <Dialog.Content>
          <ScrollView>
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
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={32} color="#666" />
                    <Text style={styles.photoText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.photoHint}>
                {photoUri ? 'Tap to view, long press for options' : 'Tap to add photo'}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name *"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              placeholderTextColor="#999"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Instagram"
              placeholderTextColor="#999"
              value={instagram}
              onChangeText={setInstagram}
            />
            <TextInput
              style={styles.input}
              placeholder="Notes"
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
            
            {/* Active Status */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Active</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
              />
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSave}>Save</Button>
        </Dialog.Actions>
      </Dialog>

      {/* Edit Photo Options Dialog */}
      <Dialog 
        visible={showEditPhotoOptions} 
        onDismiss={() => setShowEditPhotoOptions(false)}
        style={{ backgroundColor: theme.colors.surface }}
      >
        <Dialog.Title>Photo Options</Dialog.Title>
        <Dialog.Content>
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <TouchableOpacity 
              style={styles.photoOptionButton}
              onPress={handleEditViewPhoto}
            >
              <Text style={styles.photoOptionText}>View Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.photoOptionButton}
              onPress={handleEditChangePhoto}
            >
              <Text style={styles.photoOptionText}>Change Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.photoOptionButton}
              onPress={handleEditRemovePhoto}
            >
              <Text style={[styles.photoOptionText, { color: theme.colors.error }]}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        </Dialog.Content>
      </Dialog>

      {/* Edit Fullscreen Photo Modal */}
      <Modal
        visible={showEditFullscreenPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditFullscreenPhoto(false)}
      >
                 <FullscreenImage uri={photoUri || ''} onClose={() => setShowEditFullscreenPhoto(false)} />
      </Modal>
    </Portal>
  );
};

interface AddRegistrationDialogProps {
  visible: boolean;
  students: WTStudent[];
  onDismiss: () => void;
  onSave: (registration: Omit<WTRegistration, 'id'>) => void;
}

const AddRegistrationDialog: React.FC<AddRegistrationDialogProps> = ({ visible, students, onDismiss, onSave }) => {
  const [studentId, setStudentId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);

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
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Add Registration</Dialog.Title>
        <Dialog.Content>
          <ScrollView>
            {/* Student Selection */}
            <Text style={styles.label}>Student *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.studentPicker}>
              {students.map(student => (
                <TouchableOpacity
                  key={student.id}
                  style={[styles.studentOption, studentId === student.id && styles.selectedStudent]}
                  onPress={() => setStudentId(student.id)}
                >
                  <Text style={[styles.studentOptionText, studentId === student.id && styles.selectedStudentText]}>
                    {student.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Amount *"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
            />

            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
            />

            {/* File Attachment */}
            <View style={styles.attachmentSection}>
              <TouchableOpacity onPress={() => Alert.alert('File Attachment', 'File attachment functionality is not yet implemented.')} style={styles.attachmentButton}>
                <Ionicons name="document" size={24} color="#2196F3" />
                <Text style={styles.attachmentText}>
                  {attachmentUri ? 'Document Selected' : 'Attach Document'}
                </Text>
              </TouchableOpacity>
              {attachmentUri && (
                <Text style={styles.attachmentUri}>{attachmentUri.split('/').pop()}</Text>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSave}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

interface EditRegistrationDialogProps {
  visible: boolean;
  registration: WTRegistration;
  students: WTStudent[];
  onDismiss: () => void;
  onSave: (registration: WTRegistration) => void;
}

const EditRegistrationDialog: React.FC<EditRegistrationDialogProps> = ({ visible, registration, students, onDismiss, onSave }) => {
  const [studentId, setStudentId] = useState(registration.studentId);
  const [amount, setAmount] = useState(registration.amount.toString());
  const [startDate, setStartDate] = useState(registration.startDate ? registration.startDate.toISOString().split('T')[0] : '');
  const [endDate, setEndDate] = useState(registration.endDate ? registration.endDate.toISOString().split('T')[0] : '');
  const [notes, setNotes] = useState(registration.notes || '');
  const [attachmentUri, setAttachmentUri] = useState<string | null>(registration.attachmentUri || null);
  const [isPaid, setIsPaid] = useState(registration.isPaid);

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
      ...registration,
      studentId,
      amount: amountValue,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      notes: notes.trim() || undefined,
      attachmentUri: attachmentUri || undefined,
      isPaid,
    });
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Edit Registration</Dialog.Title>
        <Dialog.Content>
          <ScrollView>
            {/* Student Selection */}
            <Text style={styles.label}>Student *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.studentPicker}>
              {students.map(student => (
                <TouchableOpacity
                  key={student.id}
                  style={[styles.studentOption, studentId === student.id && styles.selectedStudent]}
                  onPress={() => setStudentId(student.id)}
                >
                  <Text style={[styles.studentOptionText, studentId === student.id && styles.selectedStudentText]}>
                    {student.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Amount *"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
            />

            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
            />

            {/* File Attachment */}
            <View style={styles.attachmentSection}>
              <TouchableOpacity onPress={() => Alert.alert('File Attachment', 'File attachment functionality is not yet implemented.')} style={styles.attachmentButton}>
                <Ionicons name="document" size={24} color="#2196F3" />
                <Text style={styles.attachmentText}>
                  {attachmentUri ? 'Document Selected' : 'Attach Document'}
                </Text>
              </TouchableOpacity>
              {attachmentUri && (
                <Text style={styles.attachmentUri}>{attachmentUri.split('/').pop()}</Text>
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={handleSave}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export function WTRegistryScreen() {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Students') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Register') {
            iconName = focused ? 'create' : 'create-outline';
          } else if (route.name === 'Lessons') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Seminars') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Students" component={StudentsTab} />
      <Tab.Screen name="Register" component={RegisterTab} />
      <Tab.Screen name="Lessons" component={LessonsTab} />
      <Tab.Screen name="Seminars" component={SeminarsTab} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 4,
    marginBottom: 2,
    elevation: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  // Student styles
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentPhotoContainer: {
    marginRight: 16,
  },
  studentPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
    marginRight: 8,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  studentDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  studentNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 8,
  },
  // Registration styles
  registrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  registrationInfo: {
    flex: 1,
  },
  registrationAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  registrationDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  registrationPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  registrationStatus: {
    alignItems: 'flex-end',
  },
  attachmentIcon: {
    marginTop: 8,
  },
  registrationNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Lesson styles
  lessonDay: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lessonTime: {
    fontSize: 14,
    color: '#666',
  },
  // Seminar styles
  seminarName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  seminarDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  seminarTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  seminarDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  seminarLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // Dialog styles
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  photoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  photoHint: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  photoOptionButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  attachmentSection: {
    marginBottom: 16,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  attachmentText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#2196F3',
  },
  attachmentUri: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  studentPicker: {
    marginBottom: 16,
  },
  studentOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedStudent: {
    backgroundColor: '#2196F3',
  },
  studentOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedStudentText: {
    color: 'white',
  },
});