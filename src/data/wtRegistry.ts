import { collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { getDb } from './firebase';
import { firebaseIdManager } from './firebaseIdManager';
import { WTStudent, WTRegistration, WTLesson, WTSeminar } from '../types/WTRegistry';
import { addTransaction, fetchTransactions, deleteTransaction } from './transactions';


// Students
export async function fetchStudents(): Promise<WTStudent[]> {
  try {
    const db = getDb();
    
    // Get all students without device filtering
    const q = query(collection(db, 'students'));
    const snapshot = await getDocs(q);
    
    // Sort in memory instead of in the query
    const students = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id || parseInt(doc.id),
        name: data.name || '',
        phoneNumber: data.phoneNumber || '',
        email: data.email || undefined,
        instagram: data.instagram || undefined,
        isActive: data.isActive !== false,
        notes: data.notes || undefined,
        photoUri: data.photoUri || undefined,
      };
    });
    
    // Sort by name ascending in memory
    return students.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function addStudent(student: Omit<WTStudent, 'id'>): Promise<void> {
  try {
    const db = getDb();
    const studentId = await firebaseIdManager.getNextId('students');
    
    const studentData = {
      id: studentId,
      name: student.name,
      phoneNumber: student.phoneNumber || '',
      email: student.email || '',
      instagram: student.instagram || '',
      isActive: student.isActive !== false,
      notes: student.notes || '',
      photoUri: student.photoUri || '',
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
      photoUri: student.photoUri || '',
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
    
    // Simple query without device filtering
    const q = query(collection(db, 'registrations'));
    const snapshot = await getDocs(q);
    
    // Sort in memory instead of in the query
    const registrations = snapshot.docs.map(doc => {
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
    
    // Sort by paymentDate descending in memory
    return registrations.sort((a, b) => 
      new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

export async function addRegistration(registration: Omit<WTRegistration, 'id'>): Promise<void> {
  try {
    const db = getDb();
    const registrationId = await firebaseIdManager.getNextId('registrations');
    
    const registrationData = {
      id: registrationId,
      studentId: registration.studentId,
      amount: registration.amount,
      attachmentUri: registration.attachmentUri || '',
      startDate: registration.startDate,
      endDate: registration.endDate,
      paymentDate: registration.paymentDate,
      notes: registration.notes || '',
      isPaid: registration.isPaid,
    };
    
    await setDoc(doc(db, 'registrations', registrationId.toString()), registrationData);
  } catch (error) {
    console.error('Error adding registration:', error);
    throw error;
  }
}

export async function updateRegistration(registration: WTRegistration): Promise<void> {
  try {
    const db = getDb();
    
    const registrationData = {
      id: registration.id,
      studentId: registration.studentId,
      amount: registration.amount,
      attachmentUri: registration.attachmentUri || '',
      startDate: registration.startDate,
      endDate: registration.endDate,
      paymentDate: registration.paymentDate,
      notes: registration.notes || '',
      isPaid: registration.isPaid,
    };
    
    await setDoc(doc(db, 'registrations', registration.id.toString()), registrationData);
  } catch (error) {
    console.error('Error updating registration:', error);
    throw error;
  }
}

export async function deleteRegistration(registrationId: number): Promise<void> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, 'registrations', registrationId.toString()));
  } catch (error) {
    console.error('Error deleting registration:', error);
    throw error;
  }
}

export async function addRegistrationWithTransaction(reg: Omit<WTRegistration, 'id'>, isPaid: boolean) {
  const db = getDb();
  const deviceId = await getDeviceId();
  // Get next registration ID
  const regId = await firebaseIdManager.getNextId('registrations');
  const registration: WTRegistration = {
    ...reg,
    id: regId,
    deviceId,
  };
  // Save registration
  await setDoc(doc(db, 'registrations', regId.toString()), {
    ...registration,
    startDate: registration.startDate instanceof Date ? Timestamp.fromDate(registration.startDate) : registration.startDate,
    endDate: registration.endDate instanceof Date ? Timestamp.fromDate(registration.endDate) : registration.endDate,
    paymentDate: registration.paymentDate instanceof Date ? Timestamp.fromDate(registration.paymentDate) : registration.paymentDate,
  });
  // If paid, add a transaction
  if (isPaid && registration.amount > 0) {
    const txId = await firebaseIdManager.getNextId('transactions');
    await addTransaction({
      id: txId.toString(),
      amount: registration.amount,
      type: 'Registration',
      description: 'Course Registration',
      isIncome: true,
      date: new Date().toISOString(),
      category: 'Wing Tzun',
      relatedRegistrationId: regId,
    });
  }
}

export async function deleteRegistrationWithTransactions(registrationId: number) {
  const db = getDb();
  // Delete registration
  await deleteDoc(doc(db, 'registrations', registrationId.toString()));
  // Delete all transactions with relatedRegistrationId == registrationId
  const transactions = await fetchTransactions();
  const related = transactions.filter(t => t.relatedRegistrationId === registrationId);
  for (const tx of related) {
    await deleteTransaction(tx.id);
  }
}

// Lessons
export async function fetchLessons(): Promise<WTLesson[]> {
  try {
    const db = getDb();
    
    // Simple query without device filtering
    const q = query(collection(db, 'wtLessons'));
    
    const snapshot = await getDocs(q);
    
    // Sort in memory instead of in the query
    const lessons = snapshot.docs.map(doc => {
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
    
    // Sort by dayOfWeek ascending in memory
    return lessons.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
}

export async function addLesson(lesson: Omit<WTLesson, 'id'>): Promise<void> {
  try {
    const db = getDb();
    const lessonId = await firebaseIdManager.getNextId('wtLessons');
    
    const lessonData = {
      id: lessonId,
      dayOfWeek: lesson.dayOfWeek,
      startHour: lesson.startHour,
      startMinute: lesson.startMinute,
      endHour: lesson.endHour,
      endMinute: lesson.endMinute,
    };
    
    await setDoc(doc(db, 'wtLessons', lessonId.toString()), lessonData);
  } catch (error) {
    console.error('Error adding lesson:', error);
    throw error;
  }
}

export async function updateLesson(lesson: WTLesson): Promise<void> {
  try {
    const db = getDb();
    
    const lessonData = {
      id: lesson.id,
      dayOfWeek: lesson.dayOfWeek,
      startHour: lesson.startHour,
      startMinute: lesson.startMinute,
      endHour: lesson.endHour,
      endMinute: lesson.endMinute,
    };
    
    await setDoc(doc(db, 'wtLessons', lesson.id.toString()), lessonData);
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
}

export async function deleteLesson(lessonId: number): Promise<void> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, 'wtLessons', lessonId.toString()));
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
}

// Seminars
export async function fetchSeminars(): Promise<WTSeminar[]> {
  try {
    const db = getDb();
    
    // Simple query without device filtering
    const q = query(collection(db, 'seminars'));
    
    const snapshot = await getDocs(q);
    
    // Sort in memory instead of in the query
    const seminars = snapshot.docs.map(doc => {
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
    
    // Sort by date descending in memory
    return seminars.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error('Error fetching seminars:', error);
    return [];
  }
}

export async function addSeminar(seminar: Omit<WTSeminar, 'id'>): Promise<void> {
  try {
    const db = getDb();
    const seminarId = await firebaseIdManager.getNextId('seminars');
    
    const seminarData = {
      id: seminarId,
      name: seminar.name,
      date: seminar.date,
      startHour: seminar.startHour,
      startMinute: seminar.startMinute,
      endHour: seminar.endHour,
      endMinute: seminar.endMinute,
      description: seminar.description || '',
      location: seminar.location || '',
    };
    
    await setDoc(doc(db, 'seminars', seminarId.toString()), seminarData);
  } catch (error) {
    console.error('Error adding seminar:', error);
    throw error;
  }
}

export async function updateSeminar(seminar: WTSeminar): Promise<void> {
  try {
    const db = getDb();
    
    const seminarData = {
      id: seminar.id,
      name: seminar.name,
      date: seminar.date,
      startHour: seminar.startHour,
      startMinute: seminar.startMinute,
      endHour: seminar.endHour,
      endMinute: seminar.endMinute,
      description: seminar.description || '',
      location: seminar.location || '',
    };
    
    await setDoc(doc(db, 'seminars', seminar.id.toString()), seminarData);
  } catch (error) {
    console.error('Error updating seminar:', error);
    throw error;
  }
}

export async function deleteSeminar(seminarId: number): Promise<void> {
  try {
    const db = getDb();
    await deleteDoc(doc(db, 'seminars', seminarId.toString()));
  } catch (error) {
    console.error('Error deleting seminar:', error);
    throw error;
  }
}

