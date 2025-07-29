import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  setDoc
} from 'firebase/firestore';
import { getDb } from './firestore';
import { getDeviceId } from './deviceId';
import { WTStudent, WTRegistration, WTLesson, WTSeminar } from '../types/WTRegistry';

let nextStudentId = 1;
let nextRegistrationId = 1;
let nextLessonId = 1;
let nextSeminarId = 1;

// Get next sequential ID for students
async function getNextStudentId(): Promise<number> {
  const db = getDb();
  
  try {
    const q = query(
      collection(db, 'students'),
      orderBy('id', 'desc')
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const lastDoc = snapshot.docs[0];
      const lastId = lastDoc.data().id || 0;
      nextStudentId = lastId + 1;
    }
  } catch (error) {
    console.warn('Failed to get last student ID, using fallback:', error);
  }
  
  return nextStudentId++;
}

// Students
export async function fetchStudents(): Promise<WTStudent[]> {
  try {
    const db = getDb();
    
    const q = query(
      collection(db, 'students'),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id || parseInt(doc.id),
        name: data.name || '',
        phoneNumber: data.phoneNumber || undefined,
        email: data.email || undefined,
        instagram: data.instagram || undefined,
        isActive: data.isActive !== false, // Default to true
        deviceId: data.deviceId || undefined,
        notes: data.notes || undefined,
        photoUri: data.photoUri || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function addStudent(student: Omit<WTStudent, 'id'>): Promise<void> {
  try {
    const db = getDb();
    const studentId = await getNextStudentId();
    
    const studentData = {
      id: studentId,
      name: student.name,
      phoneNumber: student.phoneNumber || '',
      email: student.email || '',
      instagram: student.instagram || '',
      isActive: student.isActive !== false,
      notes: student.notes || '',
      photoUri: student.photoUri || ''
    };
    
    await setDoc(doc(db, 'students', studentId.toString()), studentData);
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
}

export async function updateStudent(student: WTStudent): Promise<void> {
  try {
    const db = getDb();
    
    const studentData = {
      id: student.id,
      name: student.name,
      phoneNumber: student.phoneNumber || '',
      email: student.email || '',
      instagram: student.instagram || '',
      isActive: student.isActive !== false,
      notes: student.notes || '',
      photoUri: student.photoUri || ''
    };
    
    await setDoc(doc(db, 'students', student.id.toString()), studentData);
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
}

export async function deleteStudent(studentId: number): Promise<void> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, 'students', studentId.toString()));
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
}

// Registrations
export async function fetchRegistrations(): Promise<WTRegistration[]> {
  try {
    const db = getDb();
    const deviceId = await getDeviceId();
    
    const q = query(
      collection(db, 'registrations'),
      where('deviceId', '==', deviceId),
      orderBy('paymentDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id || parseInt(doc.id),
        studentId: data.studentId || 0,
        amount: data.amount || 0,
        attachmentUri: data.attachmentUri || undefined,
        startDate: data.startDate ? data.startDate.toDate() : undefined,
        endDate: data.endDate ? data.endDate.toDate() : undefined,
        paymentDate: data.paymentDate ? data.paymentDate.toDate() : new Date(),
        notes: data.notes || undefined,
        isPaid: data.isPaid !== false,
        studentName: data.studentName || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

// Lessons
export async function fetchLessons(): Promise<WTLesson[]> {
  try {
    const db = getDb();
    const deviceId = await getDeviceId();
    
    const q = query(
      collection(db, 'wtLessons'),
      where('deviceId', '==', deviceId),
      orderBy('dayOfWeek', 'asc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id || parseInt(doc.id),
        dayOfWeek: data.dayOfWeek || 0,
        startHour: data.startHour || 0,
        startMinute: data.startMinute || 0,
        endHour: data.endHour || 0,
        endMinute: data.endMinute || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
}

// Seminars
export async function fetchSeminars(): Promise<WTSeminar[]> {
  try {
    const db = getDb();
    const deviceId = await getDeviceId();
    
    const q = query(
      collection(db, 'seminars'),
      where('deviceId', '==', deviceId),
      orderBy('date', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id || parseInt(doc.id),
        name: data.name || '',
        date: data.date ? data.date.toDate() : new Date(),
        startHour: data.startHour || 0,
        startMinute: data.startMinute || 0,
        endHour: data.endHour || 0,
        endMinute: data.endMinute || 0,
        description: data.description || undefined,
        location: data.location || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching seminars:', error);
    return [];
  }
}