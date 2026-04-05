/**
 * wtregistry service — REST client for huginn-external.
 *
 * Replaces the legacy Firestore implementation. All calls go through the
 * shared Huginn API client (`api`) and uploads go to Cloudflare R2 via
 * `uploadToR2` / `deleteFromR2`. Envelope unwrapping is handled by httpClient.
 *
 * Exported function names and signatures are frozen — screens and the
 * wtRegistry redux slice depend on them.
 */

import { api } from '@shared/services/api/httpClient';
import { uploadToR2, deleteFromR2 } from '@shared/services/storage/r2Storage';
import { WTStudent, WTRegistration, WTLesson, WTSeminar } from '@features/wtregistry/types/WTRegistry';
import {
  addTransaction,
  fetchTransactions,
  deleteTransaction,
  updateTransaction,
} from '@features/transactions/services/transactions';

// ──────────────────────────────────────────────────────────────────────────
// Backend row shapes (as returned by huginn-external /api/wtregistry)
// These are intentionally local — the shared `types` folder is frozen.
// ──────────────────────────────────────────────────────────────────────────

interface ApiStudent {
  id: number;
  name: string;
  phoneNumber: string | null;
  isActive: boolean;
  email: string | null;
  instagram?: string | null;
  photoUri: string | null;
  notes: string | null;
}

interface ApiRegistration {
  id: number;
  studentId: number;
  studentName?: string;
  studentPhoneNumber?: string | null;
  studentEmail?: string | null;
  amount: number;
  isPaid: boolean;
  startDate: string;
  endDate: string;
  paymentDate: string;
  notes: string | null;
  attachmentUri: string | null;
}

interface ApiLesson {
  id: number;
  date: string;
  description: string | null;
  createdAt?: string;
}

