export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  type: string; // "Event", "Lesson", etc.
}

// Serializable version for Redux state
export interface SerializableEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO string
  endDate?: string; // ISO string
  type: string;
  relatedId?: number; // For linking to original data
}

export interface EventFormData {
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;
  type: string;
}

// Helper functions to convert between Event and SerializableEvent
export const eventToSerializable = (event: Event): SerializableEvent => ({
  id: event.id,
  title: event.title,
  description: event.description,
  date: event.date.toISOString(),
  endDate: event.endDate?.toISOString(),
  type: event.type,
});

export const serializableToEvent = (serializableEvent: SerializableEvent): Event => ({
  id: serializableEvent.id,
  title: serializableEvent.title,
  description: serializableEvent.description,
  date: new Date(serializableEvent.date),
  endDate: serializableEvent.endDate ? new Date(serializableEvent.endDate) : undefined,
  type: serializableEvent.type,
}); 