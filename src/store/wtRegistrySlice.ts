import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { WTStudent, WTRegistration, WTLesson, WTSeminar } from '../types/WTRegistry';
import {
  fetchStudents, addStudent as addStudentToFirestore, updateStudent as updateStudentInFirestore, deleteStudent as deleteStudentFromFirestore,
  fetchRegistrations, addRegistration as addRegistrationToFirestore, updateRegistration as updateRegistrationInFirestore, deleteRegistration as deleteRegistrationFromFirestore,
  fetchLessons, addLesson as addLessonToFirestore, updateLesson as updateLessonInFirestore, deleteLesson as deleteLessonFromFirestore,
  fetchSeminars, addSeminar as addSeminarToFirestore, deleteSeminar as deleteSeminarFromFirestore
} from '../data/wtRegistry';

interface WTRegistryState {
  students: WTStudent[];
  registrations: WTRegistration[];
  lessons: WTLesson[];
  seminars: WTSeminar[];
  loading: boolean;
  error: string | null;
}

const initialState: WTRegistryState = {
  students: [],
  registrations: [],
  lessons: [],
  seminars: [],
  loading: false,
  error: null,
};

// Async thunks for Students
export const loadStudents = createAsyncThunk('wtRegistry/loadStudents', async () => {
  return await fetchStudents();
});

export const addStudent = createAsyncThunk('wtRegistry/addStudent', async (student: Omit<WTStudent, 'id'>) => {
  return await addStudentToFirestore(student);
});

export const updateStudent = createAsyncThunk('wtRegistry/updateStudent', async (student: WTStudent) => {
  await updateStudentInFirestore(student);
  return student;
});

export const deleteStudent = createAsyncThunk('wtRegistry/deleteStudent', async (studentId: number) => {
  await deleteStudentFromFirestore(studentId);
  return studentId;
});

// Async thunks for Registrations
export const loadRegistrations = createAsyncThunk('wtRegistry/loadRegistrations', async () => {
  return await fetchRegistrations();
});

export const addRegistration = createAsyncThunk('wtRegistry/addRegistration', async (registration: Omit<WTRegistration, 'id' | 'paymentDate'>) => {
  const newRegistration = await addRegistrationToFirestore({
    ...registration,
    paymentDate: new Date(),
  });
  return newRegistration;
});

export const updateRegistration = createAsyncThunk('wtRegistry/updateRegistration', async (registration: WTRegistration) => {
  await updateRegistrationInFirestore(registration);
  return registration;
});

export const deleteRegistration = createAsyncThunk('wtRegistry/deleteRegistration', async (registrationId: number) => {
  await deleteRegistrationFromFirestore(registrationId);
  return registrationId;
});

// Async thunks for Lessons
export const loadLessons = createAsyncThunk('wtRegistry/loadLessons', async () => {
  return await fetchLessons();
});

export const addLesson = createAsyncThunk('wtRegistry/addLesson', async (lesson: Omit<WTLesson, 'id'>) => {
  return await addLessonToFirestore(lesson);
});

export const updateLesson = createAsyncThunk('wtRegistry/updateLesson', async (lesson: WTLesson) => {
  await updateLessonInFirestore(lesson);
  return lesson;
});

export const deleteLesson = createAsyncThunk('wtRegistry/deleteLesson', async (lessonId: number) => {
  await deleteLessonFromFirestore(lessonId);
  return lessonId;
});

// Async thunks for Seminars
export const loadSeminars = createAsyncThunk('wtRegistry/loadSeminars', async () => {
  return await fetchSeminars();
});

export const addSeminar = createAsyncThunk('wtRegistry/addSeminar', async (seminar: Omit<WTSeminar, 'id'>) => {
  return await addSeminarToFirestore(seminar);
});

export const deleteSeminar = createAsyncThunk('wtRegistry/deleteSeminar', async (seminarId: number) => {
  await deleteSeminarFromFirestore(seminarId);
  return seminarId;
});

