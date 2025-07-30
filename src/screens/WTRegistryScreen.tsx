import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Card, Button, Chip, Divider, FAB, Portal, Dialog } from 'react-native-paper';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { fetchStudents, addStudent, updateStudent, deleteStudent } from '../data/wtRegistry';
import { fetchRegistrations, addRegistration, updateRegistration, deleteRegistration } from '../data/wtRegistry';
import { fetchLessons, addLesson, updateLesson, deleteLesson } from '../data/wtRegistry';
import { fetchSeminars, addSeminar, updateSeminar, deleteSeminar } from '../data/wtRegistry';
import { WTStudent, WTRegistration, WTLesson, WTSeminar } from '../types/WTRegistry';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

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
  const [students, setStudents] = useState<WTStudent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<WTStudent | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const loadStudents = async () => {
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', `Failed to load students: ${error.message}`);
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

  const renderStudent = ({ item }: { item: WTStudent }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <View style={styles.studentHeader}>
          <View style={styles.studentPhotoContainer}>
            {item.photoUri ? (
              <Image source={{ uri: item.photoUri }} style={styles.studentPhoto} />
            ) : (
              <View style={styles.defaultPhoto}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentDetail}>{item.phoneNumber}</Text>
            {item.email && <Text style={styles.studentDetail}>{item.email}</Text>}
            {item.instagram && <Text style={styles.studentDetail}>@{item.instagram}</Text>}
            <Chip 
              mode="outlined" 
              compact 
              style={[styles.statusChip, { backgroundColor: item.isActive ? '#4CAF50' : '#F44336' }]}
            >
              {item.isActive ? 'Active' : 'Inactive'}
            </Chip>
          </View>
        </View>
        {item.notes && (
          <Text style={styles.studentNotes}>{item.notes}</Text>
        )}
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => {
          setSelectedStudent(item);
          setShowEditDialog(true);
        }}>Edit</Button>
        <Button onPress={() => handleDeleteStudent(item)}>Delete</Button>
      </Card.Actions>
    </Card>
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
      <Dialog visible={visible} onDismiss={onDismiss}>
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
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Instagram"
              value={instagram}
              onChangeText={setInstagram}
            />
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

interface EditStudentDialogProps {
  visible: boolean;
  student: WTStudent;
  onDismiss: () => void;
  onSave: (student: WTStudent) => void;
}

const EditStudentDialog: React.FC<EditStudentDialogProps> = ({ visible, student, onDismiss, onSave }) => {
  const [name, setName] = useState(student.name);
  const [phoneNumber, setPhoneNumber] = useState(student.phoneNumber || '');
  const [email, setEmail] = useState(student.email || '');
  const [instagram, setInstagram] = useState(student.instagram || '');
  const [notes, setNotes] = useState(student.notes || '');
  const [photoUri, setPhotoUri] = useState<string | null>(student.photoUri || null);
  const [isActive, setIsActive] = useState(student.isActive);

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
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Edit Student</Dialog.Title>
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
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Instagram"
              value={instagram}
              onChangeText={setInstagram}
            />
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
  return (
    <Tab.Navigator>
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
    margin: 8,
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
  },
  studentPhotoContainer: {
    marginRight: 16,
  },
  studentPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
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