interface ApiSeminar {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Mappers
// ──────────────────────────────────────────────────────────────────────────

function toDateObj(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

function toIso(date: Date | string | undefined): string {
  if (!date) return new Date().toISOString();
  return toDateObj(date).toISOString();
}

function mapStudent(row: ApiStudent): WTStudent {
  return {
    id: row.id,
    name: row.name,
    phoneNumber: row.phoneNumber ?? undefined,
    email: row.email ?? undefined,
    isActive: row.isActive,
    notes: row.notes ?? undefined,
    photoUri: row.photoUri ?? undefined,
  };
}

function mapRegistration(row: ApiRegistration): WTRegistration {
  return {
    id: row.id,
    studentId: row.studentId,
    amount: Number(row.amount) || 0,
    attachmentUri: row.attachmentUri ?? undefined,
    startDate: row.startDate ? new Date(row.startDate) : undefined,
    endDate: row.endDate ? new Date(row.endDate) : undefined,
    paymentDate: row.paymentDate ? new Date(row.paymentDate) : new Date(),
    notes: row.notes ?? undefined,
    isPaid: row.isPaid,
    studentName: row.studentName,
  };
}

// ── Lesson encoding ───────────────────────────────────────────────────────
// Backend stores lessons as { date, description }. The mobile UI uses
// { dayOfWeek, startHour, startMinute, endHour, endMinute }. We serialise the
// mobile shape into the `description` as JSON and use a deterministic date.
// This keeps the file self-contained without touching frozen types or the
// backend schema.

const LESSON_TAG = 'WT_LESSON_V1:';

function encodeLessonDescription(lesson: Omit<WTLesson, 'id'>): string {
  return (
    LESSON_TAG +
    JSON.stringify({
      dayOfWeek: lesson.dayOfWeek,
      startHour: lesson.startHour,
      startMinute: lesson.startMinute,
      endHour: lesson.endHour,
      endMinute: lesson.endMinute,
    })
  );
}

function decodeLessonDescription(description: string | null): Omit<WTLesson, 'id'> | null {
  if (!description || !description.startsWith(LESSON_TAG)) return null;
  try {
    const parsed = JSON.parse(description.slice(LESSON_TAG.length));
    return {
      dayOfWeek: Number(parsed.dayOfWeek) || 0,
      startHour: Number(parsed.startHour) || 0,
      startMinute: Number(parsed.startMinute) || 0,
      endHour: Number(parsed.endHour) || 0,
      endMinute: Number(parsed.endMinute) || 0,
    };
  } catch {
    return null;
  }
}

// Deterministic date per day-of-week so the backend's ORDER BY date is stable.
function lessonDateFor(dayOfWeek: number): string {
  // 1970-01-04 was a Sunday. Add dayOfWeek days.
  const base = new Date(Date.UTC(1970, 0, 4 + (dayOfWeek % 7)));
  return base.toISOString();
}

function mapLesson(row: ApiLesson): WTLesson {
  const decoded = decodeLessonDescription(row.description);
  if (decoded) {
    return { id: row.id, ...decoded };
  }
  // Legacy / unknown rows: best-effort fallback.
  const d = row.date ? new Date(row.date) : new Date();
  return {
    id: row.id,
    dayOfWeek: d.getUTCDay(),
    startHour: 0,
    startMinute: 0,
    endHour: 0,
    endMinute: 0,
  };
}

function mapSeminar(row: ApiSeminar): WTSeminar {
  return {
    id: row.id,
    name: row.name,
    date: row.date ? new Date(row.date) : new Date(),
    startHour: Number(row.startHour) || 0,
    startMinute: Number(row.startMinute) || 0,
    endHour: Number(row.endHour) || 0,
    endMinute: Number(row.endMinute) || 0,
    description: row.description || undefined,
    location: row.location || undefined,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Storage helpers (R2)
// ──────────────────────────────────────────────────────────────────────────

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
};

function guessMime(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

/**
 * Upload a local file to R2. Preserves the original call signature used
 * throughout this service so the existing callers don't need to change.
 * Returns the R2 object `key` (not a URL) — the UI should resolve it via
 * `getDisplayUrl` when rendering.
 */
export async function uploadFileToStorage(
  fileUri: string,
  folderName: string,
  fileName: string,
): Promise<string | null> {
  try {
    const folder = (folderName as 'registrations' | 'students') || 'registrations';
    const result = await uploadToR2({
      uri: fileUri,
      fileName,
      mimeType: guessMime(fileName),
      folder,
      entityId: fileName.split('.')[0] || null,
    });
    return result.key;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

function looksLikeR2Key(value: string): boolean {
  // R2 keys we generate look like "folder/entityId/uuid.ext" — no scheme.
  return !/^https?:\/\//i.test(value) && !value.startsWith('file://');
}

/**
 * Delete a previously-uploaded file. Accepts an R2 key or a legacy Firebase
 * URL. Legacy URLs are no-oped (the bucket is gone) — we just log and return.
 */
export async function deleteFileFromStorage(fileUrlOrKey: string): Promise<boolean> {
  try {
    if (!fileUrlOrKey) return true;
    if (!looksLikeR2Key(fileUrlOrKey)) {
      console.log('deleteFileFromStorage: skipping legacy/non-R2 reference', fileUrlOrKey);
      return true;
    }
    await deleteFromR2(fileUrlOrKey);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Students
// ──────────────────────────────────────────────────────────────────────────

export async function fetchStudents(): Promise<WTStudent[]> {
  try {
    const rows = await api.get<ApiStudent[]>('/api/wtregistry/students');
    return rows.map(mapStudent).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

export async function addStudent(student: Omit<WTStudent, 'id'>): Promise<WTStudent> {
  try {
    const row = await api.post<ApiStudent>('/api/wtregistry/students', {
      name: student.name,
      phoneNumber: student.phoneNumber ?? '',
      email: student.email ?? null,
      isActive: student.isActive !== false,
      notes: student.notes ?? null,
      photoUri: student.photoUri ?? null,
    });
    return mapStudent(row);
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
}

export async function updateStudent(student: WTStudent): Promise<void> {
  try {
    await api.put<ApiStudent>(`/api/wtregistry/students/${student.id}`, {
      name: student.name,
      phoneNumber: student.phoneNumber ?? '',
      email: student.email ?? null,
      isActive: student.isActive !== false,
      notes: student.notes ?? null,
      photoUri: student.photoUri ?? null,
    });
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
}

export async function deleteStudent(studentId: number): Promise<void> {
  try {
    await api.delete<{ id: number }>(`/api/wtregistry/students/${studentId}`);
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Registrations
// ──────────────────────────────────────────────────────────────────────────

export async function fetchRegistrations(): Promise<WTRegistration[]> {
  try {
    const rows = await api.get<ApiRegistration[]>('/api/wtregistry/registrations');
    return rows
      .map(mapRegistration)
      .sort(
        (a, b) =>
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
      );
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

// Normalise the end date to 22:00 local time to match legacy Kotlin/Firestore
// behaviour — downstream code still expects this.
function normaliseEndDate(endDate: Date | string | undefined): Date | undefined {
  if (!endDate) return undefined;
  const d = new Date(toDateObj(endDate));
  d.setHours(22, 0, 0, 0);
  return d;
}

// Upload an attachment if it's a local URI; pass through cloud keys/URLs.
async function resolveAttachment(
  attachmentUri: string | undefined,
  registrationId: number | string,
): Promise<string | null> {
  if (!attachmentUri) return null;
  // Already a cloud reference — leave as-is.
  if (attachmentUri.startsWith('https://') || looksLikeR2KeyForRegistration(attachmentUri)) {
    return attachmentUri;
  }
  const ext = attachmentUri.split('.').pop() || 'file';
  const fileName = `${registrationId}.${ext}`;
  try {
    const result = await uploadToR2({
      uri: attachmentUri,
      fileName,
      mimeType: guessMime(fileName),
      folder: 'registrations',
      entityId: String(registrationId),
    });
    return result.key;
  } catch (err) {
    console.warn('Failed to upload attachment:', err);
    return null;
  }
}

function looksLikeR2KeyForRegistration(value: string): boolean {
  // Heuristic: R2 keys begin with "registrations/" for this feature.
  return value.startsWith('registrations/');
}

function buildRegistrationPayload(reg: Omit<WTRegistration, 'id'>, attachmentKey: string | null, finalEndDate: Date | undefined) {
  return {
    studentId: reg.studentId,
    amount: reg.amount,
    isPaid: reg.isPaid,
    startDate: toIso(reg.startDate),
    endDate: finalEndDate ? finalEndDate.toISOString() : toIso(reg.endDate),
    paymentDate: toIso(reg.paymentDate),
    notes: reg.notes ?? null,
    attachmentUri: attachmentKey,
  };
}

export async function addRegistration(
  registration: Omit<WTRegistration, 'id'>,
): Promise<WTRegistration> {
  try {
    const finalEndDate = normaliseEndDate(registration.endDate);

    // Create registration first so we have a stable id for the object key.
    const created = await api.post<ApiRegistration>(
      '/api/wtregistry/registrations',
      buildRegistrationPayload(
        registration,
        // Pass the raw attachment if it's already a cloud ref; otherwise null
        // for now — we'll PUT-update with the uploaded key below.
        registration.attachmentUri && registration.attachmentUri.startsWith('https://')
          ? registration.attachmentUri
          : null,
        finalEndDate,
      ),
    );

    let attachmentKey: string | null = created.attachmentUri ?? null;
    if (
      registration.attachmentUri &&
      !registration.attachmentUri.startsWith('https://') &&
      !looksLikeR2KeyForRegistration(registration.attachmentUri)
    ) {
      attachmentKey = await resolveAttachment(registration.attachmentUri, created.id);
      if (attachmentKey) {
        await api.put<ApiRegistration>(
          `/api/wtregistry/registrations/${created.id}`,
          buildRegistrationPayload(registration, attachmentKey, finalEndDate),
        );
      }
    }

    // If it's marked as paid, add a linked transaction (mirrors legacy).
    if (registration.isPaid && registration.amount > 0) {
      await addTransaction({
        amount: registration.amount,
        type: 'Registration',
        description: 'Course Registration',
        isIncome: true,
        date: new Date().toISOString(),
        category: 'Wing Tzun',
        relatedRegistrationId: created.id,
      });
    }

    return {
      ...registration,
      id: created.id,
      endDate: finalEndDate,
      attachmentUri: attachmentKey ?? registration.attachmentUri,
    };
  } catch (error) {
    console.error('Error adding registration:', error);
    throw error;
  }
}

export async function updateRegistration(registration: WTRegistration): Promise<void> {
  try {
    // Fetch original so we can diff payment status + attachment.
    const originalRegistrations = await fetchRegistrations();
    const originalRegistration = originalRegistrations.find((r) => r.id === registration.id);

    const finalEndDate = normaliseEndDate(registration.endDate);

    // Handle attachment change.
    let attachmentKey: string | null | undefined = registration.attachmentUri ?? null;
    const newAttachmentIsLocal =
      originalRegistration &&
      originalRegistration.attachmentUri !== registration.attachmentUri &&
      registration.attachmentUri &&
      !registration.attachmentUri.startsWith('https://') &&
      !looksLikeR2KeyForRegistration(registration.attachmentUri);

    if (newAttachmentIsLocal) {
      const uploaded = await resolveAttachment(registration.attachmentUri, registration.id);
      if (uploaded) {
        attachmentKey = uploaded;
        if (originalRegistration?.attachmentUri) {
          await deleteFileFromStorage(originalRegistration.attachmentUri);
        }
      } else {
        console.warn('Failed to upload new attachment, keeping existing value');
        attachmentKey = registration.attachmentUri ?? null;
      }
    }

    await api.put<ApiRegistration>(
      `/api/wtregistry/registrations/${registration.id}`,
      buildRegistrationPayload(registration, attachmentKey ?? null, finalEndDate),
    );

    // Mirror legacy transaction-sync logic.
    if (originalRegistration) {
      if (!originalRegistration.isPaid && registration.isPaid && registration.amount > 0) {
        await addTransaction({
          amount: registration.amount,
          type: 'Registration',
          description: 'Course Registration',
          isIncome: true,
          date: new Date().toISOString(),
          category: 'Wing Tzun',
          relatedRegistrationId: registration.id,
        });
      } else if (originalRegistration.isPaid && !registration.isPaid) {
        const transactions = await fetchTransactions();
        const related = transactions.filter((t) => t.relatedRegistrationId === registration.id);
        for (const tx of related) {
          await deleteTransaction(tx.id);
        }
      } else if (
        originalRegistration.isPaid &&
        registration.isPaid &&
        originalRegistration.amount !== registration.amount
      ) {
        const transactions = await fetchTransactions();
        const existing = transactions.find((t) => t.relatedRegistrationId === registration.id);
        if (existing) {
          await updateTransaction({ ...existing, amount: registration.amount });
        } else {
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
    if (newIsPaid === oldIsPaid) return;

    // Transaction sync first.
    if (newIsPaid && !oldIsPaid) {
      if (registration.amount > 0) {
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
      const transactions = await fetchTransactions();
      const related = transactions.find((t) => t.relatedRegistrationId === registration.id);
      if (related) await deleteTransaction(related.id);
    }

    // Patch just the payment status on the server.
    await api.patch<ApiRegistration>(
      `/api/wtregistry/registrations/${registration.id}/payment`,
      {
        isPaid: newIsPaid,
        paymentDate: toIso(registration.paymentDate),
      },
    );
  } catch (error) {
    console.error('Error updating registration payment status:', error);
    throw error;
  }
}

export async function deleteRegistration(registrationId: number): Promise<void> {
  try {
    // Fetch so we can clean up the attachment + linked transactions.
    const registrations = await fetchRegistrations();
    const registration = registrations.find((r) => r.id === registrationId);

    if (registration?.attachmentUri) {
      await deleteFileFromStorage(registration.attachmentUri);
    }

    const transactions = await fetchTransactions();
    const related = transactions.filter((t) => t.relatedRegistrationId === registrationId);
    for (const tx of related) {
      await deleteTransaction(tx.id);
    }

    await api.delete<{ id: number }>(`/api/wtregistry/registrations/${registrationId}`);
  } catch (error) {
    console.error('Error deleting registration:', error);
    throw error;
  }
}

export async function addRegistrationWithTransaction(
  reg: Omit<WTRegistration, 'id'>,
  isPaid: boolean,
) {
  try {
    const finalEndDate = normaliseEndDate(reg.endDate);

    // Create registration.
    const created = await api.post<ApiRegistration>(
      '/api/wtregistry/registrations',
      buildRegistrationPayload(
        reg,
        reg.attachmentUri && reg.attachmentUri.startsWith('https://')
          ? reg.attachmentUri
          : null,
        finalEndDate,
      ),
    );

    // Upload attachment (if local) and patch the registration with the key.
    if (
      reg.attachmentUri &&
      !reg.attachmentUri.startsWith('https://') &&
      !looksLikeR2KeyForRegistration(reg.attachmentUri)
    ) {
      const key = await resolveAttachment(reg.attachmentUri, created.id);
      if (key) {
        await api.put<ApiRegistration>(
          `/api/wtregistry/registrations/${created.id}`,
          buildRegistrationPayload(reg, key, finalEndDate),
        );
      }
    }

    // Linked transaction if paid.
    if (isPaid && reg.amount > 0) {
      await addTransaction({
        amount: reg.amount,
        type: 'Registration',
        description: 'Course Registration',
        isIncome: true,
        date: new Date().toISOString(),
        category: 'Wing Tzun',
        relatedRegistrationId: created.id,
      });
    }
  } catch (error) {
    console.error('Error adding registration with transaction:', error);
    throw error;
  }
}

export async function deleteRegistrationWithTransactions(registrationId: number) {
  try {
    const registrations = await fetchRegistrations();
    const registration = registrations.find((r) => r.id === registrationId);

    // Delete linked transactions first.
    const transactions = await fetchTransactions();
    const related = transactions.filter((t) => t.relatedRegistrationId === registrationId);
    for (const tx of related) {
      await deleteTransaction(tx.id);
    }

    if (registration?.attachmentUri) {
      await deleteFileFromStorage(registration.attachmentUri);
    }

    await api.delete<{ id: number }>(`/api/wtregistry/registrations/${registrationId}`);
  } catch (error) {
    console.error('Error deleting registration with transactions:', error);
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Lessons
// ──────────────────────────────────────────────────────────────────────────

export async function fetchLessons(): Promise<WTLesson[]> {
  try {
    const rows = await api.get<ApiLesson[]>('/api/wtregistry/lessons');
    return rows.map(mapLesson).sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
}

export async function addLesson(lesson: Omit<WTLesson, 'id'>): Promise<WTLesson> {
  try {
    const row = await api.post<ApiLesson>('/api/wtregistry/lessons', {
      date: lessonDateFor(lesson.dayOfWeek),
      description: encodeLessonDescription(lesson),
    });
    return { ...lesson, id: row.id };
  } catch (error) {
    console.error('Error adding lesson:', error);
    throw error;
  }
}

export async function updateLesson(lesson: WTLesson): Promise<void> {
  try {
    await api.put<ApiLesson>(`/api/wtregistry/lessons/${lesson.id}`, {
      date: lessonDateFor(lesson.dayOfWeek),
      description: encodeLessonDescription(lesson),
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
}

export async function deleteLesson(lessonId: number): Promise<void> {
  try {
    await api.delete<{ id: number }>(`/api/wtregistry/lessons/${lessonId}`);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Seminars
// ──────────────────────────────────────────────────────────────────────────

export async function fetchSeminars(): Promise<WTSeminar[]> {
  try {
    const rows = await api.get<ApiSeminar[]>('/api/wtregistry/seminars');
    return rows
      .map(mapSeminar)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error fetching seminars:', error);
    return [];
  }
}

export async function addSeminar(seminar: Omit<WTSeminar, 'id'>): Promise<WTSeminar> {
  try {
    const row = await api.post<ApiSeminar>('/api/wtregistry/seminars', {
      name: seminar.name,
      description: seminar.description ?? '',
      date: toIso(seminar.date),
      location: seminar.location ?? '',
      startHour: seminar.startHour,
      startMinute: seminar.startMinute,
      endHour: seminar.endHour,
      endMinute: seminar.endMinute,
    });
    return { ...seminar, id: row.id };
  } catch (error) {
    console.error('Error adding seminar:', error);
    throw error;
  }
}

export async function updateSeminar(seminar: WTSeminar): Promise<void> {
  try {
    await api.put<ApiSeminar>(`/api/wtregistry/seminars/${seminar.id}`, {
      name: seminar.name,
      description: seminar.description ?? '',
      date: toIso(seminar.date),
      location: seminar.location ?? '',
      startHour: seminar.startHour,
      startMinute: seminar.startMinute,
      endHour: seminar.endHour,
      endMinute: seminar.endMinute,
    });
  } catch (error) {
    console.error('Error updating seminar:', error);
    throw error;
  }
}

export async function deleteSeminar(seminarId: number): Promise<void> {
  try {
    await api.delete<{ id: number }>(`/api/wtregistry/seminars/${seminarId}`);
  } catch (error) {
    console.error('Error deleting seminar:', error);
    throw error;
  }
}