const wtRegistrySlice = createSlice({
  name: 'wtRegistry',
  initialState,
  reducers: {
    setStudents: (state, action: PayloadAction<WTStudent[]>) => {
      state.students = action.payload;
    },
    addStudentLocal: (state, action: PayloadAction<WTStudent>) => {
      state.students.push(action.payload);
    },
    updateStudentLocal: (state, action: PayloadAction<WTStudent>) => {
      const index = state.students.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.students[index] = action.payload;
      }
    },
    deleteStudentLocal: (state, action: PayloadAction<number>) => {
      state.students = state.students.filter(s => s.id !== action.payload);
    },
    setRegistrations: (state, action: PayloadAction<WTRegistration[]>) => {
      state.registrations = action.payload;
    },
    addRegistrationLocal: (state, action: PayloadAction<WTRegistration>) => {
      state.registrations.push(action.payload);
    },
    updateRegistrationLocal: (state, action: PayloadAction<WTRegistration>) => {
      const index = state.registrations.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.registrations[index] = action.payload;
      }
    },
    deleteRegistrationLocal: (state, action: PayloadAction<number>) => {
      state.registrations = state.registrations.filter(r => r.id !== action.payload);
    },
    setLessons: (state, action: PayloadAction<WTLesson[]>) => {
      state.lessons = action.payload;
    },
    addLessonLocal: (state, action: PayloadAction<WTLesson>) => {
      state.lessons.push(action.payload);
    },
    updateLessonLocal: (state, action: PayloadAction<WTLesson>) => {
      const index = state.lessons.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.lessons[index] = action.payload;
      }
    },
    deleteLessonLocal: (state, action: PayloadAction<number>) => {
      state.lessons = state.lessons.filter(l => l.id !== action.payload);
    },
    setSeminars: (state, action: PayloadAction<WTSeminar[]>) => {
      state.seminars = action.payload;
    },
    addSeminarLocal: (state, action: PayloadAction<WTSeminar>) => {
      state.seminars.push(action.payload);
    },
    deleteSeminarLocal: (state, action: PayloadAction<number>) => {
      state.seminars = state.seminars.filter(s => s.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Students
      .addCase(loadStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload;
      })
      .addCase(loadStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load students';
      })
      .addCase(addStudent.fulfilled, (state, action) => {
        state.students.push(action.payload);
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        const index = state.students.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.students[index] = action.payload;
        }
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.students = state.students.filter(s => s.id !== action.payload);
      })
      // Registrations
      .addCase(loadRegistrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRegistrations.fulfilled, (state, action) => {
        state.loading = false;
        state.registrations = action.payload;
      })
      .addCase(loadRegistrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load registrations';
      })
      .addCase(addRegistration.fulfilled, (state, action) => {
        state.registrations.push(action.payload);
      })
      .addCase(updateRegistration.fulfilled, (state, action) => {
        const index = state.registrations.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.registrations[index] = action.payload;
        }
      })
      .addCase(deleteRegistration.fulfilled, (state, action) => {
        state.registrations = state.registrations.filter(r => r.id !== action.payload);
      })
      // Lessons
      .addCase(loadLessons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadLessons.fulfilled, (state, action) => {
        state.loading = false;
        state.lessons = action.payload;
      })
      .addCase(loadLessons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load lessons';
      })
      .addCase(addLesson.fulfilled, (state, action) => {
        state.lessons.push(action.payload);
      })
      .addCase(updateLesson.fulfilled, (state, action) => {
        const index = state.lessons.findIndex(l => l.id === action.payload.id);
        if (index !== -1) {
          state.lessons[index] = action.payload;
        }
      })
      .addCase(deleteLesson.fulfilled, (state, action) => {
        state.lessons = state.lessons.filter(l => l.id !== action.payload);
      })
      // Seminars
      .addCase(loadSeminars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSeminars.fulfilled, (state, action) => {
        state.loading = false;
        state.seminars = action.payload;
      })
      .addCase(loadSeminars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load seminars';
      })
      .addCase(addSeminar.fulfilled, (state, action) => {
        state.seminars.push(action.payload);
      })
      .addCase(deleteSeminar.fulfilled, (state, action) => {
        state.seminars = state.seminars.filter(s => s.id !== action.payload);
      });
  },
});

export const {
  setStudents, addStudentLocal, updateStudentLocal, deleteStudentLocal,
  setRegistrations, addRegistrationLocal, updateRegistrationLocal, deleteRegistrationLocal,
  setLessons, addLessonLocal, updateLessonLocal, deleteLessonLocal,
  setSeminars, addSeminarLocal, deleteSeminarLocal,
  setLoading, setError,
} = wtRegistrySlice.actions;

export default wtRegistrySlice.reducer; 