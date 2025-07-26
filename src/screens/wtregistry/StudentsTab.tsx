import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Card,
  Text,
  FAB,
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
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { addStudent, updateStudent, deleteStudent } from '../../store/wtRegistrySlice';
import { WTStudent } from '../../types/WTRegistry';

export function StudentsTab() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const { students, loading } = useSelector((state: RootState) => state.wtRegistry);

  const [showDialog, setShowDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<WTStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    instagram: '',
    isActive: true,
    notes: '',
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

  const renderStudentCard = ({ item: student }: { item: WTStudent }) => (
    <Card style={[styles.studentCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
      <Card.Content>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Text variant="titleMedium" style={styles.studentName}>
              {student.name}
            </Text>
            <View style={styles.statusContainer}>
              <Chip
                mode="outlined"
                compact
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
          <View style={styles.studentActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleOpenDialog(student)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => handleDelete(student)}
            />
          </View>
        </View>

        {student.phoneNumber && (
          <Text variant="bodyMedium" style={styles.contactInfo}>
            📞 {student.phoneNumber}
          </Text>
        )}
        {student.email && (
          <Text variant="bodyMedium" style={styles.contactInfo}>
            ✉️ {student.email}
          </Text>
        )}
        {student.instagram && (
          <Text variant="bodyMedium" style={styles.contactInfo}>
            📱 @{student.instagram}
          </Text>
        )}
        {student.notes && (
          <Text variant="bodySmall" style={styles.notes}>
            💬 {student.notes}
          </Text>
        )}
      </Card.Content>
    </Card>
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

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStudentCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => handleOpenDialog()}
      />

      <Portal>
        <Dialog visible={showDialog} onDismiss={handleCloseDialog}>
          <Dialog.Title>{editingStudent ? 'Edit Student' : 'Add Student'}</Dialog.Title>
          <Dialog.Content>
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
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            <View style={styles.switchContainer}>
              <Text variant="bodyMedium">Active</Text>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => setFormData({ ...formData, isActive: value })}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDialog}>Cancel</Button>
            <Button onPress={handleSave} mode="contained">
              {editingStudent ? 'Update' : 'Add'}
            </Button>
          </Dialog.Actions>
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
    marginBottom: 12,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
    marginRight: 8,
  },
  studentName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusContainer: {
    marginBottom: 4,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  studentActions: {
    flexDirection: 'row',
  },
  contactInfo: {
    marginBottom: 2,
    color: '#666',
  },
  notes: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#888',
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
}); 