export interface WTStudent {
  id: number;
  name: string;
  phoneNumber?: string;
  email?: string;
  instagram?: string;
  isActive: boolean;
  deviceId?: string;
  notes?: string;
  photoUri?: string;
}

export interface WTRegistration {
  id: number;
  studentId: number; // Reference to WTStudent id
  amount: number;
  attachmentUri?: string; // Can be local URI or Firebase Storage URL
  startDate?: Date;
  endDate?: Date;
  paymentDate: Date;
  notes?: string;
  isPaid: boolean;
  // Derived property for UI
  studentName?: string;
}

export interface WTLesson {
  id: number;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface WTSeminar {
  id: number;
  name: string;
  date: Date;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  description?: string;
  location?: string;
}

// Calendar Event interface for integrating WTRegistry events
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  type: 'registration_end' | 'registration_start' | 'lesson' | 'seminar' | 'event';
  relatedId?: number; // ID of related WTRegistry item
} 