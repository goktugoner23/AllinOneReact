import { collection, doc, getDocs, setDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getDb, getStorageInstance as getStorage } from '@shared/services/firebase/firebase';
import { firebaseIdManager } from '@shared/services/firebase/firebaseIdManager';
import { WTStudent, WTRegistration, WTLesson, WTSeminar } from '@features/wtregistry/types/WTRegistry';
import {
  addTransaction,
  fetchTransactions,
  deleteTransaction,
  updateTransaction,
} from '@features/transactions/services/transactions';

// Helper to convert string | Date to Date for Timestamp.fromDate()
const toDateObj = (date: Date | string): Date => {
  if (typeof date === 'string') return new Date(date);
  return date;
};

// Students
export async function fetchStudents(): Promise<WTStudent[]> {
  try {
    const db = getDb();

    // Get all students without device filtering
    const q = query(collection(db, 'students'));
    const snapshot = await getDocs(q);

    // Sort in memory instead of in the query
    const students = snapshot.docs.map((doc) => {
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

export async function addStudent(student: Omit<WTStudent, 'id'>): Promise<WTStudent> {
  try {
    const db = getDb();
    const studentId = await firebaseIdManager.getNextId('students');

    const studentData: WTStudent = {
      id: studentId,
      name: student.name,
      phoneNumber: student.phoneNumber || undefined,
      email: student.email || undefined,
      instagram: student.instagram || undefined,
      isActive: student.isActive !== false,
      notes: student.notes || undefined,
      photoUri: student.photoUri || undefined,
    };

    await setDoc(doc(db, 'students', studentId.toString()), studentData);
    return studentData;
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
      phoneNumber: student.phoneNumber || null,
      email: student.email || null,
      instagram: student.instagram || null,
      isActive: student.isActive !== false,
      notes: student.notes || null,
      photoUri: student.photoUri || null,
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
    const registrations = snapshot.docs.map((doc) => {
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
    return registrations.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

// File upload utility function
export async function uploadFileToStorage(
  fileUri: string,
  folderName: string,
  fileName: string,
): Promise<string | null> {
  try {
    const storage = getStorage();
    const storageRef = ref(storage, `${folderName}/${fileName}`);

    // Convert file URI to blob
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Upload to Firebase Storage
    const snapshot = await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

// File deletion utility function
export async function deleteFileFromStorage(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl.startsWith('https://')) {
      return true; // Not a cloud URL, nothing to delete
    }

    const storage = getStorage();
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

export async function addRegistration(registration: Omit<WTRegistration, 'id'>): Promise<WTRegistration> {
  try {
    const db = getDb();
    const registrationId = await firebaseIdManager.getNextId('registrations');

    // Ensure end date has time set to 22:00 (10pm) like Kotlin app
    let finalEndDate = registration.endDate;
    if (finalEndDate) {
      const calendar = new Date(finalEndDate);
      calendar.setHours(22, 0, 0, 0);
      finalEndDate = calendar;
    }

    // Handle file upload if there's an attachment
    let cloudAttachmentUrl: string | null = null;
    if (registration.attachmentUri && !registration.attachmentUri.startsWith('https://')) {
      // Upload the file to Firebase Storage using registration ID for subfolder
      cloudAttachmentUrl = await uploadFileToStorage(
        registration.attachmentUri,
        'registrations',
        `${registrationId}.${registration.attachmentUri.split('.').pop() || 'file'}`,
      );

      if (cloudAttachmentUrl === null) {
        console.warn('Failed to upload attachment, but registration will be saved');
      }
    } else {
      cloudAttachmentUrl = registration.attachmentUri || null;
    }

    const registrationData = {
      id: registrationId,
      studentId: registration.studentId,
      amount: registration.amount,
      attachmentUri: cloudAttachmentUrl || null,
      startDate: registration.startDate ? Timestamp.fromDate(toDateObj(registration.startDate)) : null,
      endDate: finalEndDate ? Timestamp.fromDate(toDateObj(finalEndDate)) : null,
      paymentDate: Timestamp.fromDate(toDateObj(registration.paymentDate)),
      notes: registration.notes || null,
      isPaid: registration.isPaid,
    };

    await setDoc(doc(db, 'registrations', registrationId.toString()), registrationData);

    // If it's marked as paid, also add a transaction like Kotlin app
    if (registration.isPaid && registration.amount > 0) {
      await addTransaction({
        amount: registration.amount,
        type: 'Registration',
        description: 'Course Registration',
        isIncome: true,
        date: new Date().toISOString(),
        category: 'Wing Tzun',
        relatedRegistrationId: registrationId,
      });
    }

    // Add end date to calendar if available like Kotlin app
    if (finalEndDate) {
      const students = await fetchStudents();
      const studentName = students.find((s) => s.id === registration.studentId)?.name || 'Unknown Student';
      const title = `Registration End: ${studentName}`;
      const description = `Registration period ending for ${studentName}. Amount: ${registration.amount}`;

      // TODO: Add calendar event creation when calendar functionality is implemented
      // const event = {
      //   id: registrationId,
      //   title,
      //   description,
      //   date: finalEndDate,
      //   type: 'Registration End'
      // };
      // await addEvent(event);
    }

    return {
      ...registration,
      id: registrationId,
      endDate: finalEndDate,
      attachmentUri: cloudAttachmentUrl || registration.attachmentUri,
    };
  } catch (error) {
    console.error('Error adding registration:', error);
    throw error;
  }
}

export async function updateRegistration(registration: WTRegistration): Promise<void> {
  try {
    const db = getDb();

    // Get original registration to check if payment status changed
    const originalRegistrations = await fetchRegistrations();
    const originalRegistration = originalRegistrations.find((r) => r.id === registration.id);

    // Ensure end date has time set to 22:00 (10pm) like Kotlin app
    let finalEndDate = registration.endDate;
    if (finalEndDate) {
      const calendar = new Date(finalEndDate);
      calendar.setHours(22, 0, 0, 0);
      finalEndDate = calendar;
    }

    // Handle file upload if attachment has changed
    let cloudAttachmentUrl: string | undefined = registration.attachmentUri;
    const isNewAttachment =
      originalRegistration &&
      originalRegistration.attachmentUri !== registration.attachmentUri &&
      registration.attachmentUri &&
      !registration.attachmentUri.startsWith('https://');

    if (isNewAttachment) {
      // Upload the new file with registration ID for subfolder
      const uploadedUrl = await uploadFileToStorage(
        registration.attachmentUri!,
        'registrations',
        `${registration.id}.${registration.attachmentUri!.split('.').pop() || 'file'}`,
      );

      if (uploadedUrl === null) {
        console.warn('Failed to upload new attachment, continuing with registration update');
        cloudAttachmentUrl = registration.attachmentUri;
      } else {
        cloudAttachmentUrl = uploadedUrl;
        // Delete the old file if it was a cloud URL
        if (originalRegistration?.attachmentUri && originalRegistration.attachmentUri.startsWith('https://')) {
          await deleteFileFromStorage(originalRegistration.attachmentUri);
        }
      }
    }

    const registrationData = {
      id: registration.id,
      studentId: registration.studentId,
      amount: registration.amount,
      attachmentUri: cloudAttachmentUrl || null,
      startDate: registration.startDate ? Timestamp.fromDate(toDateObj(registration.startDate)) : null,
      endDate: finalEndDate ? Timestamp.fromDate(toDateObj(finalEndDate)) : null,
      paymentDate: Timestamp.fromDate(toDateObj(registration.paymentDate)),
      notes: registration.notes || '',
      isPaid: registration.isPaid,
    };

    await setDoc(doc(db, 'registrations', registration.id.toString()), registrationData);

    // Check for payment status changes and amount changes like Kotlin app
    if (originalRegistration) {
      console.log(
        `🔍 Registration update - ID: ${registration.id}, Payment: ${originalRegistration.isPaid} → ${registration.isPaid}, Amount: ${originalRegistration.amount} → ${registration.amount}`,
      );

      // Payment status changed from unpaid to paid
      if (!originalRegistration.isPaid && registration.isPaid && registration.amount > 0) {
        console.log(
          `💰 Creating transaction for newly paid registration ${registration.id} - Amount: ${registration.amount}`,
        );
        await addTransaction({
          amount: registration.amount,
          type: 'Registration',
          description: 'Course Registration',
          isIncome: true,
          date: new Date().toISOString(),
          category: 'Wing Tzun',
          relatedRegistrationId: registration.id,
        });
      }
      // Payment status changed from paid to unpaid
      else if (originalRegistration.isPaid && !registration.isPaid) {
        console.log(`❌ Removing transaction for unpaid registration ${registration.id}`);
        const transactions = await fetchTransactions();
        const relatedTransactions = transactions.filter((t) => t.relatedRegistrationId === registration.id);
        for (const tx of relatedTransactions) {
          await deleteTransaction(tx.id);
        }
      }
      // Amount changed but payment status remains the same
      else if (
        originalRegistration.isPaid &&
        registration.isPaid &&
        originalRegistration.amount !== registration.amount
      ) {
        console.log(
          `📊 Amount changed for paid registration ${registration.id} - ${originalRegistration.amount} → ${registration.amount}`,
        );
        // Update existing transaction amount if it exists
        const transactions = await fetchTransactions();
        const existingTransaction = transactions.find((t) => t.relatedRegistrationId === registration.id);
        if (existingTransaction) {
          // Update the existing transaction with new amount
          console.log(
            `🔄 Updating existing transaction ${existingTransaction.id} amount from ${existingTransaction.amount} to ${registration.amount}`,
          );
          await updateTransaction({
            ...existingTransaction,
            amount: registration.amount,
          });
        } else {
          // If no existing transaction but registration is paid, create one
          // This handles the case where a transaction might have been deleted manually
          console.log(
            `➕ Creating new transaction for paid registration ${registration.id} with amount ${registration.amount}`,
          );
          await addTransaction({
            amount: registration.amount,
            type: 'Registration',
            description: 'Course Registration',
            isIncome: true,
            date: new Date().toISOString(),
            category: 'Wing Tzun',
            relatedRegistrationId: registration.id,
          });
        }
      }
    }

    // TODO: Update calendar event if end date changed
    // if (originalRegistration && originalRegistration.endDate !== finalEndDate) {
    //   // Update calendar event
    // }
  } catch (error) {
    console.error('Error updating registration:', error);
    throw error;
  }
}

export async function updateRegistrationPaymentStatus(
  registration: WTRegistration,
  newIsPaid: boolean,
  oldIsPaid: boolean,
): Promise<void> {
  try {
    const db = getDb();

    // If payment status didn't change, do nothing
    if (newIsPaid === oldIsPaid) {
      return;
    }

    // Handle transaction changes first
    if (newIsPaid && !oldIsPaid) {
      // Changed from unpaid to paid - add transaction
      if (registration.amount > 0) {
        console.log(
          `💰 Payment status change: Creating transaction for registration ${registration.id} - Amount: ${registration.amount}`,
        );
        await addTransaction({
          amount: registration.amount,
          type: 'Registration',
          description: 'Course Registration',
          isIncome: true,
          date: new Date().toISOString(),
          category: 'Wing Tzun',
          relatedRegistrationId: registration.id,
        });
      }
    } else if (!newIsPaid && oldIsPaid) {
      // Changed from paid to unpaid - remove transaction
      console.log(`❌ Payment status change: Removing transaction for registration ${registration.id}`);
      const transactions = await fetchTransactions();
      const relatedTransaction = transactions.find((t) => t.relatedRegistrationId === registration.id);
      if (relatedTransaction) {
        await deleteTransaction(relatedTransaction.id);
      }
    }

    // Now update the registration without triggering transaction logic again
    const registrationData = {
      id: registration.id,
      studentId: registration.studentId,
      amount: registration.amount,
      attachmentUri: registration.attachmentUri,
      startDate: registration.startDate ? Timestamp.fromDate(toDateObj(registration.startDate)) : null,
      endDate: registration.endDate ? Timestamp.fromDate(toDateObj(registration.endDate)) : null,
      paymentDate: Timestamp.fromDate(toDateObj(registration.paymentDate)),
      notes: registration.notes || '',
      isPaid: newIsPaid,
    };

    await setDoc(doc(db, 'registrations', registration.id.toString()), registrationData);
  } catch (error) {
    console.error('Error updating registration payment status:', error);
    throw error;
  }
}

export async function deleteRegistration(registrationId: number): Promise<void> {
  try {
    const db = getDb();

    // Get the registration to check for attachments
    const registrations = await fetchRegistrations();
    const registration = registrations.find((r) => r.id === registrationId);

    // Delete attachment from Firebase Storage if it exists
    if (registration?.attachmentUri && registration.attachmentUri.startsWith('https://')) {
      await deleteFileFromStorage(registration.attachmentUri);
    }

    // Delete related transactions
    const transactions = await fetchTransactions();
    const relatedTransactions = transactions.filter((t) => t.relatedRegistrationId === registrationId);
    for (const tx of relatedTransactions) {
      await deleteTransaction(tx.id);
    }

    // Delete the registration
    await deleteDoc(doc(db, 'registrations', registrationId.toString()));

    // TODO: Delete calendar event if it exists
    // await deleteEvent(registrationId);
  } catch (error) {
    console.error('Error deleting registration:', error);
    throw error;
  }
}

export async function addRegistrationWithTransaction(reg: Omit<WTRegistration, 'id'>, isPaid: boolean) {
  try {
    const db = getDb();

    // Get next registration ID using Firebase ID manager
    const regId = await firebaseIdManager.getNextId('registrations');

    // Ensure end date has time set to 22:00 (10pm) like Kotlin app
    let finalEndDate = reg.endDate;
    if (finalEndDate) {
      const calendar = new Date(finalEndDate);
      calendar.setHours(22, 0, 0, 0);
      finalEndDate = calendar;
    }

    // Handle file upload if there's an attachment
    let cloudAttachmentUrl: string | null = null;
    if (reg.attachmentUri && !reg.attachmentUri.startsWith('https://')) {
      // Upload the file to Firebase Storage using registration ID for subfolder
      cloudAttachmentUrl = await uploadFileToStorage(
        reg.attachmentUri,
        'registrations',
        `${regId}.${reg.attachmentUri.split('.').pop() || 'file'}`,
      );

      if (cloudAttachmentUrl === null) {
        console.warn('Failed to upload attachment, but registration will be saved');
      }
    } else {
      cloudAttachmentUrl = reg.attachmentUri || null;
    }

    const registrationData = {
      id: regId,
      studentId: reg.studentId,
      amount: reg.amount,
      attachmentUri: cloudAttachmentUrl || null,
      startDate: reg.startDate ? Timestamp.fromDate(toDateObj(reg.startDate)) : null,
      endDate: finalEndDate ? Timestamp.fromDate(toDateObj(finalEndDate)) : null,
      paymentDate: Timestamp.fromDate(toDateObj(reg.paymentDate)),
      notes: reg.notes || null,
      isPaid: reg.isPaid,
    };

    // Save registration
    await setDoc(doc(db, 'registrations', regId.toString()), registrationData);

    // If paid, add a transaction
    if (isPaid && reg.amount > 0) {
      await addTransaction({
        amount: reg.amount,
        type: 'Registration',
        description: 'Course Registration',
        isIncome: true,
        date: new Date().toISOString(),
        category: 'Wing Tzun',
        relatedRegistrationId: regId,
      });
    }
  } catch (error) {
    console.error('Error adding registration with transaction:', error);
    throw error;
  }
}

export async function deleteRegistrationWithTransactions(registrationId: number) {
  try {
    const db = getDb();

    // First, get the registration to check if it was paid
    const registrations = await fetchRegistrations();
    const registration = registrations.find((r) => r.id === registrationId);

    // Delete all transactions with relatedRegistrationId == registrationId FIRST
    const transactions = await fetchTransactions();
    const related = transactions.filter((t) => t.relatedRegistrationId === registrationId);

    for (const tx of related) {
      await deleteTransaction(tx.id);
    }

    // Delete attachment from Firebase Storage if it exists
    if (registration?.attachmentUri && registration.attachmentUri.startsWith('https://')) {
      await deleteFileFromStorage(registration.attachmentUri);
    }

    // Finally, delete the registration
    await deleteDoc(doc(db, 'registrations', registrationId.toString()));
  } catch (error) {
    console.error('Error deleting registration with transactions:', error);
    throw error;
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
    const lessons = snapshot.docs.map((doc) => {
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

export async function addLesson(lesson: Omit<WTLesson, 'id'>): Promise<WTLesson> {
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

    return {
      ...lesson,
      id: lessonId,
    };
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
    const seminars = snapshot.docs.map((doc) => {
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
    return seminars.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error fetching seminars:', error);
    return [];
  }
}

export async function addSeminar(seminar: Omit<WTSeminar, 'id'>): Promise<WTSeminar> {
  try {
    const db = getDb();
    const seminarId = await firebaseIdManager.getNextId('seminars');

    // Create a description that includes time information like Kotlin app
    const timeInfo = `Time: ${formatTime(seminar.startHour, seminar.startMinute)}-${formatTime(seminar.endHour, seminar.endMinute)}`;
    const description = seminar.description ? `${timeInfo}, Description: ${seminar.description}` : timeInfo;

    // Convert date to Date object if it's a string
    const dateObj = typeof seminar.date === 'string' ? new Date(seminar.date) : seminar.date;

    const seminarData = {
      id: seminarId,
      name: seminar.name,
      date: Timestamp.fromDate(dateObj),
      startHour: seminar.startHour,
      startMinute: seminar.startMinute,
      endHour: seminar.endHour,
      endMinute: seminar.endMinute,
      description: description,
      location: seminar.location || null,
    };

    await setDoc(doc(db, 'seminars', seminarId.toString()), seminarData);

    return {
      ...seminar,
      id: seminarId,
    };
  } catch (error) {
    console.error('Error adding seminar:', error);
    throw error;
  }
}

// Helper function to format time like Kotlin app
function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export async function updateSeminar(seminar: WTSeminar): Promise<void> {
  try {
    const db = getDb();

    // Convert date to Date object if it's a string
    const dateObj = typeof seminar.date === 'string' ? new Date(seminar.date) : seminar.date;

    const seminarData = {
      id: seminar.id,
      name: seminar.name,
      date: Timestamp.fromDate(dateObj),
      startHour: seminar.startHour,
      startMinute: seminar.startMinute,
      endHour: seminar.endHour,
      endMinute: seminar.endMinute,
      description: seminar.description || null,
      location: seminar.location || null,
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
