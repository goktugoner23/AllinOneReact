import { getDb } from './firestore';
import { getDeviceId } from './deviceId';
import { collection, getDocs, query, where, Timestamp, setDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { WTStudent, WTRegistration, WTLesson, WTSeminar } from '../types/WTRegistry';

// Students CRUD
export async function fetchStudents(): Promise<WTStudent[]> {
  const db = getDb();
  const deviceId = await getDeviceId();
  
  const studentsQuery = query(
    collection(db, 'wtStudents'),
    where('deviceId', '==', deviceId),
    orderBy('name')
  );
  
  const snapshot = await getDocs(studentsQuery);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: parseInt(doc.id),
  })) as WTStudent[];
}

export async function addStudent(student: Omit<WTStudent, 'id'>): Promise<WTStudent> {
  const db = getDb();
  const deviceId = await getDeviceId();
  const id = Date.now();
  
  const newStudent: WTStudent = {
    ...student,
    id,
    deviceId,
  };
  
  await setDoc(doc(db, 'wtStudents', id.toString()), {
    ...newStudent,
    deviceId,
  });
  
  return newStudent;
}

export async function updateStudent(student: WTStudent): Promise<void> {
  const db = getDb();
  const deviceId = await getDeviceId();
  
  await updateDoc(doc(db, 'wtStudents', student.id.toString()), {
    ...student,
    deviceId,
  });
}

export async function deleteStudent(studentId: number): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'wtStudents', studentId.toString()));
}

// Registrations CRUD
export async function fetchRegistrations(): Promise<WTRegistration[]> {
  const db = getDb();
  const deviceId = await getDeviceId();
  
  const registrationsQuery = query(
    collection(db, 'wtRegistrations'),
    where('deviceId', '==', deviceId),
    orderBy('paymentDate', 'desc')
  );
  
  const snapshot = await getDocs(registrationsQuery);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: parseInt(doc.id),
      paymentDate: data.paymentDate.toDate(),
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
    };
  }) as WTRegistration[];
}

export async function addRegistration(registration: Omit<WTRegistration, 'id' | 'paymentDate'>): Promise<WTRegistration> {
  const db = getDb();
  const deviceId = await getDeviceId();
  const id = Date.now();
  const paymentDate = new Date();
  
  const newRegistration: WTRegistration = {
    ...registration,
    id,
    paymentDate,
  };
  
  await setDoc(doc(db, 'wtRegistrations', id.toString()), {
    ...newRegistration,
    deviceId,
    paymentDate: Timestamp.fromDate(paymentDate),
    startDate: registration.startDate ? Timestamp.fromDate(registration.startDate) : null,
    endDate: registration.endDate ? Timestamp.fromDate(registration.endDate) : null,
  });
  
  return newRegistration;
}

export async function updateRegistration(registration: WTRegistration): Promise<void> {
  const db = getDb();
  const deviceId = await getDeviceId();
  
  await updateDoc(doc(db, 'wtRegistrations', registration.id.toString()), {
    ...registration,
    deviceId,
    paymentDate: Timestamp.fromDate(registration.paymentDate),
    startDate: registration.startDate ? Timestamp.fromDate(registration.startDate) : null,
    endDate: registration.endDate ? Timestamp.fromDate(registration.endDate) : null,
  });
}

export async function deleteRegistration(registrationId: number): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'wtRegistrations', registrationId.toString()));
}

// Lessons CRUD
export async function fetchLessons(): Promise<WTLesson[]> {
  const db = getDb();
  const deviceId = await getDeviceId();
  
  const lessonsQuery = query(
    collection(db, 'wtLessons'),
    where('deviceId', '==', deviceId),
    orderBy('dayOfWeek'),
    orderBy('startHour')
  );
  
  const snapshot = await getDocs(lessonsQuery);
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: parseInt(doc.id),
  })) as WTLesson[];
}

export async function addLesson(lesson: Omit<WTLesson, 'id'>): Promise<WTLesson> {
  const db = getDb();
  const deviceId = await getDeviceId();
  const id = Date.now();
  
  const newLesson: WTLesson = {
    ...lesson,
    id,
  };
  
  await setDoc(doc(db, 'wtLessons', id.toString()), {
    ...newLesson,
    deviceId,
  });
  
  return newLesson;
}

export async function updateLesson(lesson: WTLesson): Promise<void> {
  const db = getDb();
  const deviceId = await getDeviceId();
  
  await updateDoc(doc(db, 'wtLessons', lesson.id.toString()), {
    ...lesson,
    deviceId,
  });
}

export async function deleteLesson(lessonId: number): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'wtLessons', lessonId.toString()));
}

// Seminars CRUD
export async function fetchSeminars(): Promise<WTSeminar[]> {
  const db = getDb();
  const deviceId = await getDeviceId();
  
  const seminarsQuery = query(
    collection(db, 'wtSeminars'),
    where('deviceId', '==', deviceId),
    orderBy('date', 'desc')
  );
  
  const snapshot = await getDocs(seminarsQuery);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: parseInt(doc.id),
      date: data.date.toDate(),
    };
  }) as WTSeminar[];
}

export async function addSeminar(seminar: Omit<WTSeminar, 'id'>): Promise<WTSeminar> {
  const db = getDb();
  const deviceId = await getDeviceId();
  const id = Date.now();
  
  const newSeminar: WTSeminar = {
    ...seminar,
    id,
  };
  
  await setDoc(doc(db, 'wtSeminars', id.toString()), {
    ...newSeminar,
    deviceId,
    date: Timestamp.fromDate(seminar.date),
  });
  
  return newSeminar;
}

export async function deleteSeminar(seminarId: number): Promise<void> {
  const db = getDb();
  await deleteDoc(doc(db, 'wtSeminars', seminarId.toString()));
} 