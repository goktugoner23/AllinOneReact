import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  Image,
  Platform,
  Linking,
  PanResponder,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Portal, Dialog, Switch } from 'react-native-paper';
import { AddFab } from '@shared/components';
import {
  Card as UICard,
  CardContent,
  Button,
  EmptyState,
  Avatar,
  IconButton,
  AlertDialog,
  Input,
} from '@shared/components/ui';
import { useAppTheme, spacing, radius, textStyles } from '@shared/theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { fetchStudents, addStudent, updateStudent, deleteStudent } from '@features/wtregistry/services/wtRegistry';
import {
  fetchRegistrations,
  addRegistration,
  updateRegistration,
  deleteRegistration,
  deleteRegistrationWithTransactions,
  updateRegistrationPaymentStatus,
  addRegistrationWithTransaction,
} from '@features/wtregistry/services/wtRegistry';
import { WTStudent, WTRegistration } from '@features/wtregistry/types/WTRegistry';
// import DocumentPicker, { isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import { pickDocument, isValidReceiptFile } from '@shared/utils/documentPicker';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useBalance } from '@features/transactions/store/balanceHooks';
import { LessonsTab } from '@features/wtregistry/screens/LessonsTab';
import { SeminarsTab } from '@features/wtregistry/screens/SeminarsTab';
// import { downloadAndOpenFile, isFileDownloaded, getLocalFileUri, openFile } from '../../utils/fileUtils';

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

      const distance = Math.sqrt(Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2));

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
            transform: [{ scale }],
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
    <UICard
      style={{ marginHorizontal: spacing[4], marginBottom: spacing[3] }}
      variant="elevated"
      padding="sm"
      onPress={() => {
        setSelectedStudent(item);
        setShowDetailModal(true);
      }}
      onLongPress={() => {
        setSelectedStudent(item);
        setShowOptionsModal(true);
      }}
    >
      <View style={styles.studentHeader}>
        <TouchableOpacity
          style={styles.studentPhotoContainer}
          onPress={() => {
            if (item.photoUri) {
              setSelectedStudent(item);
              setShowFullscreenPhoto(true);
            }
          }}
          activeOpacity={item.photoUri ? 0.7 : 1}
        >
          <Avatar source={item.photoUri ? { uri: item.photoUri } : undefined} name={item.name} size="lg" />
        </TouchableOpacity>
        <View style={styles.studentInfo}>
          <Text style={[textStyles.h4, { color: colors.foreground }]}>{item.name}</Text>
          {item.phoneNumber && (
            <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginTop: spacing[1] }]}>
              {item.phoneNumber}
            </Text>
          )}
        </View>
        <View
          style={[styles.statusIndicator, { backgroundColor: item.isActive ? colors.success : colors.destructive }]}
        />
      </View>
    </UICard>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlashList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingTop: spacing[3], paddingBottom: spacing[20] }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No students yet"
            description="Add your first student to get started"
            actionLabel="Add Student"
            onAction={() => setShowAddDialog(true)}
          />
        }
        estimatedItemSize={110}
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
      <Portal>
        <Dialog
          visible={showDetailModal}
          onDismiss={() => setShowDetailModal(false)}
          style={{ backgroundColor: colors.surface, borderRadius: radius.xl }}
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
                  style={{ marginBottom: spacing[4] }}
                >
                  <Avatar
                    source={selectedStudent.photoUri ? { uri: selectedStudent.photoUri } : undefined}
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
                  {selectedStudent.instagram && (
                    <Text style={[textStyles.body, { color: colors.foregroundMuted, marginBottom: spacing[2] }]}>
                      Instagram: @{selectedStudent.instagram}
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
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing[4] }}>
                  {selectedStudent.phoneNumber && (
                    <IconButton
                      icon="call"
                      size="lg"
                      variant="filled"
                      style={{ backgroundColor: colors.success }}
                      onPress={() => handleCall(selectedStudent.phoneNumber!)}
                    />
                  )}
                  {selectedStudent.phoneNumber && (
                    <IconButton
                      icon="logo-whatsapp"
                      size="lg"
                      variant="filled"
                      style={{ backgroundColor: '#25D366' }}
                      onPress={() => handleWhatsApp(selectedStudent.phoneNumber!)}
                    />
                  )}
                  {selectedStudent.instagram && (
                    <IconButton
                      icon="logo-instagram"
                      size="lg"
                      variant="filled"
                      style={{ backgroundColor: '#E4405F' }}
                      onPress={() => handleInstagram(selectedStudent.instagram!)}
                    />
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
          style={{ backgroundColor: colors.surface, borderRadius: radius.xl }}
        >
          <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Photo Options</Dialog.Title>
          <Dialog.Content>
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
          style={{ backgroundColor: colors.surface, borderRadius: radius.xl }}
        >
          <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Student Options</Dialog.Title>
          <Dialog.Content>
            <Text style={[textStyles.body, { color: colors.foregroundMuted }]}>
              What would you like to do with {selectedStudent?.name}?
            </Text>
          </Dialog.Content>
          <Dialog.Actions
            style={{ flexDirection: 'column', alignItems: 'stretch', gap: spacing[2], padding: spacing[4] }}
          >
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
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

// Register Tab with File Attachments
const RegisterTab: React.FC = () => {
  const { colors } = useAppTheme();
  const [registrations, setRegistrations] = useState<WTRegistration[]>([]);
  const [students, setStudents] = useState<WTStudent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<WTRegistration | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const { refreshBalance } = useBalance();

  // Month names array like in Kotlin app
  const monthNames = [
    'All Months',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const loadData = async () => {
    try {
      const [regData, studentsData] = await Promise.all([fetchRegistrations(), fetchStudents()]);
      setRegistrations(regData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter registrations by month like in Kotlin app
  const filteredRegistrations = useMemo(() => {
    if (selectedMonth === null) {
      return registrations;
    } else {
      return registrations.filter((registration) => {
        if (registration.startDate) {
          const startDate = new Date(registration.startDate);
          // selectedMonth is 1-based (1 = January), getMonth() is 0-based (0 = January)
          return startDate.getMonth() + 1 === selectedMonth;
        }
        return false;
      });
    }
  }, [registrations, selectedMonth]);

  // Calculate total amount for filtered registrations
  const totalAmount = filteredRegistrations.reduce((sum: number, reg: WTRegistration) => sum + reg.amount, 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddRegistration = async (registrationData: Omit<WTRegistration, 'id'>) => {
    try {
      await addRegistrationWithTransaction(registrationData, registrationData.isPaid);
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
    setSelectedRegistration(registration);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedRegistration) return;

    try {
      await deleteRegistrationWithTransactions(selectedRegistration.id);
      setShowDeleteDialog(false);
      setSelectedRegistration(null);
      loadData();
    } catch (error) {
      console.error('Error deleting registration:', error);
      Alert.alert('Error', 'Failed to delete registration');
    }
  };

  const getStudentName = (studentId: number) => {
    const student = students.find((s) => s.id === studentId);
    return student?.name || 'Unknown Student';
  };

  const handleViewAttachment = async (attachmentUri: string) => {
    try {
      setIsDownloading(true);

      // For now, use a simple approach that works with React Native
      // This will open the file URL in the device's default browser or app
      const fileName = attachmentUri.split('/').pop() || 'file';

      // Open the file directly without any confirmation
      await Linking.openURL(attachmentUri);
    } catch (error) {
      console.error('Error handling attachment:', error);
      Alert.alert('Error', 'Failed to open file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePaymentStatusToggle = async (registration: WTRegistration) => {
    try {
      const newIsPaid = !registration.isPaid;
      await updateRegistrationPaymentStatus(registration, newIsPaid, registration.isPaid);
      await loadData(); // Reload data to reflect changes
      refreshBalance(); // Refresh balance to reflect transaction changes
    } catch (error) {
      console.error('Error toggling payment status:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const renderRegistration = ({ item }: { item: WTRegistration }) => (
    <UICard
      style={{ marginHorizontal: spacing[4], marginBottom: spacing[3] }}
      variant="elevated"
      padding="md"
      onPress={() => {
        setSelectedRegistration(item);
        setShowDetailsDialog(true);
      }}
      onLongPress={() => {
        setSelectedRegistration(item);
        setShowContextMenu(true);
      }}
    >
      {/* Header Row: Student Name and Status Chip */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[2],
        }}
      >
        <Text style={[textStyles.h4, { color: colors.foreground, flex: 1, marginRight: spacing[2] }]}>
          {getStudentName(item.studentId)}
        </Text>
        <TouchableOpacity
          onPress={() => handlePaymentStatusToggle(item)}
          style={{
            backgroundColor: item.isPaid ? colors.success : colors.warning,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1.5],
            borderRadius: radius.full,
            alignSelf: 'flex-start',
          }}
        >
          <Text
            style={[
              textStyles.labelSmall,
              {
                color: item.isPaid ? colors.successForeground : colors.warningForeground,
                fontWeight: '600',
              },
            ]}
          >
            {item.isPaid ? 'Paid' : 'Unpaid'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <Text style={[textStyles.amountSmall, { color: colors.primary, marginBottom: spacing[1] }]}>
        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(item.amount)}
      </Text>

      {/* Date Information */}
      {item.startDate && (
        <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[0.5] }]}>
          Start: {new Date(item.startDate).toLocaleDateString()}
        </Text>
      )}
      {item.endDate && (
        <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[0.5] }]}>
          End: {new Date(item.endDate).toLocaleDateString()}
        </Text>
      )}

      {/* Notes */}
      {item.notes && (
        <Text
          style={[textStyles.caption, { color: colors.foregroundSubtle, fontStyle: 'italic', marginTop: spacing[2] }]}
        >
          {item.notes}
        </Text>
      )}

      {/* Attachment Indicator */}
      {item.attachmentUri && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing[2] }}>
          <IconButton
            icon={isDownloading ? 'hourglass' : 'document'}
            size="sm"
            variant="ghost"
            color={isDownloading ? colors.foregroundSubtle : colors.primary}
            onPress={() => handleViewAttachment(item.attachmentUri!)}
            disabled={isDownloading}
          />
          <Text style={[textStyles.caption, { color: colors.foregroundMuted, marginLeft: spacing[1] }]}>
            {isDownloading ? 'Opening...' : 'Receipt attached'}
          </Text>
        </View>
      )}
    </UICard>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Section */}
      <UICard
        style={{ marginHorizontal: spacing[4], marginTop: spacing[4], marginBottom: spacing[2] }}
        variant="elevated"
      >
        <Text style={[textStyles.label, { color: colors.foreground, marginBottom: spacing[3] }]}>Filters</Text>

        {/* Month Filter Dropdown */}
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing[3],
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.surface,
          }}
          onPress={() => setShowMonthPicker(true)}
        >
          <Text style={[textStyles.body, { color: colors.foreground }]}>{monthNames[selectedMonth || 0]}</Text>
          <Ionicons name="chevron-down" size={20} color={colors.foregroundMuted} />
        </TouchableOpacity>

        {/* Total Amount Display */}
        <View
          style={{ marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: colors.border }}
        >
          <Text style={[textStyles.label, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
            Total Amount
          </Text>
          <Text
            style={[
              textStyles.amount,
              {
                color: totalAmount < 10000 ? colors.destructive : totalAmount < 20000 ? colors.warning : colors.success,
              },
            ]}
          >
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(totalAmount)}
          </Text>
        </View>
      </UICard>

      <FlashList
        data={filteredRegistrations}
        renderItem={renderRegistration}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingTop: spacing[3], paddingBottom: spacing[20] }}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title={selectedMonth ? `No registrations in ${monthNames[selectedMonth]}` : 'No registrations yet'}
            description={
              selectedMonth
                ? 'Try selecting a different month or add a new registration'
                : 'Add your first registration to get started'
            }
            actionLabel="Add Registration"
            onAction={() => setShowAddDialog(true)}
          />
        }
        estimatedItemSize={120}
      />

      <AddFab style={styles.fab} onPress={() => setShowAddDialog(true)} />

      {/* Context Menu */}
      <Portal>
        <Dialog
          visible={showContextMenu}
          onDismiss={() => setShowContextMenu(false)}
          style={{ backgroundColor: colors.surface, borderRadius: radius.xl }}
        >
          <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Registration Options</Dialog.Title>
          <Dialog.Content>
            <Text style={[textStyles.body, { color: colors.foregroundMuted }]}>
              What would you like to do with this registration?
            </Text>
          </Dialog.Content>
          <Dialog.Actions
            style={{ flexDirection: 'column', alignItems: 'stretch', gap: spacing[2], padding: spacing[4] }}
          >
            <Button
              variant="outline"
              fullWidth
              onPress={() => {
                setShowContextMenu(false);
                setShowEditDialog(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              fullWidth
              onPress={() => {
                setShowContextMenu(false);
                handleDeleteRegistration(selectedRegistration!);
              }}
            >
              Delete
            </Button>
            <Button variant="ghost" fullWidth onPress={() => setShowContextMenu(false)}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        visible={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Registration"
        description={`Are you sure you want to delete this registration for ${getStudentName(selectedRegistration?.studentId || 0)}? This will also delete any related transactions.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Details Dialog */}
      <Portal>
        <Dialog
          visible={showDetailsDialog}
          onDismiss={() => setShowDetailsDialog(false)}
          style={{ backgroundColor: colors.surface, borderRadius: radius.xl }}
        >
          <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Registration Details</Dialog.Title>
          <Dialog.Content>
            {selectedRegistration && (
              <View>
                <Text style={[textStyles.h4, { color: colors.foreground, marginBottom: spacing[2] }]}>
                  {getStudentName(selectedRegistration.studentId)}
                </Text>
                <Text style={[textStyles.amountSmall, { color: colors.primary, marginBottom: spacing[2] }]}>
                  {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(
                    selectedRegistration.amount,
                  )}
                </Text>
                <Text style={[textStyles.body, { color: colors.foreground, marginBottom: spacing[1] }]}>
                  Status: {selectedRegistration.isPaid ? 'Paid' : 'Unpaid'}
                </Text>
                <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
                  Payment Date: {new Date(selectedRegistration.paymentDate).toLocaleDateString()}
                </Text>
                {selectedRegistration.startDate && (
                  <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
                    Start: {new Date(selectedRegistration.startDate).toLocaleDateString()}
                  </Text>
                )}
                {selectedRegistration.endDate && (
                  <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
                    End: {new Date(selectedRegistration.endDate).toLocaleDateString()}
                  </Text>
                )}
                {selectedRegistration.notes && (
                  <Text style={[textStyles.bodySmall, { color: colors.foregroundMuted, marginBottom: spacing[1] }]}>
                    Notes: {selectedRegistration.notes}
                  </Text>
                )}
                {selectedRegistration.attachmentUri && (
                  <View
                    style={{
                      marginTop: spacing[4],
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={[textStyles.body, { color: colors.foreground }]}>Receipt: Attached</Text>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={isDownloading}
                      disabled={isDownloading}
                      onPress={() => {
                        setShowDetailsDialog(false);
                        handleViewAttachment(selectedRegistration.attachmentUri!);
                      }}
                    >
                      {isDownloading ? 'Opening...' : 'View Receipt'}
                    </Button>
                  </View>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions style={{ gap: spacing[2], padding: spacing[4] }}>
            <Button variant="ghost" onPress={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              onPress={() => {
                setShowDetailsDialog(false);
                setShowEditDialog(true);
              }}
            >
              Edit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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

      {/* Month Picker Dialog */}
      <Portal>
        <Dialog
          visible={showMonthPicker}
          onDismiss={() => setShowMonthPicker(false)}
          style={{ backgroundColor: colors.surface, borderRadius: radius.xl }}
        >
          <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Select Month</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 300 }}>
              {monthNames.map((month, index) => {
                const isSelected = selectedMonth === index || (index === 0 && selectedMonth === null);
                return (
                  <TouchableOpacity
                    key={index}
                    style={{
                      padding: spacing[4],
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                      backgroundColor: isSelected ? colors.primaryMuted : 'transparent',
                      borderRadius: isSelected ? radius.md : 0,
                    }}
                    onPress={() => {
                      setSelectedMonth(index === 0 ? null : index);
                      setShowMonthPicker(false);
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
                      {month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions style={{ padding: spacing[4] }}>
            <Button variant="ghost" onPress={() => setShowMonthPicker(false)}>
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: colors.surface, maxHeight: '80%', borderRadius: radius.xl }}
      >
        <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Add Student</Dialog.Title>
        <Dialog.Content>
          <ScrollView style={{ maxHeight: 400 }}>
            {/* Photo Section */}
            <View style={styles.photoSection}>
              <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                ) : (
                  <View
                    style={[styles.photoPlaceholder, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  >
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
        </Dialog.Content>
        <Dialog.Actions style={{ gap: spacing[2], padding: spacing[4] }}>
          <Button variant="ghost" onPress={onDismiss}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave}>
            Add
          </Button>
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
  const { colors } = useAppTheme();
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

  const handleEditDownloadFromInstagram = async () => {
    setShowEditPhotoOptions(false);

    if (!instagram.trim()) {
      Alert.alert('Error', 'Please enter an Instagram handle first');
      return;
    }

    try {
      Alert.alert('Downloading...', 'Fetching profile picture from Instagram');

      const { instagramApiService } = await import('@features/instagram/services/InstagramApiService');
      const response = await instagramApiService.getProfilePicture(instagram.trim());

      if (response.success && response.data?.imageUrl) {
        setPhotoUri(response.data.imageUrl);
        Alert.alert('Success', 'Instagram profile picture downloaded successfully!');
      } else {
        Alert.alert('Error', 'Instagram profile not found or not accessible');
      }
    } catch (error) {
      console.error('Error downloading Instagram profile picture:', error);
      Alert.alert('Error', 'Failed to download Instagram profile picture. Please check the username and try again.');
    }
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
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: colors.surface, maxHeight: '80%', borderRadius: radius.xl }}
      >
        <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Edit Student</Dialog.Title>
        <Dialog.Content>
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
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                ) : (
                  <View
                    style={[styles.photoPlaceholder, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  >
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

            {/* Active Status */}
            <View style={styles.switchContainer}>
              <Text style={[textStyles.body, { color: colors.foreground }]}>Active</Text>
              <Switch value={isActive} onValueChange={setIsActive} />
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions style={{ gap: spacing[2], padding: spacing[4] }}>
          <Button variant="ghost" onPress={onDismiss}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>

      {/* Edit Photo Options Dialog */}
      <Dialog
        visible={showEditPhotoOptions}
        onDismiss={() => setShowEditPhotoOptions(false)}
        style={{ backgroundColor: colors.surface, borderRadius: radius.xl }}
      >
        <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Photo Options</Dialog.Title>
        <Dialog.Content>
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
            {instagram.trim() && (
              <Button variant="secondary" fullWidth onPress={handleEditDownloadFromInstagram}>
                Download from Instagram
              </Button>
            )}
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
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: colors.surface, maxHeight: '80%', borderRadius: radius.xl }}
      >
        <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Add Registration</Dialog.Title>
        <Dialog.Content>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing[2] }}>
              <Switch value={isPaid} onValueChange={setIsPaid} />
              <Text style={[textStyles.body, { marginLeft: spacing[2], color: colors.foreground }]}>Paid</Text>
            </View>

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
        </Dialog.Content>
        <Dialog.Actions style={{ gap: spacing[2], padding: spacing[4] }}>
          <Button variant="ghost" onPress={onDismiss}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave}>
            Save
          </Button>
        </Dialog.Actions>
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
      {showStudentPicker && (
        <Portal>
          <Dialog
            visible={showStudentPicker}
            onDismiss={() => setShowStudentPicker(false)}
            style={{ backgroundColor: colors.surface, borderRadius: radius.xl }}
          >
            <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Select Student</Dialog.Title>
            <Dialog.Content>
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
            </Dialog.Content>
            <Dialog.Actions style={{ padding: spacing[4] }}>
              <Button variant="ghost" onPress={() => setShowStudentPicker(false)}>
                Cancel
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
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

// Helper to convert string | Date to Date
const toDateValue = (date: string | Date): Date => {
  if (typeof date === 'string') return new Date(date);
  return date;
};

const EditRegistrationDialog: React.FC<EditRegistrationDialogProps> = ({
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
        // Use the new function to handle payment status change
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
        // Close dialog and reload data after payment status change
        onDismiss();
      } else {
        // Regular update without payment status change
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
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={{ backgroundColor: colors.surface, maxHeight: '80%', borderRadius: radius.xl }}
      >
        <Dialog.Title style={[textStyles.h4, { color: colors.foreground }]}>Edit Registration</Dialog.Title>
        <Dialog.Content>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing[2] }}>
              <Switch value={isPaid} onValueChange={setIsPaid} />
              <Text style={[textStyles.body, { marginLeft: spacing[2], color: colors.foreground }]}>Paid</Text>
            </View>

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
        </Dialog.Content>
        <Dialog.Actions style={{ gap: spacing[2], padding: spacing[4] }}>
          <Button variant="ghost" onPress={onDismiss}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave}>
            Save
          </Button>
        </Dialog.Actions>
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
    </Portal>
  );
};

export function WTRegistryScreen() {
  const { colors } = useAppTheme();

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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.foregroundSubtle,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
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
  studentInfo: {
    flex: 1,
    marginRight: 8,
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 8,
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  photoOptionButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
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
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10, // Add some padding to the top
  },
});
