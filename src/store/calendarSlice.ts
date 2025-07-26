import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { CalendarEvent } from '../types/WTRegistry';
import { RootState } from './index';

interface CalendarState {
  events: CalendarEvent[];
  selectedDate: string; // YYYY-MM-DD format
  showEventModal: boolean;
  selectedEvent: CalendarEvent | null;
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
export const generateCalendarEvents = createAsyncThunk(
  'calendar/generateEvents',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { students, registrations, lessons, seminars } = state.wtRegistry as any;
    const events: CalendarEvent[] = [];

    // Generate events from registrations (start and end dates)
    registrations.forEach((registration: any) => {
      const student = students.find((s: any) => s.id === registration.studentId);
      const studentName = student?.name || 'Unknown Student';

      if (registration.startDate) {
        events.push({
          id: `reg-start-${registration.id}`,
          title: `${studentName} - Registration Start`,
          description: `Registration period starts for ${studentName}. Amount: $${registration.amount}`,
          date: registration.startDate,
          type: 'registration_start',
          relatedId: registration.id,
        });
      }

      if (registration.endDate) {
        events.push({
          id: `reg-end-${registration.id}`,
          title: `${studentName} - Registration End`,
          description: `Registration period ends for ${studentName}. Amount: $${registration.amount}`,
          date: registration.endDate,
          type: 'registration_end',
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
              date: lessonDate,
              endDate: endDate,
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
        date: seminarDate,
        endDate: endDate,
        type: 'seminar',
        relatedId: seminar.id,
      });
    });

    return events;
  }
);

// Add custom calendar event
export const addCalendarEvent = createAsyncThunk(
  'calendar/addEvent',
  async (event: Omit<CalendarEvent, 'id'>) => {
    // For now, just create a local event. Could be extended to save to Firebase
    const newEvent: CalendarEvent = {
      ...event,
      id: `custom-${Date.now()}`,
    };
    return newEvent;
  }
);

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
    setSelectedEvent: (state, action: PayloadAction<CalendarEvent | null>) => {
      state.selectedEvent = action.payload;
    },
    addEventLocal: (state, action: PayloadAction<CalendarEvent>) => {
      state.events.push(action.payload);
    },
    updateEventLocal: (state, action: PayloadAction<CalendarEvent>) => {
      const index = state.events.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.events[index] = action.payload;
      }
    },
    deleteEventLocal: (state, action: PayloadAction<string>) => {
      state.events = state.events.filter(e => e.id !== action.payload);
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