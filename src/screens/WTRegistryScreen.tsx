import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Card, FAB, List } from 'react-native-paper';
import { fetchStudents, fetchRegistrations, fetchLessons, fetchSeminars } from '../data/wtRegistry';
import { WTStudent, WTRegistration, WTLesson, WTSeminar } from '../types/WTRegistry';

const Tab = createMaterialTopTabNavigator();

// Students Tab
const StudentsTab: React.FC = () => {
  const [students, setStudents] = useState<WTStudent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setRefreshing(true);
      const data = await fetchStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.tabContainer}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadStudents} />
        }
      >
        {students.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No students registered</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first student</Text>
          </View>
        ) : (
          students.map((student) => (
            <Card key={student.id} style={styles.card}>
              <Card.Content>
                <Text style={styles.studentName}>{student.name}</Text>
                {student.phoneNumber && (
                  <Text style={styles.studentDetail}>📞 {student.phoneNumber}</Text>
                )}
                {student.email && (
                  <Text style={styles.studentDetail}>✉️ {student.email}</Text>
                )}
                {student.instagram && (
                  <Text style={styles.studentDetail}>📷 {student.instagram}</Text>
                )}
                <Text style={[styles.studentStatus, { color: student.isActive ? '#4CAF50' : '#F44336' }]}>
                  {student.isActive ? 'Active' : 'Inactive'}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Navigate to add student screen
          console.log('Add student');
        }}
      />
    </View>
  );
};

// Lessons Tab
const LessonsTab: React.FC = () => {
  const [lessons, setLessons] = useState<WTLesson[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      setRefreshing(true);
      const data = await fetchLessons();
      setLessons(data);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.tabContainer}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadLessons} />
        }
      >
        {lessons.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No lessons scheduled</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first lesson</Text>
          </View>
        ) : (
          lessons.map((lesson) => (
            <Card key={lesson.id} style={styles.card}>
              <Card.Content>
                <Text style={styles.lessonDay}>{dayNames[lesson.dayOfWeek]}</Text>
                <Text style={styles.lessonTime}>
                  {formatTime(lesson.startHour, lesson.startMinute)} - {formatTime(lesson.endHour, lesson.endMinute)}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Navigate to add lesson screen
          console.log('Add lesson');
        }}
      />
    </View>
  );
};

// Registrations Tab
const RegistrationsTab: React.FC = () => {
  const [registrations, setRegistrations] = useState<WTRegistration[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      setRefreshing(true);
      const data = await fetchRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.tabContainer}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadRegistrations} />
        }
      >
        {registrations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No registrations found</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first registration</Text>
          </View>
        ) : (
          registrations.map((registration) => (
            <Card key={registration.id} style={styles.card}>
              <Card.Content>
                <Text style={styles.registrationAmount}>${registration.amount.toFixed(2)}</Text>
                <Text style={styles.registrationDate}>
                  Payment: {registration.paymentDate.toLocaleDateString()}
                </Text>
                {registration.startDate && registration.endDate && (
                  <Text style={styles.registrationPeriod}>
                    Period: {registration.startDate.toLocaleDateString()} - {registration.endDate.toLocaleDateString()}
                  </Text>
                )}
                <Text style={[styles.registrationStatus, { color: registration.isPaid ? '#4CAF50' : '#F44336' }]}>
                  {registration.isPaid ? 'Paid' : 'Unpaid'}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Navigate to add registration screen
          console.log('Add registration');
        }}
      />
    </View>
  );
};

// Seminars Tab
const SeminarsTab: React.FC = () => {
  const [seminars, setSeminars] = useState<WTSeminar[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSeminars();
  }, []);

  const loadSeminars = async () => {
    try {
      setRefreshing(true);
      const data = await fetchSeminars();
      setSeminars(data);
    } catch (error) {
      console.error('Error loading seminars:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.tabContainer}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadSeminars} />
        }
      >
        {seminars.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No seminars scheduled</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first seminar</Text>
          </View>
        ) : (
          seminars.map((seminar) => (
            <Card key={seminar.id} style={styles.card}>
              <Card.Content>
                <Text style={styles.seminarName}>{seminar.name}</Text>
                <Text style={styles.seminarDate}>
                  📅 {seminar.date.toLocaleDateString()}
                </Text>
                <Text style={styles.seminarTime}>
                  🕐 {formatTime(seminar.startHour, seminar.startMinute)} - {formatTime(seminar.endHour, seminar.endMinute)}
                </Text>
                {seminar.location && (
                  <Text style={styles.seminarLocation}>📍 {seminar.location}</Text>
                )}
                {seminar.description && (
                  <Text style={styles.seminarDescription}>{seminar.description}</Text>
                )}
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Navigate to add seminar screen
          console.log('Add seminar');
        }}
      />
    </View>
  );
};

export function WTRegistryScreen() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Students" component={StudentsTab} />
      <Tab.Screen name="Lessons" component={LessonsTab} />
      <Tab.Screen name="Registrations" component={RegistrationsTab} />
      <Tab.Screen name="Seminars" component={SeminarsTab} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
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
  studentStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
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
  // Registration styles
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
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
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
  seminarLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  seminarDescription: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
    fontStyle: 'italic',
  },
});