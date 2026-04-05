import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CalendarEvent } from '@features/wtregistry/types/WTRegistry';
import { SerializableEvent } from '@features/calendar/types/Event';
import { RootState } from '@shared/store/rootStore';

// NOTE: `events` in this slice holds WTRegistry-synthetic events only
// (lessons, seminars, registration start/end). Remote persisted calendar
// events go through React Query (@shared/hooks/useCalendarQueries). Kept the
// field name `events` for minimum downstream churn.
interface CalendarState {
  events: SerializableEvent[];
  selectedDate: string; // YYYY-MM-DD format
  showEventModal: boolean;
  selectedEvent: SerializableEvent | null;
  loading: boolean;
  error: string | null;
}

const initialState: CalendarState = {
  events: [],
  selectedDate: new Date().toISOString().split('T')[0],
  showEventModal: false,
  selectedEvent: null,
  loading: false,
  error: null,
};

// Generate calendar events from WTRegistry data
export const generateCalendarEvents = createAsyncThunk('calendar/generateEvents', async (_, { getState }) => {
  const state = getState() as RootState;
  const { students, registrations, lessons, seminars } = state.wtRegistry as any;
  const events: SerializableEvent[] = [];

  // Generate events from registrations (start and end dates)
  registrations.forEach((registration: any) => {
    const student = students.find((s: any) => s.id === registration.studentId);
    const studentName = student?.name || 'Unknown Student';

    if (registration.startDate) {
      events.push({
        id: `reg-start-${registration.id}`,
        title: `${studentName} - Registration Start`,
        description: `Registration period starts for ${studentName}. Amount: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(registration.amount)}`,
        date: new Date(registration.startDate).toISOString(),
        type: 'Registration Start',
        relatedId: registration.id,
      });
    }

    if (registration.endDate) {
      events.push({
        id: `reg-end-${registration.id}`,
        title: `${studentName} - Registration End`,
        description: `Registration period ends for ${studentName}. Amount: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(registration.amount)}`,
        date: new Date(registration.endDate).toISOString(),
        type: 'Registration End',
        relatedId: registration.id,
      });
    }
  });

  // Generate recurring events from lessons for the current month and next month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Generate for current and next 2 months
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const targetMonth = currentMonth + monthOffset;
    const targetYear = currentYear + Math.floor(targetMonth / 12);
    const actualMonth = targetMonth % 12;

    lessons.forEach((lesson: any) => {
      const daysInMonth = new Date(targetYear, actualMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(targetYear, actualMonth, day);

        // Check if this day matches the lesson's day of week
        if (date.getDay() === lesson.dayOfWeek) {
          const lessonDate = new Date(date);
          lessonDate.setHours(lesson.startHour, lesson.startMinute, 0, 0);

          const endDate = new Date(date);
          endDate.setHours(lesson.endHour, lesson.endMinute, 0, 0);

          events.push({
            id: `lesson-${lesson.id}-${date.toISOString().split('T')[0]}`,
            title: 'Wing Tzun Lesson',
            description: `Lesson from ${lesson.startHour.toString().padStart(2, '0')}:${lesson.startMinute.toString().padStart(2, '0')} to ${lesson.endHour.toString().padStart(2, '0')}:${lesson.endMinute.toString().padStart(2, '0')}`,
            date: lessonDate.toISOString(),
            endDate: endDate.toISOString(),
            type: 'lesson',
            relatedId: lesson.id,
          });
        }
      }
    });
  }

  // Generate events from seminars
  seminars.forEach((seminar: any) => {
    const seminarDate = new Date(seminar.date);
    seminarDate.setHours(seminar.startHour, seminar.startMinute, 0, 0);

    const endDate = new Date(seminar.date);
    endDate.setHours(seminar.endHour, seminar.endMinute, 0, 0);

    events.push({
      id: `seminar-${seminar.id}`,
      title: seminar.name,
      description: `${seminar.description || 'Wing Tzun Seminar'} ${seminar.location ? `at ${seminar.location}` : ''}`,
      date: seminarDate.toISOString(),
      endDate: endDate.toISOString(),
      type: 'seminar',
      relatedId: seminar.id,
    });
  });

  return events;
});

// Add custom calendar event (legacy - prefer useAddCalendarEvent from @shared/hooks)
export const addCalendarEvent = createAsyncThunk('calendar/addEvent', async (event: Omit<CalendarEvent, 'id'>) => {
  // For now, just create a local event. Could be extended to persist remotely
  const newEvent: SerializableEvent = {
    ...event,
    id: `custom-${Date.now()}`,
    date: event.date.toISOString(),
    endDate: event.endDate?.toISOString(),
  };
  return newEvent;
});

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setShowEventModal: (state, action: PayloadAction<boolean>) => {
      state.showEventModal = action.payload;
    },
    setSelectedEvent: (state, action: PayloadAction<SerializableEvent | null>) => {
      state.selectedEvent = action.payload;
    },
    addEventLocal: (state, action: PayloadAction<SerializableEvent>) => {
      state.events.push(action.payload);
    },
    updateEventLocal: (state, action: PayloadAction<SerializableEvent>) => {
      const index = state.events.findIndex((e) => e.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },
    deleteEventLocal: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter((e) => e.id !== action.payload);
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
      // WTRegistry events
      .addCase(generateCalendarEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateCalendarEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(generateCalendarEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to generate calendar events';
      })
      .addCase(addCalendarEvent.fulfilled, (state, action) => {
        state.events.push(action.payload);
      });
  },
});

export const {
  setSelectedDate,
  setShowEventModal,
  setSelectedEvent,
  addEventLocal,
  updateEventLocal,
  deleteEventLocal,
  setLoading,
  setError,
} = calendarSlice.actions;

export default calendarSlice.reducer;
